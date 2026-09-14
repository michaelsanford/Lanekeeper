import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type { Task, Lane, ProjectMetadata, Subtask } from '../types/index.js';
import { getNextTaskKey } from './leases.js';

class CrdtStore {
  public doc: Y.Doc;
  public persistence: IndexeddbPersistence | null = null;
  public isSynced: boolean = false;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.doc = new Y.Doc();
    this.initializePersistence('lanekeeper_default_project');
    this.setupListeners();
  }

  public initializePersistence(docName: string): void {
    if (this.persistence) {
      this.persistence.destroy();
      this.persistence = null;
    }
    if (typeof indexedDB !== 'undefined') {
      this.persistence = new IndexeddbPersistence(docName, this.doc);
      this.persistence.on('synced', () => {
        this.isSynced = true;
        this.ensureDefaultLanes();
        this.notifyListeners();
      });
    } else {
      this.isSynced = true;
      this.ensureDefaultLanes();
    }
  }

  private setupListeners(): void {
    this.doc.on('update', () => {
      this.notifyListeners();
    });
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener();
    }
  }

  public ensureDefaultLanes(): void {
    const lanesMap = this.doc.getMap<Lane>('lanes');
    const laneOrder = this.doc.getArray<string>('laneOrder');
    const metaMap = this.doc.getMap<string>('metadata');

    if (laneOrder.length === 0) {
      metaMap.set('id', 'default');
      metaMap.set('name', 'Lanekeeper Core');
      metaMap.set('prefix', 'LK');

      const defaultLanes: Lane[] = [
        { id: 'triage', name: 'Triage / Inbox', color: '#64748b', type: 'backlog' },
        { id: 'backlog', name: 'Backlog', color: '#8b5cf6', type: 'unstarted' },
        { id: 'todo', name: 'To Do', color: '#3b82f6', type: 'unstarted' },
        { id: 'inprogress', name: 'In Progress', color: '#f59e0b', type: 'started', wipLimit: 3 },
        { id: 'review', name: 'Review', color: '#06b6d4', type: 'started' },
        { id: 'done', name: 'Done', color: '#10b981', type: 'completed' }
      ];

      for (const lane of defaultLanes) {
        lanesMap.set(lane.id, lane);
        laneOrder.push([lane.id]);
      }
    }
  }

  public getMetadata(): ProjectMetadata {
    const metaMap = this.doc.getMap<string>('metadata');
    return {
      id: metaMap.get('id') || 'default',
      name: metaMap.get('name') || 'Lanekeeper Core',
      prefix: metaMap.get('prefix') || 'LK'
    };
  }

  public updateMetadata(updates: Partial<ProjectMetadata>): void {
    const metaMap = this.doc.getMap<string>('metadata');
    if (updates.name) metaMap.set('name', updates.name);
    if (updates.prefix) metaMap.set('prefix', updates.prefix.toUpperCase());

    // Update in stored projects list
    const currentId = metaMap.get('id') || 'default';
    const list = this.getProjectsList();
    const updatedList = list.map((p) =>
      p.id === currentId
        ? { ...p, name: updates.name || p.name, prefix: updates.prefix || p.prefix }
        : p
    );
    this.saveProjectsList(updatedList);
    this.notifyListeners();
  }

  public getProjectsList(): ProjectMetadata[] {
    try {
      const raw = localStorage.getItem('lanekeeper_projects_list');
      if (raw) return JSON.parse(raw);
    } catch {}
    return [{ id: 'default', name: 'Lanekeeper Core', prefix: 'LK' }];
  }

  private saveProjectsList(projects: ProjectMetadata[]): void {
    try {
      localStorage.setItem('lanekeeper_projects_list', JSON.stringify(projects));
    } catch {}
  }

  public createProject(name: string, prefix: string): ProjectMetadata {
    const id = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newProject: ProjectMetadata = {
      id: `${id}-${Date.now().toString().slice(-4)}`,
      name,
      prefix: prefix.toUpperCase()
    };
    const current = this.getProjectsList();
    this.saveProjectsList([...current, newProject]);
    this.switchProject(newProject.id, newProject.name, newProject.prefix);
    return newProject;
  }

  public switchProject(projectId: string, name?: string, prefix?: string): void {
    this.doc = new Y.Doc();
    this.initializePersistence(`lanekeeper_project_${projectId}`);
    const metaMap = this.doc.getMap<string>('metadata');
    metaMap.set('id', projectId);
    if (name) metaMap.set('name', name);
    if (prefix) metaMap.set('prefix', prefix.toUpperCase());
    this.ensureDefaultLanes();
    this.setupListeners();
    this.notifyListeners();
  }

  public getLanes(): Lane[] {
    const lanesMap = this.doc.getMap<Lane>('lanes');
    const laneOrder = this.doc.getArray<string>('laneOrder').toArray();
    const result: Lane[] = [];
    for (const id of laneOrder) {
      const lane = lanesMap.get(id);
      if (lane) result.push(lane);
    }
    return result;
  }

  public addLane(name: string, color = '#6366f1', type: any = 'unstarted', wipLimit?: number): Lane {
    const laneId = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(100 + Math.random() * 900);
    const lane: Lane = { id: laneId, name, color, type, wipLimit };
    const lanesMap = this.doc.getMap<Lane>('lanes');
    const laneOrder = this.doc.getArray<string>('laneOrder');
    lanesMap.set(laneId, lane);
    laneOrder.push([laneId]);
    this.notifyListeners();
    return lane;
  }

  public updateLane(laneId: string, updates: Partial<Lane>): void {
    const lanesMap = this.doc.getMap<Lane>('lanes');
    const existing = lanesMap.get(laneId);
    if (existing) {
      lanesMap.set(laneId, { ...existing, ...updates });
      this.notifyListeners();
    }
  }

  public deleteLane(laneId: string): void {
    const lanesMap = this.doc.getMap<Lane>('lanes');
    const laneOrder = this.doc.getArray<string>('laneOrder');

    const orderArr = laneOrder.toArray();
    const idx = orderArr.indexOf(laneId);
    if (idx !== -1) {
      laneOrder.delete(idx, 1);
    }
    lanesMap.delete(laneId);

    // Reassign tasks to remaining lane
    const fallbackLane = laneOrder.length > 0 ? laneOrder.get(0) : 'triage';
    const tasksMap = this.doc.getMap<Task>('tasks');
    for (const [taskId, task] of tasksMap.entries()) {
      if (task.laneId === laneId) {
        tasksMap.set(taskId, { ...task, laneId: fallbackLane });
      }
    }
    this.notifyListeners();
  }

  public getTasks(): Task[] {
    const tasksMap = this.doc.getMap<Task>('tasks');
    return Array.from(tasksMap.values());
  }

  public addTask(taskData: Partial<Task> & { title: string }): Task {
    const meta = this.getMetadata();
    const taskId = crypto.randomUUID();
    const taskKey = taskData.key || getNextTaskKey(meta.prefix);
    const now = new Date().toISOString();

    const task: Task = {
      id: taskId,
      key: taskKey,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'none',
      estimateMinutes: taskData.estimateMinutes,
      dueDate: taskData.dueDate,
      assigneeId: taskData.assigneeId,
      laneId: taskData.laneId || 'triage',
      rank: taskData.rank || `0|${Date.now()}:`,
      tags: taskData.tags || [],
      subtasks: taskData.subtasks || [],
      timeSpentSeconds: 0,
      createdAt: now,
      updatedAt: now
    };

    const tasksMap = this.doc.getMap<Task>('tasks');
    tasksMap.set(taskId, task);
    return task;
  }

  public updateTask(taskId: string, updates: Partial<Task>): void {
    const tasksMap = this.doc.getMap<Task>('tasks');
    const existing = tasksMap.get(taskId);
    if (existing) {
      const updated: Task = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString()
      };
      tasksMap.set(taskId, updated);
    }
  }

  public deleteTask(taskId: string): void {
    const tasksMap = this.doc.getMap<Task>('tasks');
    tasksMap.delete(taskId);
  }

  public moveTask(taskId: string, targetLaneId: string, newRank: string): void {
    this.updateTask(taskId, {
      laneId: targetLaneId,
      rank: newRank
    });
  }

  public toggleSubtask(taskId: string, subtaskId: string): void {
    const tasksMap = this.doc.getMap<Task>('tasks');
    const task = tasksMap.get(taskId);
    if (!task) return;

    const subtasks = task.subtasks.map((st) =>
      st.id === subtaskId ? { ...st, completed: !st.completed } : st
    );

    this.updateTask(taskId, { subtasks });
  }

  public addSubtask(taskId: string, title: string): void {
    const tasksMap = this.doc.getMap<Task>('tasks');
    const task = tasksMap.get(taskId);
    if (!task || !title.trim()) return;

    const newSubtask: Subtask = {
      id: crypto.randomUUID(),
      title: title.trim(),
      completed: false
    };

    this.updateTask(taskId, {
      subtasks: [...task.subtasks, newSubtask]
    });
  }

  public promoteSubtaskToTask(parentTaskId: string, subtaskId: string): Task | null {
    const tasksMap = this.doc.getMap<Task>('tasks');
    const parent = tasksMap.get(parentTaskId);
    if (!parent) return null;

    const subtask = parent.subtasks.find((st) => st.id === subtaskId);
    if (!subtask) return null;

    // 1. Remove from parent's checklist
    const remainingSubtasks = parent.subtasks.filter((st) => st.id !== subtaskId);
    this.updateTask(parentTaskId, { subtasks: remainingSubtasks });

    // 2. Create new child task with parent reference
    const childTask = this.addTask({
      title: subtask.title,
      description: `> 🔗 Child task promoted from parent **${parent.key}** (${parent.title})\n\n`,
      priority: parent.priority,
      laneId: parent.laneId,
      tags: [...parent.tags]
    });

    return childTask;
  }

  public toggleTimer(taskId: string): void {
    const tasksMap = this.doc.getMap<Task>('tasks');
    const task = tasksMap.get(taskId);
    if (!task) return;

    const now = Date.now();
    if (task.isTimerRunning && task.timerStartedAt) {
      const elapsedSeconds = Math.floor((now - task.timerStartedAt) / 1000);
      this.updateTask(taskId, {
        isTimerRunning: false,
        timerStartedAt: undefined,
        timeSpentSeconds: (task.timeSpentSeconds || 0) + elapsedSeconds
      });
    } else {
      this.updateTask(taskId, {
        isTimerRunning: true,
        timerStartedAt: now
      });
    }
  }
}

export const crdtStore = new CrdtStore();
