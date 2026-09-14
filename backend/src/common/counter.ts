import { UpdateCommand } from '@aws-sdk/lib-dynamodb';
import { getDocClient, getTableName } from './ddb.js';
import type { LeaseResponse } from './types.js';

/**
 * Atomically increments the project task counter and returns the formatted key (e.g. "LK-42").
 */
export async function getNextTaskKey(workspaceId: string, projectId: string, prefix: string): Promise<string> {
  const ddb = getDocClient();
  const tableName = getTableName();

  const res = await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `WORKSPACE#${workspaceId}`,
        SK: `PROJECT#${projectId}`
      },
      UpdateExpression: 'SET taskCounter = if_not_exists(taskCounter, :zero) + :inc, prefix = if_not_exists(prefix, :pfx)',
      ExpressionAttributeValues: {
        ':inc': 1,
        ':zero': 0,
        ':pfx': prefix
      },
      ReturnValues: 'UPDATED_NEW'
    })
  );

  const nextNum = res.Attributes?.taskCounter ?? 1;
  return `${prefix}-${nextNum}`;
}

/**
 * Allocates a contiguous block of task IDs for a client to use offline without collisions.
 */
export async function allocateOfflineLease(
  workspaceId: string,
  projectId: string,
  prefix: string,
  blockSize: number = 10
): Promise<LeaseResponse> {
  const ddb = getDocClient();
  const tableName = getTableName();

  const res = await ddb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: {
        PK: `WORKSPACE#${workspaceId}`,
        SK: `PROJECT#${projectId}`
      },
      UpdateExpression: 'SET taskCounter = if_not_exists(taskCounter, :zero) + :size, prefix = if_not_exists(prefix, :pfx)',
      ExpressionAttributeValues: {
        ':size': blockSize,
        ':zero': 0,
        ':pfx': prefix
      },
      ReturnValues: 'UPDATED_NEW'
    })
  );

  const endNum = res.Attributes?.taskCounter ?? blockSize;
  const startNum = endNum - blockSize + 1;

  return {
    prefix,
    start: startNum,
    end: endNum
  };
}
