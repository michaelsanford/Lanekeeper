import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

let docClient: DynamoDBDocumentClient | null = null;

export function isLocalDev(): boolean {
  return !process.env.AWS_LAMBDA_FUNCTION_NAME && !process.env.USE_AWS_DDB;
}

export function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    const rawClient = new DynamoDBClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
      ...(process.env.DYNAMODB_ENDPOINT ? { endpoint: process.env.DYNAMODB_ENDPOINT } : {})
    });
    docClient = DynamoDBDocumentClient.from(rawClient, {
      marshallOptions: {
        removeUndefinedValues: true
      }
    });
  }
  return docClient;
}

export function getTableName(): string {
  return process.env.TABLE_NAME || 'lanekeeper-dev';
}

export interface CrdtRecord {
  yDocState: string; // base64 encoded document state
  updatedAt: string;
  version: number;
}

// In-memory storage for local development
const memoryCrdtStore = new Map<string, CrdtRecord>();
const memoryItemStore = new Map<string, any>();

/**
 * Loads the stored base64 CRDT document state for a project.
 */
export async function getProjectCrdtDoc(workspaceId: string, projectId: string): Promise<CrdtRecord | null> {
  if (isLocalDev()) {
    const key = `${workspaceId}#${projectId}`;
    return memoryCrdtStore.get(key) || null;
  }

  const ddb = getDocClient();
  const res = await ddb.send(
    new GetCommand({
      TableName: getTableName(),
      Key: {
        PK: `WORKSPACE#${workspaceId}`,
        SK: `CRDT#${projectId}`
      }
    })
  );

  if (!res.Item) {
    return null;
  }

  return {
    yDocState: res.Item.yDocState,
    updatedAt: res.Item.updatedAt,
    version: res.Item.version || 1
  };
}

/**
 * Saves the compressed base64 CRDT state for a project.
 */
export async function saveProjectCrdtDoc(
  workspaceId: string,
  projectId: string,
  base64State: string,
  version: number = 1
): Promise<void> {
  if (isLocalDev()) {
    const key = `${workspaceId}#${projectId}`;
    memoryCrdtStore.set(key, {
      yDocState: base64State,
      updatedAt: new Date().toISOString(),
      version
    });
    return;
  }

  const ddb = getDocClient();
  const now = new Date().toISOString();

  await ddb.send(
    new PutCommand({
      TableName: getTableName(),
      Item: {
        PK: `WORKSPACE#${workspaceId}`,
        SK: `CRDT#${projectId}`,
        GSI1PK: `PROJECT#${projectId}`,
        GSI1SK: `VERSION#${version}`,
        yDocState: base64State,
        version,
        updatedAt: now
      }
    })
  );
}

/**
 * Stores a generic item in local memory (reminders, subscriptions, etc.)
 */
export function setLocalMemoryItem(key: string, value: any): void {
  memoryItemStore.set(key, value);
}

export function getLocalMemoryItem(key: string): any {
  return memoryItemStore.get(key);
}

/**
 * Helper to reset in-memory dev state (useful in tests).
 */
export function resetLocalMemoryStore(): void {
  memoryCrdtStore.clear();
  memoryItemStore.clear();
}
