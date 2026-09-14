import { describe, it, expect } from "vitest";
import { parseIssueKeysFromCommit } from "../src/handlers/github.js";

describe("GitHub Commit Message Issue Parser", () => {
  it("extracts issue key and close action from 'fixes LK-42'", () => {
    const msg = "fix(auth): handle expired tokens cleanly (fixes LK-42)";
    const matches = parseIssueKeysFromCommit(msg);
    expect(matches).toHaveLength(1);
    expect(matches[0].key).toBe("LK-42");
    expect(matches[0].action).toBe("close");
  });

  it("extracts multiple issues with different verbs", () => {
    const msg = "chore: cleanup modules closes LK-10 and refs LK-11";
    const matches = parseIssueKeysFromCommit(msg);
    expect(matches).toHaveLength(2);
    expect(matches[0]).toEqual({ key: "LK-10", action: "close" });
    expect(matches[1]).toEqual({ key: "LK-11", action: "review" });
  });

  it("extracts bare issue key without verb as ref", () => {
    const msg = "feat: implement kanban drag LK-999";
    const matches = parseIssueKeysFromCommit(msg);
    expect(matches).toHaveLength(1);
    expect(matches[0]).toEqual({ key: "LK-999", action: "ref" });
  });
});
