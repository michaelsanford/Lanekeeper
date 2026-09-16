import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand,
  PutCommand,
  DeleteCommand,
  BatchGetCommand
} from '@aws-sdk/lib-dynamodb';

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

/**
 * Thrown when a save's expected prior version no longer matches what is stored,
 * meaning another writer persisted a change in between. Callers should re-fetch
 * the current document, reapply their update (Yjs updates are idempotent), and
 * retry the save with the newly observed version.
 */
export class CrdtVersionConflictError extends Error {
  constructor() {
    super('CRDT document was updated by another writer; re-fetch and retry.');
    this.name = 'CrdtVersionConflictError';
  }
}

/**
 * Runs `attempt` and retries it whenever it throws CrdtVersionConflictError,
 * up to `maxAttempts` times. `attempt` must re-read the current document on
 * every call (not close over a stale copy) so each retry reapplies its
 * mutation to the latest state; Yjs updates are idempotent, so this is safe.
 */
export async function retryOnVersionConflict<T>(attempt: () => Promise<T>, maxAttempts: number = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await attempt();
    } catch (err) {
      if (err instanceof CrdtVersionConflictError) {
        lastErr = err;
        continue;
      }
      throw err;
    }
  }
  throw lastErr;
}

// A single DynamoDB item is capped at 400KB. Base64 inflates the raw Yjs
// update by ~33%, and DynamoDB attribute-name/metadata overhead eats into
// that further, so we keep each stored chunk well under the hard limit.
const MAX_CHUNK_BASE64_CHARS = 300 * 1024;

/**
 * Splits a base64 string into chunks no larger than `size` characters.
 * Exported for unit testing; pure and has no DynamoDB dependency.
 */
export function chunkBase64(base64: string, size: number = MAX_CHUNK_BASE64_CHARS): string[] {
  if (base64.length === 0) {
    return [];
  }
  const chunks: string[] = [];
  for (let i = 0; i < base64.length; i += size) {
    chunks.push(base64.slice(i, i + size));
  }
  return chunks;
}

/** Reassembles chunks produced by chunkBase64 back into the original string. */
export function joinChunks(chunks: string[]): string {
  return chunks.join('');
}

function manifestKey(workspaceId: string, projectId: string) {
  return { PK: `WORKSPACE#${workspaceId}`, SK: `CRDT#${projectId}` };
}

function chunkKey(workspaceId: string, projectId: string, index: number) {
  return { PK: `WORKSPACE#${workspaceId}`, SK: `CRDT#${projectId}#CHUNK#${String(index).padStart(4, '0')}` };
}

// In-memory storage for local development
const memoryCrdtStore = new Map<string, CrdtRecord>();
const memoryItemStore = new Map<string, any>();

/**
 * Loads the stored base64 CRDT document state for a project. Transparently
 * reassembles multi-chunk documents (see saveProjectCrdtDoc).
 */
export async function getProjectCrdtDoc(workspaceId: string, projectId: string): Promise<CrdtRecord | null> {
  if (isLocalDev()) {
    const key = `${workspaceId}#${projectId}`;
    return memoryCrdtStore.get(key) || null;
  }

  const ddb = getDocClient();
  const tableName = getTableName();
  const res = await ddb.send(
    new GetCommand({
      TableName: tableName,
      Key: manifestKey(workspaceId, projectId)
    })
  );

  if (!res.Item) {
    return null;
  }

  const manifest = res.Item;

  // Small documents are stored inline on the manifest item itself.
  if (typeof manifest.yDocState === 'string') {
    return {
      yDocState: manifest.yDocState,
      updatedAt: manifest.updatedAt,
      version: manifest.version || 1
    };
  }

  const chunkCount: number = manifest.chunkCount || 0;
  if (chunkCount === 0) {
    return {
      yDocState: '',
      updatedAt: manifest.updatedAt,
      version: manifest.version || 1
    };
  }

  const keys = Array.from({ length: chunkCount }, (_, i) => chunkKey(workspaceId, projectId, i));
  const items: Array<{ chunkIndex: number; chunk: string }> = [];

  // BatchGetItem allows at most 100 keys per request.
  for (let i = 0; i < keys.length; i += 100) {
    const batch = keys.slice(i, i + 100);
    const batchRes = await ddb.send(
      new BatchGetCommand({
        RequestItems: {
          [tableName]: { Keys: batch }
        }
      })
    );
    const responses = batchRes.Responses?.[tableName] || [];
    for (const item of responses) {
      items.push({ chunkIndex: item.chunkIndex, chunk: item.chunk });
    }
  }

  items.sort((a, b) => a.chunkIndex - b.chunkIndex);

  return {
    yDocState: joinChunks(items.map((i) => i.chunk)),
    updatedAt: manifest.updatedAt,
    version: manifest.version || 1
  };
}

