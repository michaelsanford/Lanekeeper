import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import type { ScheduledEvent } from 'aws-lambda';

vi.mock('@aws-sdk/lib-dynamodb', () => import('./helpers/fakeDynamoModule.js'));

const sendWebPushMock = vi.fn(async (_userId: string, _sub: unknown, _payload: unknown) => true);
vi.mock('../src/services/webpush.js', () => ({
  sendWebPush: sendWebPushMock
}));

function reminderItem(id: string, dueAt: string, userId: string) {
  return {
    PK: `WORKSPACE#default`,
    SK: `REMINDER#${id}`,
    GSI2PK: 'REMINDER#PENDING',
    GSI2SK: dueAt,
    taskId: id,
    taskKey: `LK-${id}`,
    title: `Task ${id}`,
    userId,
    dueAt,
    createdAt: dueAt
  };
}

function subscriptionItem(userId: string, suffix: string) {
  return {
    PK: `USER#${userId}`,
    SK: `SUB#${suffix}`,
    endpoint: `https://push.example/${userId}/${suffix}`,
    keys: { p256dh: 'p', auth: 'a' },
    userAgent: 'vitest',
    createdAt: new Date().toISOString()
  };
}

const dummyEvent = {} as ScheduledEvent;

describe('scheduler handler', () => {
  let fakeTable: typeof import('./helpers/fakeDynamoModule.js').fakeTable;
  let handler: typeof import('../src/handlers/scheduler.js').handler;

  beforeAll(async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-fn';
    process.env.TABLE_NAME = 'test-table';
    fakeTable = (await import('./helpers/fakeDynamoModule.js')).fakeTable;
    handler = (await import('../src/handlers/scheduler.js')).handler;
  });

  afterAll(() => {
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
    delete process.env.TABLE_NAME;
  });

  beforeEach(() => {
    fakeTable.reset();
    sendWebPushMock.mockClear();
    sendWebPushMock.mockResolvedValue(true);
  });

  it('processes every pending reminder across multiple query pages, then deletes them', async () => {
    const past = '2020-01-01T00:00:00.000Z';
    // The fake table pages at 2 items; 5 reminders forces 3 pages through
    // queryAllPendingReminders's pagination loop.
    for (let i = 1; i <= 5; i++) {
      fakeTable.put(reminderItem(`t${i}`, past, 'user-1'));
    }
    fakeTable.put(subscriptionItem('user-1', 'sub-a'));

    const result = await handler(dummyEvent);

    expect(result.processed).toBe(5);
    expect(sendWebPushMock).toHaveBeenCalledTimes(5);

    // All 5 reminder items were deleted; only the subscription item remains.
    const remaining = fakeTable.all();
    expect(remaining.length).toBe(1);
    expect(remaining[0].SK).toBe('SUB#sub-a');
  });

  it('does not process reminders that are not yet due', async () => {
    const future = '2999-01-01T00:00:00.000Z';
    fakeTable.put(reminderItem('future-1', future, 'user-1'));
    fakeTable.put(subscriptionItem('user-1', 'sub-a'));

    const result = await handler(dummyEvent);

    expect(result.processed).toBe(0);
    expect(sendWebPushMock).not.toHaveBeenCalled();
    expect(fakeTable.all().length).toBe(2); // both items still present
  });

  it('dispatches to every subscription for a reminder’s user', async () => {
    const past = '2020-01-01T00:00:00.000Z';
    fakeTable.put(reminderItem('t1', past, 'user-1'));
    fakeTable.put(subscriptionItem('user-1', 'sub-a'));
    fakeTable.put(subscriptionItem('user-1', 'sub-b'));
    fakeTable.put(subscriptionItem('user-2', 'sub-irrelevant')); // different user, must not be pushed to

    await handler(dummyEvent);

    expect(sendWebPushMock).toHaveBeenCalledTimes(2);
    const endpoints = sendWebPushMock.mock.calls.map((c: any[]) => c[1].endpoint);
    expect(endpoints).toContain('https://push.example/user-1/sub-a');
    expect(endpoints).toContain('https://push.example/user-1/sub-b');
  });

  it('leaves a reminder pending for retry if dispatch fails, without dropping the others', async () => {
    const past = '2020-01-01T00:00:00.000Z';
    fakeTable.put(reminderItem('good', past, 'user-1'));
    fakeTable.put(reminderItem('bad', past, 'user-2'));
    fakeTable.put(subscriptionItem('user-1', 'sub-a'));
    fakeTable.put(subscriptionItem('user-2', 'sub-b'));

    sendWebPushMock.mockImplementation(async (userId: string) => {
      if (userId === 'user-2') {
        throw new Error('push service unavailable');
      }
      return true;
    });

    const result = await handler(dummyEvent);

    expect(result.processed).toBe(1);
    const remainingReminders = fakeTable.all().filter((i) => i.SK.startsWith('REMINDER#'));
    expect(remainingReminders.length).toBe(1);
    expect(remainingReminders[0].SK).toBe('REMINDER#bad');
  });
});
