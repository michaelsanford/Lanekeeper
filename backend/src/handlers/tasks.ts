import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { validateApiToken, getCognitoAuthContext } from '../common/auth.js';
import { loadDocFromBase64, encodeDocToBase64 } from '../common/crdt.js';
import { getProjectCrdtDoc, saveProjectCrdtDoc, retryOnVersionConflict, CrdtVersionConflictError } from '../common/ddb.js';
import type { Task } from '../common/types.js';

class TaskNotFoundError extends Error {}

async function authenticate(event: APIGatewayProxyEventV2) {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  let auth = await validateApiToken(authHeader);
  if (!auth) {
    auth = getCognitoAuthContext(event);
  }
  return auth;
}

/**
 * GET /api/v1/tasks - lists tasks for a project (used by `lk list`).
 * PATCH /api/v1/tasks/{key} - transitions a task's lane (used by `lk start` / `lk close`).
 *
 * Accepts either a bearer API token (CLI, external scripts) or a Cognito JWT
 * (the SPA), matching the dual auth path used by the quick-ingest handler.
 */
export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const auth = await authenticate(event);
  if (!auth) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized: Invalid or missing credentials' })
    };
  }

  const method = event.requestContext.http.method;
  const workspaceId = event.queryStringParameters?.workspaceId || auth.workspaceId;
  const projectId = event.queryStringParameters?.projectId || 'default';

  try {
    if (method === 'GET') {
      const existing = await getProjectCrdtDoc(workspaceId, projectId);
      const tasks = existing ? Array.from(loadDocFromBase64(existing.yDocState).getMap<Task>('tasks').values()) : [];

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ tasks })
      };
    }

    if (method === 'PATCH') {
      const key = event.pathParameters?.key;
      if (!key) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing task key' })
        };
      }
      if (!event.body) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing request body' })
        };
      }

      const payload = JSON.parse(event.body);
      const laneId = payload.laneId as string | undefined;
      if (!laneId) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ error: 'Missing laneId' })
        };
      }

      const updatedTask = await retryOnVersionConflict(async () => {
        // Re-read on every attempt so a retry reapplies against the latest
        // saved state instead of clobbering a concurrent writer's change.
        const existing = await getProjectCrdtDoc(workspaceId, projectId);
        if (!existing) {
          throw new TaskNotFoundError();
        }

        const doc = loadDocFromBase64(existing.yDocState);
        const tasksMap = doc.getMap<Task>('tasks');
        const entry = Array.from(tasksMap.entries()).find(([, t]) => t.key.toUpperCase() === key.toUpperCase());
        if (!entry) {
          throw new TaskNotFoundError();
        }

        const [taskId, task] = entry;
        const next: Task = { ...task, laneId, updatedAt: new Date().toISOString() };
        tasksMap.set(taskId, next);

        const newBase64 = encodeDocToBase64(doc);
        await saveProjectCrdtDoc(workspaceId, projectId, newBase64, existing.version);
        return next;
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ task: updatedTask })
      };
    }

    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (err: any) {
    if (err instanceof TaskNotFoundError) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `Task ${event.pathParameters?.key} not found` })
      };
    }
    if (err instanceof CrdtVersionConflictError) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Sync conflict after retrying, please try again' })
      };
    }
    console.error('Error handling tasks request:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
}
