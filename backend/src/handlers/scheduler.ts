import type { ScheduledEvent } from 'aws-lambda';
import { QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient, getTableName } from '../common/ddb.js';
import { sendWebPush } from '../services/webpush.js';
import type { PushSubscriptionData } from '../common/types.js';

export async function handler(event: ScheduledEvent): Promise<{ processed: number }> {
  const ddb = getDocClient();
  const tableName = getTableName();
  const now = new Date().toISOString();

  // 1. Query pending reminders where dueAt <= now
  const remindersRes = await ddb.send(
    new QueryCommand({
      TableName: tableName,
      IndexName: 'GSI2',
      KeyConditionExpression: 'GSI2PK = :pk AND GSI2SK <= :now',
      ExpressionAttributeValues: {
        ':pk': 'REMINDER#PENDING',
        ':now': now
      }
    })
  );

  const reminders = remindersRes.Items || [];
  let processedCount = 0;

  for (const reminder of reminders) {
    const { userId, title, taskKey, PK, SK } = reminder;

    // 2. Fetch user subscriptions
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

    for (const sub of subscriptions) {
      await sendWebPush(userId, sub, {
        title: `Task Due: ${taskKey}`,
        body: title,
        url: `/?task=${taskKey}`,
        tag: `due-${taskKey}`
      });
    }

    // 3. Remove processed reminder
    await ddb.send(
      new DeleteCommand({
        TableName: tableName,
        Key: { PK, SK }
      })
    );

    processedCount++;
  }

  console.log(`Processed ${processedCount} due-date reminders.`);
  return { processed: processedCount };
}
