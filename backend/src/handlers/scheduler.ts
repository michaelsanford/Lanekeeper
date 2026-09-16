import type { ScheduledEvent } from 'aws-lambda';
import { QueryCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient, getTableName } from '../common/ddb.js';
import { sendWebPush } from '../services/webpush.js';
import type { PushSubscriptionData } from '../common/types.js';

/** Fetches every pending reminder due by `now`, paginating past DynamoDB's per-query page size. */
async function queryAllPendingReminders(now: string): Promise<Record<string, any>[]> {
  const ddb = getDocClient();
  const tableName = getTableName();
  const reminders: Record<string, any>[] = [];
  let exclusiveStartKey: Record<string, any> | undefined;

  do {
    const res = await ddb.send(
      new QueryCommand({
        TableName: tableName,
        IndexName: 'GSI2',
        KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK <= :now',
        ExpressionAttributeValues: {
          ':pk': 'REMINDER#PENDING',
          ':now': now
        },
        ExclusiveStartKey: exclusiveStartKey
      })
    );
    reminders.push(...(res.Items || []));
    exclusiveStartKey = res.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return reminders;
}

async function deleteProcessedReminders(keys: Array<{ PK: string; SK: string }>): Promise<void> {
  if (keys.length === 0) {
    return;
  }
  const ddb = getDocClient();
  const tableName = getTableName();

  // BatchWriteItem allows at most 25 requests per call.
  for (let i = 0; i < keys.length; i += 25) {
    const batch = keys.slice(i, i + 25);
    await ddb.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: batch.map((Key) => ({ DeleteRequest: { Key } }))
        }
      })
    );
  }
}

export async function handler(event: ScheduledEvent): Promise<{ processed: number }> {
  const ddb = getDocClient();
  const tableName = getTableName();
  const now = new Date().toISOString();

  // 1. Query every pending reminder where dueAt <= now (paginated).
  const reminders = await queryAllPendingReminders(now);

  // 2. Dispatch pushes for every reminder in parallel instead of one
  //    sequential round trip per reminder.
  const results = await Promise.allSettled(
    reminders.map(async (reminder) => {
      const { userId, title, taskKey, PK, SK } = reminder;

      const subsRes = await ddb.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: 'PK = :userPk AND begins_with(SK, :subPrefix)',
          ExpressionAttributeValues: {
            ':userPk': `USER#${userId}`,
            ':subPrefix': 'SUB#'
          }
        })
      );

      const subscriptions = (subsRes.Items || []) as unknown as PushSubscriptionData[];

      await Promise.all(
        subscriptions.map((sub) =>
          sendWebPush(userId, sub, {
            title: `Task Due: ${taskKey}`,
            body: title,
            url: `/?task=${taskKey}`,
            tag: `due-${taskKey}`
          })
        )
      );

      return { PK, SK };
    })
  );

  const processedKeys: Array<{ PK: string; SK: string }> = [];
  let failedCount = 0;
  for (const result of results) {
    if (result.status === 'fulfilled') {
      processedKeys.push(result.value);
    } else {
      failedCount++;
      console.error('Failed to process due-date reminder:', result.reason);
    }
  }

  // 3. Remove only the reminders that were successfully dispatched, batched.
  await deleteProcessedReminders(processedKeys);

  console.log(`Processed ${processedKeys.length} due-date reminders (${failedCount} failed and left pending for retry).`);
  return { processed: processedKeys.length };
}
