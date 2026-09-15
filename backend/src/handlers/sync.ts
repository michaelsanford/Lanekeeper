import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getCognitoAuthContext } from '../common/auth.js';
import {
  loadDocFromBase64,
  encodeDocToBase64,
  encodeStateVectorBase64,
  computeDiffUpdate,
  applyClientUpdate,
  initializeProjectDoc,
  sanitizeLaneOrder,
  deduplicateTasks
} from '../common/crdt.js';
import { getProjectCrdtDoc, saveProjectCrdtDoc } from '../common/ddb.js';
import type { SyncRequest, SyncResponse } from '../common/types.js';

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const auth = getCognitoAuthContext(event);
  if (!auth) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing request body' })
    };
  }

  try {
    const payload: SyncRequest = JSON.parse(event.body);
    const workspaceId = payload.workspaceId || auth.workspaceId;
    const projectId = payload.projectId || 'default';

    // 1. Fetch current CRDT document from DynamoDB / local memory
    const existing = await getProjectCrdtDoc(workspaceId, projectId);
    const doc = loadDocFromBase64(existing?.yDocState);

    let docModified = false;

    // 2. Initialize project defaults if document is newly created
    if (!existing) {
      initializeProjectDoc(doc, 'LK', 'Lanekeeper Core');
      docModified = true;
    }

    // 3. Apply any incoming updates from client
    if (payload.updates) {
      applyClientUpdate(doc, payload.updates);
      docModified = true;
    }

    // Always sanitize lane order and deduplicate redundant seed tasks
    const initialLaneCount = doc.getArray('laneOrder').length;
    sanitizeLaneOrder(doc);
    const finalLaneCount = doc.getArray('laneOrder').length;
    const removedTasks = deduplicateTasks(doc);
    if (initialLaneCount !== finalLaneCount || removedTasks > 0) {
      docModified = true;
    }

    // 4. Compute server diff relative to client state vector
    const serverDiff = computeDiffUpdate(doc, payload.stateVector);
    const serverStateVector = encodeStateVectorBase64(doc);

    // 5. Persist to DynamoDB if changes occurred
    if (docModified) {
      const newBase64 = encodeDocToBase64(doc);
      await saveProjectCrdtDoc(workspaceId, projectId, newBase64, (existing?.version ?? 0) + 1);
    }

    const responseBody: SyncResponse = {
      serverDiff,
      serverStateVector
    };

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(responseBody)
    };
  } catch (err: any) {
    console.error('Error during CRDT sync:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
}
