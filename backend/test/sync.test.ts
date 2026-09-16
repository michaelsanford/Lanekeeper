import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import type { APIGatewayProxyEventV2WithJWTAuthorizer } from 'aws-lambda';
import type { Task } from '../src/common/types.js';

vi.mock('@aws-sdk/lib-dynamodb', () => import('./helpers/fakeDynamoModule.js'));

function syncEvent(body: object): APIGatewayProxyEventV2WithJWTAuthorizer {
  return {
    version: '2.0',
    routeKey: 'POST /api/v1/sync',
    rawPath: '/api/v1/sync',
    rawQueryString: '',
    headers: {},
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      domainName: 'localhost',
      domainPrefix: 'localhost',
      http: {
        method: 'POST',
        path: '/api/v1/sync',
        protocol: 'HTTP/1.1',
        sourceIp: '127.0.0.1',
        userAgent: 'vitest'
      },
      requestId: 'req-1',
      routeKey: 'POST /api/v1/sync',
      stage: 'test',
      time: new Date().toISOString(),
      timeEpoch: Date.now(),
      authorizer: {
        jwt: {
          claims: { sub: 'user-1', 'custom:workspaceId': 'ws-1' },
          scopes: []
        }
      }
    } as any,
    body: JSON.stringify(body),
    isBase64Encoded: false
  };
}

describe('sync handler', () => {
  let fakeTable: typeof import('./helpers/fakeDynamoModule.js').fakeTable;
  let handler: typeof import('../src/handlers/sync.js').handler;
  let crdt: typeof import('../src/common/crdt.js');

  beforeAll(async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-fn';
    process.env.TABLE_NAME = 'test-table';
    fakeTable = (await import('./helpers/fakeDynamoModule.js')).fakeTable;
    handler = (await import('../src/handlers/sync.js')).handler;
    crdt = await import('../src/common/crdt.js');
  });

  afterAll(() => {
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.TABLE_NAME;
  });

  beforeEach(() => {
    fakeTable.reset();
  });

  it('rejects requests without a valid Cognito auth context', async () => {
    const event = syncEvent({});
    (event.requestContext as any).authorizer = undefined;
    const res: any = await handler(event);
    expect(res.statusCode).toBe(401);
  });

  it('initializes a new project on first sync and returns full server state', async () => {
    const res: any = await handler(syncEvent({ workspaceId: 'ws-1', projectId: 'proj-1' }));
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.serverDiff).toBeTruthy();
    expect(body.serverStateVector).toBeTruthy();
  });

  it('does not delete a second task that legitimately shares a title with an existing one', async () => {
    const Y = await import('yjs');

    // First sync: create the project (this is where the one-time seed
    // dedupe runs) and add a task titled "Fix tests".
    const initRes: any = await handler(syncEvent({ workspaceId: 'ws-1', projectId: 'proj-1' }));
    const initBody = JSON.parse(initRes.body);

    const clientDoc = new Y.Doc();
    Y.applyUpdate(clientDoc, Buffer.from(initBody.serverDiff, 'base64'));

    const taskA: Task = {
      id: 'task-a',
      key: 'LK-1',
      title: 'Fix tests',
      description: '',
      priority: 'medium',
      laneId: 'triage',
      rank: '0|100:',
      tags: [],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    crdt.addTaskToDoc(clientDoc, taskA);

    const update1 = Buffer.from(Y.encodeStateAsUpdate(clientDoc)).toString('base64');
    const sync1: any = await handler(
      syncEvent({ workspaceId: 'ws-1', projectId: 'proj-1', updates: update1 })
    );
    expect(sync1.statusCode).toBe(200);

    // Second sync: a distinct task that happens to share the same title.
    const taskB: Task = {
      id: 'task-b',
      key: 'LK-2',
      title: 'Fix tests',
      description: '',
      priority: 'low',
      laneId: 'todo',
      rank: '0|200:',
      tags: [],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const clientDoc2 = new Y.Doc();
    Y.applyUpdate(clientDoc2, Y.encodeStateAsUpdate(clientDoc));
    crdt.addTaskToDoc(clientDoc2, taskB);
    const update2 = Buffer.from(
      Y.encodeStateAsUpdate(clientDoc2, Y.encodeStateVector(clientDoc))
    ).toString('base64');

    const sync2: any = await handler(
      syncEvent({ workspaceId: 'ws-1', projectId: 'proj-1', updates: update2 })
    );
    expect(sync2.statusCode).toBe(200);

    // Both same-titled tasks must survive: dedup-by-title only ever runs
    // once, at project creation, never on a later sync.
    const record = fakeTable.all().find((i) => i.SK === 'CRDT#proj-1');
    const serverDoc = new Y.Doc();
    if (record?.yDocState) {
      Y.applyUpdate(serverDoc, Buffer.from(record.yDocState, 'base64'));
    }
    const tasks = Array.from(serverDoc.getMap<Task>('tasks').values());
    expect(tasks.map((t) => t.id).sort()).toEqual(['task-a', 'task-b']);
  });
});
