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
  setLocalMemoryItem
} from '../common/ddb.js';
import type { Task } from '../common/types.js';

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

    // 2. Load or initialize project Y.Doc
    const existing = await getProjectCrdtDoc(workspaceId, projectId);
    const doc = loadDocFromBase64(existing?.yDocState);

    if (!existing) {
      initializeProjectDoc(doc, prefix, 'General');
    }

    // 3. Check if task with identical title already exists to prevent duplicate seeding
    const tasksMap = doc.getMap<Task>('tasks');
    const existingTask = Array.from(tasksMap.values()).find(
      (t) => t.title.trim().toLowerCase() === parsed.title.trim().toLowerCase()
    );
    if (existingTask) {
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          message: 'Task already exists',
          task: existingTask
        })
      };
    }

    // 4. Allocate sequential key (e.g. LK-42)
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

    // 4. Inject into CRDT document
    addTaskToDoc(doc, task);

    // 5. If task has a due date, schedule a reminder in DynamoDB GSI2
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

    // 6. Persist updated CRDT doc
    const newBase64 = encodeDocToBase64(doc);
    await saveProjectCrdtDoc(workspaceId, projectId, newBase64, (existing?.version ?? 0) + 1);

    return {
      statusCode: 201,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        task
      })
    };
  } catch (err: any) {
    console.error('Error ingesting task:', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', details: err.message })
    };
  }
}
