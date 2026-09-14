import { describe, it, expect, beforeEach } from "vitest";
import { validateApiToken } from "../src/common/auth.js";
import { getNextTaskKey, allocateOfflineLease, resetLocalCounters } from "../src/common/counter.js";
import {
  getProjectCrdtDoc,
  saveProjectCrdtDoc,
  resetLocalMemoryStore,
  isLocalDev
} from "../src/common/ddb.js";
import { handler as ingestHandler } from "../src/handlers/ingest.js";
import { loadDocFromBase64 } from "../src/common/crdt.js";
import type { APIGatewayProxyEventV2 } from "aws-lambda";
import type { Task } from "../src/common/types.js";

describe("Backend Local Development Mode", () => {
  beforeEach(() => {
    resetLocalMemoryStore();
    resetLocalCounters();
  });

  it("identifies local development environment", () => {
    expect(isLocalDev()).toBe(true);
  });

  it("authenticates local development tokens without DynamoDB", async () => {
    const auth1 = await validateApiToken("Bearer lk_dev_seed_token");
    expect(auth1).not.toBeNull();
    expect(auth1?.userId).toBe("dev-user-01");
    expect(auth1?.workspaceId).toBe("default");

    const auth2 = await validateApiToken("lk_dev_cli_key");
    expect(auth2).not.toBeNull();
    expect(auth2?.email).toBe("dev@lanekeeper.local");
  });

  it("allocates sequential task keys in memory", async () => {
    const key1 = await getNextTaskKey("ws-1", "proj-1", "LK");
    const key2 = await getNextTaskKey("ws-1", "proj-1", "LK");
    const key3 = await getNextTaskKey("ws-1", "proj-1", "LK");

    expect(key1).toBe("LK-1");
    expect(key2).toBe("LK-2");
    expect(key3).toBe("LK-3");
  });

  it("allocates offline task key leases in memory", async () => {
    const lease = await allocateOfflineLease("ws-1", "proj-1", "LK", 10);
    expect(lease.prefix).toBe("LK");
    expect(lease.start).toBe(1);
    expect(lease.end).toBe(10);

    const lease2 = await allocateOfflineLease("ws-1", "proj-1", "LK", 5);
    expect(lease2.start).toBe(11);
    expect(lease2.end).toBe(15);
  });

  it("stores and retrieves CRDT document records in memory", async () => {
    const existing = await getProjectCrdtDoc("ws-1", "proj-1");
    expect(existing).toBeNull();

    await saveProjectCrdtDoc("ws-1", "proj-1", "base64statexyz", 1);
    const retrieved = await getProjectCrdtDoc("ws-1", "proj-1");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.yDocState).toBe("base64statexyz");
    expect(retrieved?.version).toBe(1);
  });

  it("ingests quick task and persists to in-memory CRDT store", async () => {
    const mockEvent: APIGatewayProxyEventV2 = {
      version: "2.0",
      routeKey: "POST /api/v1/quick",
      rawPath: "/api/v1/quick",
      rawQueryString: "",
      headers: {
        authorization: "Bearer lk_dev_seed_token"
      },
      requestContext: {
        accountId: "123456789012",
        apiId: "local-api",
        domainName: "localhost",
        domainPrefix: "localhost",
        http: {
          method: "POST",
          path: "/api/v1/quick",
          protocol: "HTTP/1.1",
          sourceIp: "127.0.0.1",
          userAgent: "vitest"
        },
        requestId: "req-1",
        routeKey: "POST /api/v1/quick",
        stage: "dev",
        time: new Date().toISOString(),
        timeEpoch: Date.now()
      },
      body: JSON.stringify({
        raw: "Implement local caching #cache !urgent ~2h"
      }),
      isBase64Encoded: false
    };

    const result = await ingestHandler(mockEvent);
    expect(typeof result).toBe("object");
    const response = result as { statusCode: number; body: string };
    expect(response.statusCode).toBe(201);

    const body = JSON.parse(response.body);
    expect(body.task.key).toBe("LK-1");
    expect(body.task.title).toBe("Implement local caching");
    expect(body.task.priority).toBe("urgent");
    expect(body.task.tags).toContain("cache");

    // Verify persisted in CRDT store
    const docRecord = await getProjectCrdtDoc("default", "default");
    expect(docRecord).not.toBeNull();

    const doc = loadDocFromBase64(docRecord?.yDocState);
    const tasksMap = doc.getMap<Task>("tasks");
    const tasks = Array.from(tasksMap.values());
    expect(tasks.length).toBe(1);
    expect(tasks[0].title).toBe("Implement local caching");
  });
});
