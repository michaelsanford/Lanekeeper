import { useSyncExternalStore } from 'react';
import { crdtStore } from '../crdt/doc.js';

// Bound once at module scope, not on every render, so consumers get
// referentially stable action identities. Without this, useCrdt() handed
// out a fresh bound function per render, which defeated React.memo on any
// component (TaskCard, LaneColumn, ...) that receives one of these as a prop.
const actions = {
  addTask: crdtStore.addTask.bind(crdtStore),
  duplicateTask: crdtStore.duplicateTask.bind(crdtStore),
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
  applyWorkflowTemplate: crdtStore.applyWorkflowTemplate.bind(crdtStore),
  seedSampleTasks: crdtStore.seedSampleTasks.bind(crdtStore),
  archiveTask: crdtStore.archiveTask.bind(crdtStore),
  unarchiveTask: crdtStore.unarchiveTask.bind(crdtStore),
  archiveCompletedTasks: crdtStore.archiveCompletedTasks.bind(crdtStore)
};

function subscribe(onStoreChange: () => void): () => void {
  return crdtStore.subscribe(onStoreChange);
}

function getSnapshot() {
  return crdtStore.getStoreSnapshot();
}

export function useCrdt() {
  // A single subscription to a single cached composite snapshot (tasks,
  // lanes, metadata, isSynced together): getStoreSnapshot() returns the
  // same object reference until the store actually changes, which
  // useSyncExternalStore requires to avoid a re-render loop, and also
  // closes the gap the old useState+useEffect pattern had (a CRDT update
  // landing between initial state and the effect attaching its
  // subscription used to be silently dropped).
  const snapshot = useSyncExternalStore(subscribe, getSnapshot);

  return {
    ...snapshot,
    ...actions
  };
}
