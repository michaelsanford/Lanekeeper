import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { randomUUID } from 'node:crypto';
import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { validateApiToken, getCognitoAuthContext } from '../common/auth.js';
import { parseQuickTask } from '../common/parser.js';
import { getNextTaskKey } from '../common/counter.js';
import {
  loadDocFromBase64,
  encodeDocToBase64,
  initializeProjectDoc,
  addTaskToDoc
} from '../common/crdt.js';
import {
  getDocClient,
  getTableName,
  getProjectCrdtDoc,
  saveProjectCrdtDoc,
  isLocalDev,
  setLocalMemoryItem,
  retryOnVersionConflict,
  CrdtVersionConflictError
} from '../common/ddb.js';
import type { Task } from '../common/types.js';

type IngestOutcome = { kind: 'duplicate'; task: Task } | { kind: 'created'; task: Task };

export async function handler(event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> {
  const authHeader = event.headers.authorization || event.headers.Authorization || '';
  let auth = await validateApiToken(authHeader);
  if (!auth) {
    auth = getCognitoAuthContext(event);
  }

  if (!auth) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Unauthorized: Invalid or missing API token' })
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
    const payload = JSON.parse(event.body);
    const raw = (payload.raw || payload.text || '').trim();

    if (!raw) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing task text' })
      };
    }

    const workspaceId = payload.workspaceId || auth.workspaceId;
    const projectId = payload.projectId || 'default';
    const prefix = (payload.prefix || 'LK').toUpperCase();

    // 1. Parse quick task syntax (#tag, !prio, ^date, ~est, @user)
    const parsed = parseQuickTask(raw);

    // Allocated/generated once, outside the retry loop below, so a retry
    // caused by a concurrent writer reapplies the identical task rather than
    // burning another key or minting a new id.
    const taskKey = await getNextTaskKey(workspaceId, projectId, prefix);
    const taskId = randomUUID();
    const now = new Date().toISOString();

    const task: Task = {
      id: taskId,
      key: taskKey,
      title: parsed.title,
      description: payload.description || '',
      priority: parsed.priority,
      estimateMinutes: parsed.estimateMinutes,
      dueDate: parsed.dueDate,
      assigneeId: parsed.assignee,
      laneId: 'triage',
      rank: `0|${Date.now().toString(36)}:`,
      tags: parsed.tags,
      subtasks: [],
      createdAt: now,
      updatedAt: now
    };

    const outcome = await retryOnVersionConflict<IngestOutcome>(async () => {
      // Re-read on every attempt so a retry reapplies against the latest
      // saved state instead of clobbering a concurrent writer's change.
      const existing = await getProjectCrdtDoc(workspaceId, projectId);
      const doc = loadDocFromBase64(existing?.yDocState);

      if (!existing) {
        initializeProjectDoc(doc, prefix, (payload as any).projectName || 'Lanekeeper Core');
      }

      // Check if a task with identical title already exists to prevent duplicate seeding
      const tasksMap = doc.getMap<Task>('tasks');
      const existingTask = Array.from(tasksMap.values()).find(
        (t) => t.title.trim().toLowerCase() === parsed.title.trim().toLowerCase()
      );
      if (existingTask) {
        return { kind: 'duplicate', task: existingTask };
      }

      addTaskToDoc(doc, task);

      const newBase64 = encodeDocToBase64(doc);
      await saveProjectCrdtDoc(workspaceId, projectId, newBase64, existing?.version);

      return { kind: 'created', task };
    });

    if (outcome.kind === 'duplicate') {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Task already exists',
          task: outcome.task
        })
      };
    }

    // Schedule a due-date reminder now that the task is durably persisted.
    if (parsed.dueDate) {
      if (isLocalDev()) {
        setLocalMemoryItem(`WORKSPACE#${workspaceId}:REMINDER#${taskId}`, {
          PK: `WORKSPACE#${workspaceId}`,
          SK: `REMINDER#${taskId}`,
          GSI2PK: 'REMINDER#PENDING',
          GSI2SK: parsed.dueDate,
          taskId,
          taskKey,
          title: parsed.title,
          userId: auth.userId,
          dueAt: parsed.dueDate,
          createdAt: now
        });
      } else {
        const ddb = getDocClient();
        await ddb.send(
          new PutCommand({
            TableName: getTableName(),
            Item: {
              PK: `WORKSPACE#${workspaceId}`,
              SK: `REMINDER#${taskId}`,
              GSI2PK: 'REMINDER#PENDING',
              GSI2SK: parsed.dueDate,
              taskId,
              taskKey,
              title: parsed.title,
              userId: auth.userId,
              dueAt: parsed.dueDate,
              createdAt: now
            }
          })
        );
      }
    }

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        task: outcome.task
      })
    };
  } catch (err: any) {
    if (err instanceof CrdtVersionConflictError) {
      return {
        statusCode: 409,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Sync conflict after retrying, please try again' })
      };
    }
    console.error('Error ingesting task:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
}