/**
 * Saves the base64 CRDT state for a project, sharding across multiple
 * DynamoDB items when it would otherwise exceed the 400KB item limit.
 *
 * `expectedVersion` must be the version the caller last observed (undefined
 * for a document being created for the first time). The write is guarded by
 * an optimistic-concurrency condition; if another writer has since saved a
 * different version, this throws CrdtVersionConflictError instead of
 * silently clobbering the concurrent write.
 *
 * Returns the new version on success.
 */
export async function saveProjectCrdtDoc(
  workspaceId: string,
  projectId: string,
  base64State: string,
  expectedVersion: number | undefined
): Promise<number> {
  const newVersion = (expectedVersion ?? 0) + 1;

  if (isLocalDev()) {
    const key = `${workspaceId}#${projectId}`;
    const current = memoryCrdtStore.get(key);
    const matches =
      (expectedVersion === undefined && current === undefined) ||
      (current !== undefined && current.version === expectedVersion);
    if (!matches) {
      throw new CrdtVersionConflictError();
    }
    memoryCrdtStore.set(key, {
      yDocState: base64State,
      updatedAt: new Date().toISOString(),
      version: newVersion
    });
    return newVersion;
  }

  const ddb = getDocClient();
  const tableName = getTableName();
  const now = new Date().toISOString();
  const { PK, SK } = manifestKey(workspaceId, projectId);

  const conditionExpression = expectedVersion === undefined ? 'attribute_not_exists(PK)' : 'version = :expectedVersion';
  const expressionAttributeValues = expectedVersion === undefined ? undefined : { ':expectedVersion': expectedVersion };

  // We need to know how many chunks the previous save used, so a shrinking
  // document doesn't leave orphaned chunk items behind.
  const prior = await ddb.send(new GetCommand({ TableName: tableName, Key: { PK, SK } }));
  const priorChunkCount: number = prior.Item?.chunkCount || 0;

  const chunks = chunkBase64(base64State);
  const manifestBase = {
    PK,
    SK,
    GSI1PK: `PROJECT#${projectId}`,
    GSI1SK: `VERSION#${newVersion}`,
    version: newVersion,
    updatedAt: now
  };

  try {
    if (chunks.length <= 1) {
      // Small enough to inline directly on the manifest item.
      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: { ...manifestBase, yDocState: chunks[0] ?? '' },
          ConditionExpression: conditionExpression,
          ExpressionAttributeValues: expressionAttributeValues
        })
      );
    } else {
      // Write the manifest last so partial chunk-write failures never leave
      // a manifest pointing at chunks that aren't fully written yet.
      await Promise.all(
        chunks.map((chunk, i) =>
          ddb.send(
            new PutCommand({
              TableName: tableName,
              Item: { ...chunkKey(workspaceId, projectId, i), chunk, chunkIndex: i, updatedAt: now }
            })
          )
        )
      );
      await ddb.send(
        new PutCommand({
          TableName: tableName,
          Item: { ...manifestBase, chunkCount: chunks.length },
          ConditionExpression: conditionExpression,
          ExpressionAttributeValues: expressionAttributeValues
        })
      );
    }
  } catch (err: any) {
    if (err?.name === 'ConditionalCheckFailedException') {
      throw new CrdtVersionConflictError();
    }
    throw err;
  }

  // Clean up chunk items that the new (possibly smaller, possibly now-inline) save no longer references.
  const newChunkCount = chunks.length > 1 ? chunks.length : 0;
  if (priorChunkCount > newChunkCount) {
    const deletes = [];
    for (let i = newChunkCount; i < priorChunkCount; i++) {
      deletes.push(ddb.send(new DeleteCommand({ TableName: tableName, Key: chunkKey(workspaceId, projectId, i) })));
    }
    await Promise.all(deletes);
  }

  return newVersion;
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
