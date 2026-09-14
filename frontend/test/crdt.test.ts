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

  it("automatically assigns ascending ranks to sequentially added tasks in a lane", () => {
    const t1 = crdtStore.addTask({ title: "Rank Item 1", laneId: "backlog" });
    const t2 = crdtStore.addTask({ title: "Rank Item 2", laneId: "backlog" });
    const t3 = crdtStore.addTask({ title: "Rank Item 3", laneId: "backlog" });

    expect(t1.rank).toBeDefined();
    expect(t2.rank).toBeDefined();
    expect(t3.rank).toBeDefined();
    expect(t1.rank < t2.rank).toBe(true);
    expect(t2.rank < t3.rank).toBe(true);
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

  it("sanitizes duplicate lanes and deduplicates tasks by title", () => {
    // Inject duplicated lane in Y.Array
    const laneOrder = crdtStore.doc.getArray<string>("laneOrder");
    laneOrder.push(["triage", "todo", "triage"]);

    // getLanes returns only unique lanes
    const lanes = crdtStore.getLanes();
    const laneIds = lanes.map((l) => l.id);
    const uniqueIds = new Set(laneIds);
    expect(laneIds.length).toBe(uniqueIds.size);

    // sanitizeLaneOrder cleans up the underlying Y.Array
    crdtStore.sanitizeLaneOrder();
    const arrayIds = crdtStore.doc.getArray<string>("laneOrder").toArray();
    expect(arrayIds.length).toBe(new Set(arrayIds).size);

    // Add duplicate tasks with identical titles
    crdtStore.addTask({ title: "Identical duplicate title", laneId: "triage" });
    crdtStore.addTask({ title: "Identical duplicate title", laneId: "triage" });
    const tasksBefore = crdtStore.getTasks().filter((t) => t.title === "Identical duplicate title");
    expect(tasksBefore.length).toBe(2);

    const removed = crdtStore.deduplicateTasks();
    expect(removed).toBe(1);
    const tasksAfter = crdtStore.getTasks().filter((t) => t.title === "Identical duplicate title");
    expect(tasksAfter.length).toBe(1);
  });
});
