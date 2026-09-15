import * as Y from 'yjs';
import { IndexeddbPersistence } from 'y-indexeddb';
import type { Task, Lane, ProjectMetadata, Subtask } from '../types/index.js';
import { getNextTaskKey } from './leases.js';
import { getRankBetween, sortTasksByRank } from '../utils/rank.js';
import {
  getWorkflowTemplate,
  DEFAULT_TEMPLATE_ID
} from '../utils/templates.js';

class CrdtStore {
  public doc: Y.Doc;
  public persistence: IndexeddbPersistence | null = null;
  public isSynced: boolean = false;
  private listeners: Set<() => void> = new Set();
  private memoryDocs: Map<string, Y.Doc> = new Map();

  constructor() {
    this.doc = new Y.Doc();
    const activeId = this.getActiveProjectId();
    const docName = this.getPersistenceDocName(activeId);
    if (typeof indexedDB === 'undefined') {
      this.memoryDocs.set(docName, this.doc);
    }
    this.initializePersistence(docName);
    this.setupListeners();
  }

  public getActiveProjectId(): string {
    try {
      return localStorage.getItem('lanekeeper_active_project_id') || 'default';
    } catch {
      return 'default';
    }
  }

  public setActiveProjectId(projectId: string): void {
    try {
      localStorage.setItem('lanekeeper_active_project_id', projectId);
    } catch {}
  }

  private getPersistenceDocName(projectId: string): string {
    return projectId === 'default' ? 'lanekeeper_default_project' : `lanekeeper_project_${projectId}`;
  }

  public initializePersistence(docName: string, templateId?: string): void {
    if (this.persistence) {
      this.persistence.destroy();
      this.persistence = null;
    }
    if (typeof indexedDB !== 'undefined') {
      this.persistence = new IndexeddbPersistence(docName, this.doc);
      this.persistence.on('synced', () => {
        this.isSynced = true;
        this.ensureDefaultLanes(templateId);
        this.notifyListeners();
      });
    } else {
      this.isSynced = true;
      this.ensureDefaultLanes(templateId);
    }
  }

