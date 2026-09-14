import { describe, it, expect, beforeEach } from "vitest";
import { crdtStore } from "../src/crdt/doc.js";
import { parseQuickTask } from "../src/utils/parser.js";
import { saveLeaseBlock, getNextTaskKey } from "../src/crdt/leases.js";

describe("Frontend Local-First CRDT & Store", () => {
  beforeEach(() => {
    crdtStore.ensureDefaultLanes();
  });

  it("adds and queries tasks in the local CRDT store", () => {
    const task = crdtStore.addTask({
      title: "Write integration tests",
      priority: "high",
      tags: ["testing"]
    });

    expect(task.id).toBeDefined();
    expect(task.title).toBe("Write integration tests");
    expect(task.priority).toBe("high");
    expect(task.laneId).toBe("triage");

    const allTasks = crdtStore.getTasks();
    expect(allTasks.some((t) => t.id === task.id)).toBe(true);
  });

  it("moves a task between workflow lanes", () => {
    const task = crdtStore.addTask({
      title: "Task to move",
      laneId: "triage"
    });

    crdtStore.moveTask(task.id, "inprogress", "0|200:");

    const updated = crdtStore.getTasks().find((t) => t.id === task.id);
    expect(updated?.laneId).toBe("inprogress");
    expect(updated?.rank).toBe("0|200:");
  });

  it("adds, toggles, and promotes subtasks to standalone tickets", () => {
    const parent = crdtStore.addTask({
      title: "Parent Feature",
      priority: "urgent"
    });

    crdtStore.addSubtask(parent.id, "Implement auth handshake");
    crdtStore.addSubtask(parent.id, "Write docs");

    let refreshed = crdtStore.getTasks().find((t) => t.id === parent.id)!;
    expect(refreshed.subtasks).toHaveLength(2);

    const subtaskId = refreshed.subtasks[0].id;
    crdtStore.toggleSubtask(parent.id, subtaskId);

    refreshed = crdtStore.getTasks().find((t) => t.id === parent.id)!;
    expect(refreshed.subtasks[0].completed).toBe(true);

    // Promote subtask 1 to standalone task!
    const child = crdtStore.promoteSubtaskToTask(parent.id, subtaskId);
    expect(child).toBeDefined();
    expect(child?.title).toBe("Implement auth handshake");
    expect(child?.description).toContain(parent.key);

    refreshed = crdtStore.getTasks().find((t) => t.id === parent.id)!;
    // Parent should now only have 1 remaining subtask
    expect(refreshed.subtasks).toHaveLength(1);
    expect(refreshed.subtasks[0].title).toBe("Write docs");
  });

  it("handles offline sequential ID leases", () => {
    saveLeaseBlock("LK", 50, 52);

    expect(getNextTaskKey("LK")).toBe("LK-50");
    expect(getNextTaskKey("LK")).toBe("LK-51");
    expect(getNextTaskKey("LK")).toBe("LK-52");

    // Lease exhausted: fallback to temporary predictable key
    const fallback = getNextTaskKey("LK");
    expect(fallback).toMatch(/^LK-temp-\d+$/);
  });

  it("parses quick ingestion tokens with full fidelity", () => {
    const res = parseQuickTask("Fix memory leak in websocket #backend #perf !urgent ^tomorrow ~90m @michael");
    expect(res.title).toBe("Fix memory leak in websocket");
    expect(res.tags).toEqual(["backend", "perf"]);
    expect(res.priority).toBe("urgent");
    expect(res.estimateMinutes).toBe(90);
    expect(res.assignee).toBe("michael");
    expect(res.dueDate).toBeDefined();
  });

  it("customizes project metadata and workflow lanes", () => {
    // 1. Update project metadata
    crdtStore.updateMetadata({ name: "Infra Engine", prefix: "INFRA" });
    const meta = crdtStore.getMetadata();
    expect(meta.name).toBe("Infra Engine");
    expect(meta.prefix).toBe("INFRA");

    // 2. Add custom workflow lane
    const customLane = crdtStore.addLane("Quality Assurance", "#ec4899", "started", 4);
    expect(customLane.id).toBeDefined();
    expect(customLane.name).toBe("Quality Assurance");

    const allLanes = crdtStore.getLanes();
    expect(allLanes.some((l) => l.id === customLane.id)).toBe(true);

    // 3. Update lane properties
    crdtStore.updateLane(customLane.id, { name: "QA / Staging", wipLimit: 2 });
    const updatedLane = crdtStore.getLanes().find((l) => l.id === customLane.id);
    expect(updatedLane?.name).toBe("QA / Staging");
    expect(updatedLane?.wipLimit).toBe(2);

    // 4. Delete lane and reassign cards
    const cardInLane = crdtStore.addTask({ title: "Card in QA", laneId: customLane.id });
    crdtStore.deleteLane(customLane.id);

    expect(crdtStore.getLanes().some((l) => l.id === customLane.id)).toBe(false);
    const reassignedCard = crdtStore.getTasks().find((t) => t.id === cardInLane.id);
    expect(reassignedCard?.laneId).not.toBe(customLane.id);
  });
});
