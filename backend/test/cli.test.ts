import { describe, it, expect } from "vitest";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const __dirname = dirname(fileURLToPath(import.meta.url));
const CLI_PATH = resolve(__dirname, "../../cli/lk.mjs");

describe("Developer CLI Companion (lk)", () => {
  it("displays usage banner when called without arguments", async () => {
    const { stdout } = await execFileAsync("node", [CLI_PATH]);
    expect(stdout).toContain("Lanekeeper CLI (lk) - Developer Task & Flight Deck Companion");
    expect(stdout).toContain("lk add");
    expect(stdout).toContain("lk list");
    expect(stdout).toContain("lk start");
    expect(stdout).toContain("lk close");
  });

  it("lists active flight deck items", async () => {
    const { stdout } = await execFileAsync("node", [CLI_PATH, "list"]);
    expect(stdout).toContain("Lanekeeper Flight Deck (Terminal View)");
    expect(stdout).toContain("LK-101");
    expect(stdout).toContain("LK-102");
    expect(stdout).toContain("lk start <KEY>");
  });

  it("suggests conventional git branch on lk start", async () => {
    const { stdout } = await execFileAsync("node", [CLI_PATH, "start", "LK-42"]);
    expect(stdout).toContain("Starting LK-42...");
    expect(stdout).toContain("git checkout -b feature/lk-42-task");
  });

  it("confirms task completion on lk close or done", async () => {
    const { stdout: closeOut } = await execFileAsync("node", [CLI_PATH, "close", "LK-42"]);
    expect(closeOut).toContain("Task LK-42 marked as Done.");

    const { stdout: doneOut } = await execFileAsync("node", [CLI_PATH, "done", "LK-101"]);
    expect(doneOut).toContain("Task LK-101 marked as Done.");
  });

  it("handles quickAdd locally when token is omitted", async () => {
    const { stdout } = await execFileAsync("node", [
      CLI_PATH,
      "add",
      "Refactor profile header !urgent #frontend"
    ]);
    expect(stdout).toContain("[Local Mode] Parsed quick task");
    expect(stdout).toContain("Refactor profile header !urgent #frontend");
    expect(stdout).toContain("LANEKEEPER_API_TOKEN");
  });

  it("errors cleanly on lk add with missing text", async () => {
    try {
      await execFileAsync("node", [CLI_PATH, "add"]);
      expect.unreachable("Should have failed with exit code 1");
    } catch (err: any) {
      expect(err.code).toBe(1);
      expect(err.stderr).toContain("Error: Please provide task text.");
    }
  });

  it("errors cleanly on lk start with missing key", async () => {
    try {
      await execFileAsync("node", [CLI_PATH, "start"]);
      expect.unreachable("Should have failed with exit code 1");
    } catch (err: any) {
      expect(err.code).toBe(1);
      expect(err.stderr).toContain("Error: Please provide task key");
    }
  });
});
