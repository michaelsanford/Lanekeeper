import { describe, it, expect } from "vitest";
import { parseQuickTask } from "../src/common/parser.js";

describe("Quick Task Ingestion Parser", () => {
  const fixedBaseDate = new Date("2026-09-15T12:00:00Z");

  it("parses title and all token types accurately", () => {
    const input = "Fix memory leak in auth worker #backend #security !urgent ^tomorrow @michael ~2h";
    const res = parseQuickTask(input, fixedBaseDate);

    expect(res.title).toBe("Fix memory leak in auth worker");
    expect(res.tags).toEqual(["backend", "security"]);
    expect(res.priority).toBe("urgent");
    expect(res.assignee).toBe("michael");
    expect(res.estimateMinutes).toBe(120);
    expect(res.dueDate).toBeDefined();

    const due = new Date(res.dueDate!);
    expect(due.getDate()).toBe(16); // 15 + 1
  });

  it("handles empty or whitespace input cleanly", () => {
    const res = parseQuickTask("   ", fixedBaseDate);
    expect(res.title).toBe("");
    expect(res.tags).toEqual([]);
    expect(res.priority).toBe("none");
  });

  it("parses various priority abbreviations", () => {
    expect(parseQuickTask("Task A !critical").priority).toBe("urgent");
    expect(parseQuickTask("Task B !high").priority).toBe("high");
    expect(parseQuickTask("Task C !med").priority).toBe("medium");
    expect(parseQuickTask("Task D !low").priority).toBe("low");
  });

  it("parses minute and hour estimates", () => {
    expect(parseQuickTask("Task A ~45m").estimateMinutes).toBe(45);
    expect(parseQuickTask("Task B ~1.5h").estimateMinutes).toBe(90);
    expect(parseQuickTask("Task C ~3pt").estimateMinutes).toBe(180);
  });

  it("parses explicit ISO date", () => {
    const res = parseQuickTask("Deploy release ^2026-10-31 !high", fixedBaseDate);
    expect(res.title).toBe("Deploy release");
    expect(res.priority).toBe("high");
    expect(res.dueDate).toBeDefined();
    const d = new Date(res.dueDate!);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(9); // 0-indexed October
    expect(d.getDate()).toBe(31);
  });
});
