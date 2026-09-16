import { describe, it, expect, beforeEach, beforeAll, afterAll, vi } from 'vitest';
import { chunkBase64, joinChunks } from '../src/common/ddb.js';

// Route every '@aws-sdk/lib-dynamodb' import (including inside src/common/ddb.ts)
// through the in-memory fake so these tests exercise the real AWS code path
// (chunking, item-size ceiling, optimistic concurrency) without live AWS.
vi.mock('@aws-sdk/lib-dynamodb', () => import('./helpers/fakeDynamoModule.js'));

describe('chunkBase64 / joinChunks (pure)', () => {
  it('returns no chunks for an empty string', () => {
    expect(chunkBase64('', 10)).toEqual([]);
  });

  it('returns a single chunk when under the size limit', () => {
    expect(chunkBase64('abcdef', 10)).toEqual(['abcdef']);
  });

  it('splits evenly and on the remainder', () => {
    expect(chunkBase64('abcdefghij', 4)).toEqual(['abcd', 'efgh', 'ij']);
  });

  it('round-trips arbitrary content through join', () => {
    const original = 'x'.repeat(12345);
    const chunks = chunkBase64(original, 777);
    expect(chunks.length).toBeGreaterThan(1);
    expect(joinChunks(chunks)).toBe(original);
  });
});

describe('CRDT document sharding against DynamoDB (via fake client)', () => {
  let fakeTable: typeof import('./helpers/fakeDynamoModule.js').fakeTable;
  let ddb: typeof import('../src/common/ddb.js');

  beforeAll(async () => {
    process.env.AWS_LAMBDA_FUNCTION_NAME = 'test-fn';
    fakeTable = (await import('./helpers/fakeDynamoModule.js')).fakeTable;
    ddb = await import('../src/common/ddb.js');
  });

  afterAll(() => {
    delete process.env.AWS_LAMBDA_FUNCTION_NAME;
  });

  beforeEach(() => {
    fakeTable.reset();
  });

  it('stores a small document inline on a single item, no chunking', async () => {
    const small = 'a'.repeat(1000);
    await ddb.saveProjectCrdtDoc('ws', 'proj', small, undefined);

    expect(fakeTable.all().length).toBe(1);
    const record = await ddb.getProjectCrdtDoc('ws', 'proj');
    expect(record?.yDocState).toBe(small);
  });

  it('shards a document larger than one DynamoDB item across chunk items and reassembles it', async () => {
    // ~1MB base64 payload: guaranteed to exceed the 400KB single-item ceiling.
    const large = 'y'.repeat(1_000_000);
    await ddb.saveProjectCrdtDoc('ws', 'proj', large, undefined);

    // Every stored item (manifest + each chunk) must respect DynamoDB's real limit.
    expect(fakeTable.maxObservedItemBytes).toBeLessThan(400 * 1024);
    expect(fakeTable.all().length).toBeGreaterThan(1);

    const record = await ddb.getProjectCrdtDoc('ws', 'proj');
    expect(record?.yDocState.length).toBe(large.length);
    expect(record?.yDocState).toBe(large);
  });

  it('cleans up stale chunk items when a document shrinks back below the inline threshold', async () => {
    const large = 'z'.repeat(1_000_000);
    await ddb.saveProjectCrdtDoc('ws', 'proj', large, undefined);
    const itemCountWhileLarge = fakeTable.all().length;
    expect(itemCountWhileLarge).toBeGreaterThan(1);

    const small = 'shrunk';
    await ddb.saveProjectCrdtDoc('ws', 'proj', small, 1);

    // Only the manifest item should remain.
    expect(fakeTable.all().length).toBe(1);
    const record = await ddb.getProjectCrdtDoc('ws', 'proj');
    expect(record?.yDocState).toBe(small);
  });

  it('cleans up excess chunk items when a document shrinks but is still multi-chunk', async () => {
    const veryLarge = 'q'.repeat(2_000_000);
    await ddb.saveProjectCrdtDoc('ws', 'proj', veryLarge, undefined);
    const bigChunkCount = fakeTable.all().length;

    const stillLarge = 'q'.repeat(600_000);
    await ddb.saveProjectCrdtDoc('ws', 'proj', stillLarge, 1);
    const smallerChunkCount = fakeTable.all().length;

    expect(smallerChunkCount).toBeLessThan(bigChunkCount);
    const record = await ddb.getProjectCrdtDoc('ws', 'proj');
    expect(record?.yDocState).toBe(stillLarge);
  });

  it('rejects a save when the expected prior version is stale (optimistic concurrency)', async () => {
    await ddb.saveProjectCrdtDoc('ws', 'proj', 'v1', undefined);

    // Someone else already wrote v2; our stale write (still expecting v1's
    // predecessor, i.e. "no doc exists") must fail rather than clobber it.
    await expect(ddb.saveProjectCrdtDoc('ws', 'proj', 'v1-again', undefined)).rejects.toThrow(
      ddb.CrdtVersionConflictError
    );

    // Writing against the correct expected version succeeds.
    const newVersion = await ddb.saveProjectCrdtDoc('ws', 'proj', 'v2', 1);
    expect(newVersion).toBe(2);
  });

  it('retryOnVersionConflict re-runs the attempt on conflict and succeeds once versions align', async () => {
    await ddb.saveProjectCrdtDoc('ws', 'proj', 'v1', undefined); // now at version 1

    let attempts = 0;
    const result = await ddb.retryOnVersionConflict(async () => {
      attempts++;
      const existing = await ddb.getProjectCrdtDoc('ws', 'proj');
      if (attempts === 1) {
        // Simulate a concurrent writer landing between our read and our
        // write: the stored version moves out from under us.
        await ddb.saveProjectCrdtDoc('ws', 'proj', 'concurrent-write', existing?.version);
      }
      // A real caller always writes against what it just read; on attempt 1
      // that's now stale (the concurrent write above already claimed it),
      // so this must throw and be retried with a fresh read.
      await ddb.saveProjectCrdtDoc('ws', 'proj', 'my-write', existing?.version);
      return 'done';
    }, 3);

    expect(result).toBe('done');
    expect(attempts).toBe(2);
    const finalRecord = await ddb.getProjectCrdtDoc('ws', 'proj');
    expect(finalRecord?.yDocState).toBe('my-write');
  });

  it('retryOnVersionConflict throws after exhausting max attempts', async () => {
    await ddb.saveProjectCrdtDoc('ws', 'proj', 'v1', undefined);

    await expect(
      ddb.retryOnVersionConflict(async () => {
        // Always writes against a deliberately stale version.
        await ddb.saveProjectCrdtDoc('ws', 'proj', 'always-stale', undefined);
      }, 2)
    ).rejects.toThrow(ddb.CrdtVersionConflictError);
  });
});
