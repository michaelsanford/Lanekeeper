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
import { getProjectCrdtDoc, saveProjectCrdtDoc, CrdtVersionConflictError, retryOnVersionConflict } from '../common/ddb.js';
import type { SyncRequest, SyncResponse } from '../common/types.js';

const MAX_SYNC_ATTEMPTS = 3;

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

    let serverDiff: string | undefined;
    let serverStateVector = '';

    await retryOnVersionConflict(async () => {
      // Re-read on every attempt: if a concurrent writer saved between our
      // last attempt and now, we must reapply this update on top of their
      // change, not clobber it.
      const existing = await getProjectCrdtDoc(workspaceId, projectId);
      const doc = loadDocFromBase64(existing?.yDocState);
      let docModified = false;

      if (!existing) {
        initializeProjectDoc(doc, 'LK', 'Lanekeeper Core');
        // Only worth scanning for accidental seed duplicates when the doc is
        // being created; on every subsequent sync this is dead weight and,
        // worse, would silently delete any two tasks a user later gives the
        // same title.
        deduplicateTasks(doc);
        docModified = true;
      }

      if (payload.updates) {
        applyClientUpdate(doc, payload.updates);
        docModified = true;
      }

      const initialLaneCount = doc.getArray('laneOrder').length;
      sanitizeLaneOrder(doc);
      if (doc.getArray('laneOrder').length !== initialLaneCount) {
        docModified = true;
      }

      serverDiff = computeDiffUpdate(doc, payload.stateVector);
      serverStateVector = encodeStateVectorBase64(doc);

      if (docModified) {
        const newBase64 = encodeDocToBase64(doc);
        await saveProjectCrdtDoc(workspaceId, projectId, newBase64, existing?.version);
      }
    }, MAX_SYNC_ATTEMPTS);

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
    if (err instanceof CrdtVersionConflictError) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Sync conflict after retrying, please sync again' })
      };
    }
    console.error('Error during CRDT sync:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
}
