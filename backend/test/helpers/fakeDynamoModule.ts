/**
 * A minimal in-memory stand-in for @aws-sdk/lib-dynamodb, used only in tests
 * via `vi.mock('@aws-sdk/lib-dynamodb', () => import('./helpers/fakeDynamoModule.js'))`.
 *
 * It implements exactly the operations this codebase issues (Get/Put/Delete/
 * BatchGet/BatchWrite/Query with the specific KeyConditionExpression shapes
 * used in src/), plus DynamoDB's real 400KB item-size ceiling and a simple
 * ConditionExpression evaluator, so tests exercise the same constraints
 * production would.
 */

interface FakeItem {
  PK: string;
  SK: string;
  [key: string]: any;
}

const MAX_ITEM_BYTES = 400 * 1024;
// DynamoDB paginates by ~1MB of item data, not item count; a small fixed
// page size here is what lets tests exercise the pagination loop without
// needing megabytes of fixture data.
const TEST_PAGE_SIZE = 2;

function itemKey(pk: string, sk: string): string {
  return `${pk}#${sk}`;
}

function approxItemBytes(item: FakeItem): number {
  return Buffer.byteLength(JSON.stringify(item), 'utf8');
}

function evaluateCondition(expr: string, existing: FakeItem | undefined, values?: Record<string, any>): boolean {
  if (expr === 'attribute_not_exists(PK)') {
    return existing === undefined;
  }
  if (expr === 'version = :expectedVersion') {
    return existing !== undefined && existing.version === values?.[':expectedVersion'];
  }
  throw new Error(`fakeDynamoModule: unsupported ConditionExpression "${expr}"`);
}

class FakeTable {
  private items = new Map<string, FakeItem>();
  maxObservedItemBytes = 0;
  putCount = 0;

  get(pk: string, sk: string): FakeItem | undefined {
    return this.items.get(itemKey(pk, sk));
  }

  put(item: FakeItem, condition?: { expr: string; values?: Record<string, any> }): void {
    const existing = this.get(item.PK, item.SK);
    if (condition && !evaluateCondition(condition.expr, existing, condition.values)) {
      const err: any = new Error('The conditional request failed');
      err.name = 'ConditionalCheckFailedException';
      throw err;
    }
    const size = approxItemBytes(item);
    this.maxObservedItemBytes = Math.max(this.maxObservedItemBytes, size);
    if (size > MAX_ITEM_BYTES) {
      const err: any = new Error(`Item size has exceeded the maximum allowed size`);
      err.name = 'ValidationException';
      throw err;
    }
    this.items.set(itemKey(item.PK, item.SK), item);
    this.putCount++;
  }

  delete(pk: string, sk: string): void {
    this.items.delete(itemKey(pk, sk));
  }

  all(): FakeItem[] {
    return Array.from(this.items.values());
  }

  reset(): void {
    this.items.clear();
    this.maxObservedItemBytes = 0;
    this.putCount = 0;
  }
}

export const fakeTable = new FakeTable();

export class GetCommand {
  constructor(public input: any) {}
}
export class PutCommand {
  constructor(public input: any) {}
}
export class DeleteCommand {
  constructor(public input: any) {}
}
export class BatchGetCommand {
  constructor(public input: any) {}
}
export class BatchWriteCommand {
  constructor(public input: any) {}
}
export class QueryCommand {
  constructor(public input: any) {}
}

function runQuery(input: any): { Items: FakeItem[]; LastEvaluatedKey?: { PK: string; SK: string } } {
  const { IndexName, ExpressionAttributeValues, ExclusiveStartKey } = input;
  let items = fakeTable.all();

  if (!IndexName) {
    const pk = ExpressionAttributeValues[':userPk'];
    const prefix = ExpressionAttributeValues[':subPrefix'];
    items = items.filter((i) => i.PK === pk && typeof i.SK === 'string' && i.SK.startsWith(prefix));
  } else if (IndexName === 'GSI2') {
    const pk = ExpressionAttributeValues[':pk'];
    const now = ExpressionAttributeValues[':now'];
    items = items.filter((i) => i.GSI2PK === pk && i.GSI2SK <= now);
  } else {
    throw new Error(`fakeDynamoModule: unsupported IndexName "${IndexName}"`);
  }

  items.sort((a, b) => (a.PK + a.SK > b.PK + b.SK ? 1 : -1));

  let startIndex = 0;
  if (ExclusiveStartKey) {
    const idx = items.findIndex((i) => i.PK === ExclusiveStartKey.PK && i.SK === ExclusiveStartKey.SK);
    startIndex = idx === -1 ? 0 : idx + 1;
  }

  const page = items.slice(startIndex, startIndex + TEST_PAGE_SIZE);
  const hasMore = startIndex + TEST_PAGE_SIZE < items.length;
  const lastItem = page[page.length - 1];

  return {
    Items: page,
    LastEvaluatedKey: hasMore && lastItem ? { PK: lastItem.PK, SK: lastItem.SK } : undefined
  };
}

async function send(command: any): Promise<any> {
  if (command instanceof GetCommand) {
    const { Key } = command.input;
    return { Item: fakeTable.get(Key.PK, Key.SK) };
  }
  if (command instanceof PutCommand) {
    const condition = command.input.ConditionExpression
      ? { expr: command.input.ConditionExpression as string, values: command.input.ExpressionAttributeValues }
      : undefined;
    fakeTable.put(command.input.Item, condition);
    return {};
  }
  if (command instanceof DeleteCommand) {
    const { Key } = command.input;
    fakeTable.delete(Key.PK, Key.SK);
    return {};
  }
  if (command instanceof BatchGetCommand) {
    const [tableName, req] = Object.entries(command.input.RequestItems)[0] as [string, any];
    const items = req.Keys.map((k: any) => fakeTable.get(k.PK, k.SK)).filter((i: any): i is FakeItem => Boolean(i));
    return { Responses: { [tableName]: items } };
  }
  if (command instanceof BatchWriteCommand) {
    const [, requests] = Object.entries(command.input.RequestItems)[0] as [string, any[]];
    for (const r of requests) {
      if (r.DeleteRequest) fakeTable.delete(r.DeleteRequest.Key.PK, r.DeleteRequest.Key.SK);
      if (r.PutRequest) fakeTable.put(r.PutRequest.Item);
    }
    return {};
  }
  if (command instanceof QueryCommand) {
    return runQuery(command.input);
  }
  throw new Error('fakeDynamoModule: unsupported command');
}

export class DynamoDBDocumentClient {
  static from() {
    return { send };
  }
}
