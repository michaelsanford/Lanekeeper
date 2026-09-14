import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';

let docClient: DynamoDBDocumentClient | null = null;

export function getDocClient(): DynamoDBDocumentClient {
  if (!docClient) {
    const rawClient = new DynamoDBClient({});
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

/**
 * Loads the stored base64 CRDT document state for a project.
 */
export async function getProjectCrdtDoc(workspaceId: string, projectId: string): Promise<CrdtRecord | null> {
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
