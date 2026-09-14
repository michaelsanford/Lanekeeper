import * as Y from 'yjs';
import type { Task, Lane } from './types.js';

/**
 * Creates or restores a Y.Doc from an encoded base64 binary state.
 */
export function loadDocFromBase64(base64State?: string): Y.Doc {
  const doc = new Y.Doc();
  if (base64State) {
    const bytes = Uint8Array.from(Buffer.from(base64State, 'base64'));
    Y.applyUpdate(doc, bytes);
  }
  return doc;
}

/**
 * Encodes a Y.Doc into a base64 string for storage in DynamoDB.
 */
export function encodeDocToBase64(doc: Y.Doc): string {
  const update = Y.encodeStateAsUpdate(doc);
  return Buffer.from(update).toString('base64');
}

/**
 * Encodes the state vector of a Y.Doc to base64.
 */
export function encodeStateVectorBase64(doc: Y.Doc): string {
  const sv = Y.encodeStateVector(doc);
  return Buffer.from(sv).toString('base64');
}

/**
 * Computes the diff update between the server doc and client state vector.
 */
export function computeDiffUpdate(doc: Y.Doc, clientStateVectorBase64?: string): string | undefined {
  if (!clientStateVectorBase64) {
    // Client has no state yet, send entire doc state as update
    const update = Y.encodeStateAsUpdate(doc);
    return Buffer.from(update).toString('base64');
  }

  const clientVector = Uint8Array.from(Buffer.from(clientStateVectorBase64, 'base64'));
  const diff = Y.encodeStateAsUpdate(doc, clientVector);
  if (diff.length === 0 || (diff.length === 1 && diff[0] === 0)) {
    return undefined; // Nothing to sync
  }

  return Buffer.from(diff).toString('base64');
}

/**
 * Applies client base64 update to a Y.Doc.
 */
export function applyClientUpdate(doc: Y.Doc, clientUpdateBase64: string): void {
  const update = Uint8Array.from(Buffer.from(clientUpdateBase64, 'base64'));
  Y.applyUpdate(doc, update);
}

/**
 * Initializes a new project CRDT doc with default lanes if empty.
 */
export function initializeProjectDoc(doc: Y.Doc, projectPrefix: string, projectName: string): void {
  const lanesMap = doc.getMap<Lane>('lanes');
  const laneOrder = doc.getArray<string>('laneOrder');
  const metaMap = doc.getMap<string>('metadata');

  if (laneOrder.length === 0) {
    metaMap.set('name', projectName);
    metaMap.set('prefix', projectPrefix);

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

/**
 * Injects a new task into a project Y.Doc (used by quick ingestion & webhooks).
 */
export function addTaskToDoc(doc: Y.Doc, task: Task): void {
  const tasksMap = doc.getMap<Task>('tasks');
  tasksMap.set(task.id, task);
}
