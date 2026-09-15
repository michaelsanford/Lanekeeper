import { useState, useEffect } from 'react';
import { crdtStore } from '../crdt/doc.js';
import type { Task, Lane, ProjectMetadata } from '../types/index.js';

export function useCrdt() {
  const [tasks, setTasks] = useState<Task[]>(() => crdtStore.getTasks());
  const [lanes, setLanes] = useState<Lane[]>(() => crdtStore.getLanes());
  const [metadata, setMetadata] = useState<ProjectMetadata>(() => crdtStore.getMetadata());
  const [isSynced, setIsSynced] = useState<boolean>(() => crdtStore.isSynced);

  useEffect(() => {
    const unsubscribe = crdtStore.subscribe(() => {
      setTasks(crdtStore.getTasks());
      setLanes(crdtStore.getLanes());
      setMetadata(crdtStore.getMetadata());
      setIsSynced(crdtStore.isSynced);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return {
    tasks,
    lanes,
    metadata,
    isSynced,
    addTask: crdtStore.addTask.bind(crdtStore),
    updateTask: crdtStore.updateTask.bind(crdtStore),
    deleteTask: crdtStore.deleteTask.bind(crdtStore),
    moveTask: crdtStore.moveTask.bind(crdtStore),
    toggleSubtask: crdtStore.toggleSubtask.bind(crdtStore),
    addSubtask: crdtStore.addSubtask.bind(crdtStore),
    promoteSubtaskToTask: crdtStore.promoteSubtaskToTask.bind(crdtStore),
    toggleTimer: crdtStore.toggleTimer.bind(crdtStore),
    updateMetadata: crdtStore.updateMetadata.bind(crdtStore),
    addLane: crdtStore.addLane.bind(crdtStore),
    updateLane: crdtStore.updateLane.bind(crdtStore),
    deleteLane: crdtStore.deleteLane.bind(crdtStore),
    getProjectsList: crdtStore.getProjectsList.bind(crdtStore),
    createProject: crdtStore.createProject.bind(crdtStore),
    switchProject: crdtStore.switchProject.bind(crdtStore),
    seedSampleTasks: crdtStore.seedSampleTasks.bind(crdtStore),
    archiveTask: crdtStore.archiveTask.bind(crdtStore),
    unarchiveTask: crdtStore.unarchiveTask.bind(crdtStore),
    archiveCompletedTasks: crdtStore.archiveCompletedTasks.bind(crdtStore)
  };
}
