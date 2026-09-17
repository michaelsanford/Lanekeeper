import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import http from "node:http";
import type { AddressInfo } from "node:net";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, "../../cli/lk.mjs");

type FakeTask = { key: string; title: string; laneId: string; priority: string };

describe("Developer CLI Companion (lk)", () => {
  let server: http.Server;
  let baseUrl: string;
  let tasksByKey: Map<string, FakeTask>;

  beforeAll(async () => {
    server = http.createServer((req, res) => {
      let body = "";
      req.on("data", (chunk) => (body += chunk));
      req.on("end", () => {
        res.setHeader("Content-Type", "application/json");

        if (req.method === "GET" && req.url === "/api/v1/tasks") {
          res.writeHead(200);
          res.end(JSON.stringify({ tasks: Array.from(tasksByKey.values()) }));
          return;
        }

        if (req.method === "PATCH" && req.url?.startsWith("/api/v1/tasks/")) {
          const key = decodeURIComponent(req.url.split("/").pop() || "");
          const existing = tasksByKey.get(key);
          if (!existing) {
            res.writeHead(404);
            res.end(JSON.stringify({ error: `Task ${key} not found` }));
            return;
          }
          const { laneId } = JSON.parse(body || "{}");
          existing.laneId = laneId;
          res.writeHead(200);
          res.end(JSON.stringify({ task: existing }));
          return;
        }

        if (req.method === "POST" && req.url === "/api/v1/quick") {
          const { raw } = JSON.parse(body || "{}");
          const task: FakeTask = { key: "LK-9", title: raw, laneId: "triage", priority: "medium" };
          tasksByKey.set(task.key, task);
          res.writeHead(201);
          res.end(JSON.stringify({ success: true, task }));
          return;
        }

        res.writeHead(404);
        res.end(JSON.stringify({ error: "not found" }));
      });
    });

    await new Promise<void>((resolvePromise) => server.listen(0, "127.0.0.1", resolvePromise));
    const { port } = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolvePromise) => server.close(() => resolvePromise()));
  });

  beforeEach(() => {
    tasksByKey = new Map([
      ["LK-42", { key: "LK-42", title: "Sample task", laneId: "triage", priority: "high" }],
      ["LK-101", { key: "LK-101", title: "Another task", laneId: "todo", priority: "medium" }]
    ]);
  });

  function connectedEnv() {
    return { ...process.env, LANEKEEPER_API_URL: baseUrl, LANEKEEPER_API_TOKEN: "lk_dev_test" };
  }

  function disconnectedEnv() {
    const env = { ...process.env };
    delete env.LANEKEEPER_API_URL;
    delete env.LANEKEEPER_API_TOKEN;
    return env;
  }

  it("displays usage banner when called without arguments", async () => {
    const { stdout } = await execFileAsync("node", [CLI_PATH], { env: disconnectedEnv() });
    expect(stdout).toContain("Lanekeeper CLI (lk) - Developer Task & Flight Deck Companion");
    expect(stdout).toContain("lk add");
    expect(stdout).toContain("lk list");
    expect(stdout).toContain("lk start");
    expect(stdout).toContain("lk close");
  });

  it("lists real tasks from the connected backend", async () => {
    const { stdout } = await execFileAsync("node", [CLI_PATH, "list"], { env: connectedEnv() });
    expect(stdout).toContain("Lanekeeper Flight Deck (Terminal View)");
    expect(stdout).toContain("LK-42");
    expect(stdout).toContain("Sample task");
    expect(stdout).toContain("LK-101");
    expect(stdout).toContain("lk start <KEY>");
  });

  it("reports local mode instead of fake data when no backend is connected", async () => {
    const { stdout } = await execFileAsync("node", [CLI_PATH, "list"], { env: disconnectedEnv() });
    expect(stdout).toContain("[Local Mode]");
    expect(stdout).toContain("LANEKEEPER_API_TOKEN");
    expect(stdout).not.toContain("LK-101");
  });

  it("transitions a real task to in-progress and suggests a git branch on lk start", async () => {
    const { stdout } = await execFileAsync("node", [CLI_PATH, "start", "LK-42"], { env: connectedEnv() });
    expect(stdout).toContain("Starting LK-42: Sample task");
    expect(stdout).toContain("Lane: inprogress");
    expect(stdout).toContain("git checkout -b feature/lk-42-task");
    expect(tasksByKey.get("LK-42")?.laneId).toBe("inprogress");
  });

  it("transitions a real task to done on lk close or done", async () => {
    const { stdout: closeOut } = await execFileAsync("node", [CLI_PATH, "close", "LK-42"], { env: connectedEnv() });
    expect(closeOut).toContain("Closing LK-42: Sample task");
    expect(closeOut).toContain("Lane: done");
    expect(tasksByKey.get("LK-42")?.laneId).toBe("done");

    const { stdout: doneOut } = await execFileAsync("node", [CLI_PATH, "done", "LK-101"], { env: connectedEnv() });
    expect(doneOut).toContain("Closing LK-101: Another task");
    expect(tasksByKey.get("LK-101")?.laneId).toBe("done");
  });

  it("reports a clean error when transitioning a task that doesn't exist", async () => {
    const { stdout, stderr } = await execFileAsync("node", [CLI_PATH, "start", "LK-999"], { env: connectedEnv() });
    expect(stdout + stderr).toContain("Task LK-999 not found");
  });

  it("safely handles special prototype keys without polluting Object.prototype", async () => {
    const { stdout, stderr } = await execFileAsync(
      "node",
      [CLI_PATH, "start", "__proto__"],
      { env: connectedEnv() }
    );
    expect(stdout + stderr).toMatch(/Task __proto__ not found/i);
    expect((Object.prototype as any).laneId).toBeUndefined();
  });

  it("ingests a task against the connected backend on lk add", async () => {
    const { stdout } = await execFileAsync(
      "node",
      [CLI_PATH, "add", "Refactor profile header !urgent #frontend"],
      { env: connectedEnv() }
    );
    expect(stdout).toContain("Ingested task: [LK-9]");
    expect(stdout).toContain("Refactor profile header !urgent #frontend");
  });

  it("handles quickAdd locally when token is omitted", async () => {
    const { stdout } = await execFileAsync(
      "node",
      [CLI_PATH, "add", "Refactor profile header !urgent #frontend"],
      { env: disconnectedEnv() }
    );
    expect(stdout).toContain("[Local Mode] Parsed quick task");
    expect(stdout).toContain("Refactor profile header !urgent #frontend");
    expect(stdout).toContain("LANEKEEPER_API_TOKEN");
  });

  it("errors cleanly on lk add with missing text", async () => {
    try {
      await execFileAsync("node", [CLI_PATH, "add"], { env: disconnectedEnv() });
      expect.unreachable("Should have failed with exit code 1");
    } catch (err: any) {
      expect(err.code).toBe(1);
      expect(err.stderr).toContain("Error: Please provide task text.");
    }
  });

  it("errors cleanly on lk start with missing key", async () => {
    try {
      await execFileAsync("node", [CLI_PATH, "start"], { env: disconnectedEnv() });
      expect.unreachable("Should have failed with exit code 1");
    } catch (err: any) {
      expect(err.code).toBe(1);
      expect(err.stderr).toContain("Error: Please provide task key");
    }
  });
});