  private setupListeners(): void {
    this.doc.on('update', () => {
      const metaMap = this.doc.getMap<string>('metadata');
      if (metaMap.get('name') === 'General') {
        const activeId = metaMap.get('id') || this.getActiveProjectId() || 'default';
        const projectFromList = this.getProjectsList().find((p) => p.id === activeId);
        metaMap.set('name', projectFromList?.name || (activeId === 'default' ? 'Lanekeeper Core' : activeId));
      }
      this.sanitizeLaneOrder();
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

  public ensureDefaultLanes(preferredTemplateId?: string): void {
    const lanesMap = this.doc.getMap<Lane>('lanes');
    const laneOrder = this.doc.getArray<string>('laneOrder');
    const metaMap = this.doc.getMap<string>('metadata');

    const activeId = metaMap.get('id') || this.getActiveProjectId() || 'default';
    metaMap.set('id', activeId);
    const existingProject = this.getProjectsList().find((p) => p.id === activeId);
    const currentName = metaMap.get('name');
    if (!currentName || currentName === 'General') {
      metaMap.set('name', existingProject?.name || (activeId === 'default' ? 'Lanekeeper Core' : activeId));
    }
    if (!metaMap.has('prefix')) metaMap.set('prefix', existingProject?.prefix || (activeId === 'default' ? 'LK' : 'KEY'));

    // Only populate if lanesMap is empty (new project or fresh store)
    if (lanesMap.size === 0) {
      const templateId = preferredTemplateId || metaMap.get('templateId') || DEFAULT_TEMPLATE_ID;
      const template = getWorkflowTemplate(templateId);
      metaMap.set('templateId', template.id);

      for (const lane of template.lanes) {
        lanesMap.set(lane.id, lane);
        laneOrder.push([lane.id]);
      }
    }

    this.sanitizeLaneOrder();
    this.deduplicateTasks();
  }

  public sanitizeLaneOrder(): void {
    const laneOrder = this.doc.getArray<string>('laneOrder');
    const lanesMap = this.doc.getMap<Lane>('lanes');
    const orderArr = laneOrder.toArray();
    const seen = new Set<string>();
    const toDelete: number[] = [];

    for (let i = 0; i < orderArr.length; i++) {
      const id = orderArr[i];
      if (seen.has(id)) {
        toDelete.push(i);
      } else {
        seen.add(id);
      }
    }

    // Delete duplicates backwards so indices remain valid
    for (let i = toDelete.length - 1; i >= 0; i--) {
      laneOrder.delete(toDelete[i], 1);
    }

    // Ensure all defined lanes are represented in laneOrder
    for (const id of lanesMap.keys()) {
      if (!seen.has(id)) {
        laneOrder.push([id]);
        seen.add(id);
      }
    }
  }

  public deduplicateTasks(): number {
    const tasksMap = this.doc.getMap<Task>('tasks');
    const tasks = Array.from(tasksMap.values());
    tasks.sort((a, b) => (a.createdAt > b.createdAt ? 1 : -1));
    const seenTitles = new Set<string>();
    let removed = 0;

    for (const t of tasks) {
      const norm = t.title.trim().toLowerCase();
      if (seenTitles.has(norm)) {
        tasksMap.delete(t.id);
        removed++;
      } else {
        seenTitles.add(norm);
      }
    }
    return removed;
  }

  public getMetadata(): ProjectMetadata {
    const metaMap = this.doc.getMap<string>('metadata');
    const activeId = metaMap.get('id') || this.getActiveProjectId() || 'default';
    const projectFromList = this.getProjectsList().find((p) => p.id === activeId);
    const rawName = metaMap.get('name');
    const resolvedName = (rawName && rawName !== 'General')
      ? rawName
      : (projectFromList?.name || (activeId === 'default' ? 'Lanekeeper Core' : activeId));

    if (rawName === 'General') {
      metaMap.set('name', resolvedName);
    }

    return {
      id: activeId,
      name: resolvedName,
      prefix: metaMap.get('prefix') || projectFromList?.prefix || 'LK',
      description: metaMap.get('description'),
      templateId: metaMap.get('templateId') || projectFromList?.templateId || DEFAULT_TEMPLATE_ID
    };
  }

  public updateMetadata(updates: Partial<ProjectMetadata>): void {
    const metaMap = this.doc.getMap<string>('metadata');
    if (updates.name) metaMap.set('name', updates.name);
    if (updates.prefix) metaMap.set('prefix', updates.prefix.toUpperCase());
    if (updates.description !== undefined) metaMap.set('description', updates.description);
    if (updates.templateId) metaMap.set('templateId', updates.templateId);

    // Update in stored projects list
    const currentId = metaMap.get('id') || this.getActiveProjectId() || 'default';
    const list = this.getProjectsList();
    const updatedList = list.map((p) =>
      p.id === currentId
        ? {
            ...p,
            name: updates.name || p.name,
            prefix: updates.prefix || p.prefix,
            description: updates.description !== undefined ? updates.description : p.description,
            templateId: updates.templateId || p.templateId
          }
        : p
    );
    this.saveProjectsList(updatedList);
    this.notifyListeners();
  }

  public getProjectsList(): ProjectMetadata[] {
    try {
      const raw = localStorage.getItem('lanekeeper_projects_list');
      if (raw) {
        const parsed: ProjectMetadata[] = JSON.parse(raw);
        return parsed.map((p) => ({
          ...p,
          templateId: p.templateId || DEFAULT_TEMPLATE_ID
        }));
      }
    } catch {}
    return [{ id: 'default', name: 'Lanekeeper Core', prefix: 'LK', templateId: DEFAULT_TEMPLATE_ID }];
  }

  private saveProjectsList(projects: ProjectMetadata[]): void {
    try {
      localStorage.setItem('lanekeeper_projects_list', JSON.stringify(projects));
    } catch {}
  }

  public createProject(
    name: string,
    prefix: string,
    templateId: string = DEFAULT_TEMPLATE_ID
  ): ProjectMetadata {
    const id = prefix.toLowerCase().replace(/[^a-z0-9]/g, '');
    const newProject: ProjectMetadata = {
      id: `${id}-${Date.now().toString().slice(-4)}`,
      name,
      prefix: prefix.toUpperCase(),
      templateId
    };
    const current = this.getProjectsList();
    this.saveProjectsList([...current, newProject]);
    this.switchProject(newProject.id, newProject.name, newProject.prefix, templateId);
    return newProject;
  }

  public switchProject(
    projectId: string,
    name?: string,
    prefix?: string,
    templateId?: string
  ): void {
    const existing = this.getProjectsList().find((p) => p.id === projectId);
    const resolvedName = name || existing?.name;
    const resolvedPrefix = prefix || existing?.prefix;
    const resolvedTemplateId = templateId || existing?.templateId || DEFAULT_TEMPLATE_ID;

    this.setActiveProjectId(projectId);
    const docName = this.getPersistenceDocName(projectId);
    if (typeof indexedDB === 'undefined') {
      if (!this.memoryDocs.has(docName)) {
        this.memoryDocs.set(docName, new Y.Doc());
      }
      this.doc = this.memoryDocs.get(docName)!;
    } else {
      this.doc = new Y.Doc();
    }

    this.initializePersistence(docName, resolvedTemplateId);
    const metaMap = this.doc.getMap<string>('metadata');
    metaMap.set('id', projectId);
    if (resolvedName) metaMap.set('name', resolvedName);
    if (resolvedPrefix) metaMap.set('prefix', resolvedPrefix.toUpperCase());
    if (resolvedTemplateId) metaMap.set('templateId', resolvedTemplateId);
    this.setupListeners();
    this.notifyListeners();
  }

  public applyWorkflowTemplate(
    templateId: string,
    options?: { preserveTasks?: boolean }
  ): void {
    const template = getWorkflowTemplate(templateId);
    const lanesMap = this.doc.getMap<Lane>('lanes');
    const laneOrder = this.doc.getArray<string>('laneOrder');
    const metaMap = this.doc.getMap<string>('metadata');
    const tasksMap = this.doc.getMap<Task>('tasks');

    const preserve = options?.preserveTasks !== false;
    const newLanes = template.lanes;
    const newLaneIds = new Set(newLanes.map((l) => l.id));
    const firstLaneId = newLanes[0]?.id || 'todo';

    this.doc.transact(() => {
      if (preserve && tasksMap.size > 0) {
        for (const [taskId, task] of tasksMap.entries()) {
          if (!newLaneIds.has(task.laneId)) {
            const oldLane = lanesMap.get(task.laneId);
            let targetLaneId = firstLaneId;
            if (oldLane) {
              const matchingTypeLane = newLanes.find((l) => l.type === oldLane.type);
              if (matchingTypeLane) {
                targetLaneId = matchingTypeLane.id;
              }
            }
            tasksMap.set(taskId, {
              ...task,
              laneId: targetLaneId,
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      // Clear lanesMap first so listeners don't re-inject old lanes
      for (const key of Array.from(lanesMap.keys())) {
        lanesMap.delete(key);
      }

      // Clear laneOrder array
      if (laneOrder.length > 0) {
        laneOrder.delete(0, laneOrder.length);
      }

      // Insert new template lanes
      for (const lane of newLanes) {
        lanesMap.set(lane.id, lane);
        laneOrder.push([lane.id]);
      }

      metaMap.set('templateId', template.id);
    });

    const currentId = metaMap.get('id') || this.getActiveProjectId() || 'default';
    const list = this.getProjectsList();
    const updatedList = list.map((p) =>
      p.id === currentId ? { ...p, templateId: template.id } : p
    );
    this.saveProjectsList(updatedList);

    this.notifyListeners();
  }

  public getLanes(): Lane[] {
    const lanesMap = this.doc.getMap<Lane>('lanes');
    const laneOrder = this.doc.getArray<string>('laneOrder').toArray();
    const result: Lane[] = [];
    const seen = new Set<string>();

    for (const id of laneOrder) {
      if (!seen.has(id)) {
        seen.add(id);
        const lane = lanesMap.get(id);
        if (lane) result.push(lane);
      }
    }
    return result;
  }

  public addLane(
    name: string,
    color = '#6366f1',
    type: any = 'unstarted',
    wipLimit?: number,
    icon?: string
  ): Lane {
    const laneId = name.toLowerCase().replace(/[^a-z0-9]/g, '') + '-' + Math.floor(100 + Math.random() * 900);
    const lane: Lane = { id: laneId, name, color, type, wipLimit, icon: icon || 'buoy' };
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
    const laneId = taskData.laneId || 'triage';

    let rank = taskData.rank;
    if (!rank) {
      const laneTasks = sortTasksByRank(this.getTasks().filter((t) => t.laneId === laneId));
      const lastTask = laneTasks[laneTasks.length - 1];
      rank = getRankBetween(lastTask?.rank, undefined);
    }

    const task: Task = {
      id: taskId,
      key: taskKey,
      title: taskData.title,
      description: taskData.description || '',
      priority: taskData.priority || 'none',
      estimateMinutes: taskData.estimateMinutes,
      dueDate: taskData.dueDate,
      assigneeId: taskData.assigneeId,
      laneId,
      rank,
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

  public seedSampleTasks(): Task[] {
    const sampleSpecs: Array<{
      title: string;
      description?: string;
      priority: Task['priority'];
      laneId: string;
      estimateMinutes?: number;
      tags: string[];
      dueDate?: string;
    }> = [
      {
        title: 'Architect local-first CRDT sync layer',
        description: 'Design stateless document diff exchange using yjs binary states.',
        priority: 'urgent',
        laneId: 'inprogress',
        estimateMinutes: 240,
        tags: ['architecture', 'crdt']
      },
      {
        title: 'Configure AWS Cognito with software TOTP MFA',
        description: 'Enforce hardware/software TOTP MFA on user pool.',
        priority: 'high',
        laneId: 'todo',
        estimateMinutes: 120,
        tags: ['security', 'cognito']
      },
      {
        title: 'Build Flight Deck focus view and timer',
        description: 'Focus cockpit showing only 1-3 critical tasks in flight.',
        priority: 'urgent',
        laneId: 'inprogress',
        estimateMinutes: 180,
        tags: ['ui', 'focus']
      },
      {
        title: 'Implement Web Speech API voice task dictation',
        description: 'On-device browser speech recognition for hands-free task capture.',
        priority: 'medium',
        laneId: 'triage',
        estimateMinutes: 60,
        tags: ['pwa', 'voice']
      },
      {
        title: 'Set up EventBridge due-date reminder push cron',
        description: '5-minute EventBridge cron rule to dispatch RFC 8291 Web Push notifications.',
        priority: 'high',
        dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        laneId: 'todo',
        estimateMinutes: 120,
        tags: ['infra', 'push']
      }
    ];

    const added: Task[] = [];
    for (const spec of sampleSpecs) {
      added.push(this.addTask(spec));
    }
    this.notifyListeners();
    return added;
  }

  public updateTask(taskId: string, updates: Partial<Task>): void {
    const tasksMap = this.doc.getMap<Task>('tasks');
    const existing = tasksMap.get(taskId);
    if (existing) {
      const updated: Task = {
        ...existing,
        ...updates,
        updatedAt: updates.updatedAt || new Date().toISOString()
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
      description: `> Child task promoted from parent **${parent.key}** (${parent.title})\n\n`,
      priority: parent.priority,
      laneId: parent.laneId,
      tags: [...parent.tags]
    });

    return childTask;
  }

  public archiveTask(taskId: string): void {
    const task = this.doc.getMap<Task>('tasks').get(taskId);
    if (!task) return;

    const updates: Partial<Task> = {
      archived: true,
      archivedAt: new Date().toISOString()
    };

    if (task.isTimerRunning) {
      updates.isTimerRunning = false;
      if (task.timerStartedAt) {
        const elapsedSeconds = Math.floor((Date.now() - task.timerStartedAt) / 1000);
        updates.timeSpentSeconds = (task.timeSpentSeconds || 0) + elapsedSeconds;
        updates.timerStartedAt = undefined;
      }
    }

    this.updateTask(taskId, updates);
  }

  public unarchiveTask(taskId: string): void {
    this.updateTask(taskId, {
      archived: false,
      archivedAt: undefined
    });
  }

  public archiveCompletedTasks(olderThanDays: number = 7): number {
    const tasksMap = this.doc.getMap<Task>('tasks');
    const lanes = this.getLanes();
    const completedLaneIds = new Set(
      lanes.filter((l) => l.type === 'completed').map((l) => l.id)
    );
    if (completedLaneIds.size === 0) {
      completedLaneIds.add('done');
    }

    const cutoffMs = Date.now() - olderThanDays * 86400000;
    let count = 0;

    for (const [taskId, task] of tasksMap.entries()) {
      if (!task.archived && completedLaneIds.has(task.laneId)) {
        const taskTime = new Date(task.updatedAt || task.createdAt).getTime();
        if (taskTime <= cutoffMs) {
          this.archiveTask(taskId);
          count++;
        }
      }
    }

    return count;
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
