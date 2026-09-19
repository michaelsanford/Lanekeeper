import { describe, it, expect } from "vitest";
import { parseQuickTask, parseDateToken } from "../src/common/parser.js";

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

  it("parses explicit ISO date formats", () => {
    const res = parseQuickTask("Deploy release ^2026-11-04 !high", fixedBaseDate);
    expect(res.title).toBe("Deploy release");
    expect(res.priority).toBe("high");
    expect(res.dueDate).toBeDefined();
    const d = new Date(res.dueDate!);
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(10); // 0-indexed November
    expect(d.getDate()).toBe(4);
  });

  it("parses month-day formats with rollover when date has passed", () => {
    // Current base is Sep 15, 2026. apr-04 has already passed in 2026, so targets 2027.
    const resPast = parseQuickTask("Annual audit ^apr-04", fixedBaseDate);
    expect(resPast.dueDate).toBeDefined();
    const dPast = new Date(resPast.dueDate!);
    expect(dPast.getFullYear()).toBe(2027);
    expect(dPast.getMonth()).toBe(3); // April
    expect(dPast.getDate()).toBe(4);

    // nov-04 is in the future relative to Sep 15, 2026, so stays in 2026.
    const resFuture = parseQuickTask("Release prep ^nov-04", fixedBaseDate);
    expect(resFuture.dueDate).toBeDefined();
    const dFuture = new Date(resFuture.dueDate!);
    expect(dFuture.getFullYear()).toBe(2026);
    expect(dFuture.getMonth()).toBe(10); // November
    expect(dFuture.getDate()).toBe(4);
  });

  it("supports day-month format and explicit year", () => {
    const d1 = parseDateToken("04-apr-2026", fixedBaseDate);
    expect(d1).not.toBeNull();
    expect(d1!.getFullYear()).toBe(2026);
    expect(d1!.getMonth()).toBe(3);
    expect(d1!.getDate()).toBe(4);

    const d2 = parseDateToken("14-november", fixedBaseDate);
    expect(d2).not.toBeNull();
    expect(d2!.getFullYear()).toBe(2026);
    expect(d2!.getMonth()).toBe(10);
    expect(d2!.getDate()).toBe(14);
  });

  it("returns null for invalid dates", () => {
    expect(parseDateToken("feb-30", fixedBaseDate)).toBeNull();
    expect(parseDateToken("not-a-date", fixedBaseDate)).toBeNull();
  });
});
