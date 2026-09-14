import { describe, it, expect } from "vitest";
import * as Y from "yjs";
import {
  loadDocFromBase64,
  encodeDocToBase64,
  encodeStateVectorBase64,
  computeDiffUpdate,
  applyClientUpdate,
  initializeProjectDoc,
  addTaskToDoc
} from "../src/common/crdt.js";
import type { Task } from "../src/common/types.js";

describe("CRDT State Operations & Convergence", () => {
  it("initializes project with default lanes", () => {
    const doc = new Y.Doc();
    initializeProjectDoc(doc, "LK", "Test Project");

    const lanes = doc.getMap("lanes");
    const laneOrder = doc.getArray("laneOrder");

    expect(lanes.size).toBe(6);
    expect(laneOrder.length).toBe(6);
    expect(laneOrder.toArray()).toContain("triage");
    expect(laneOrder.toArray()).toContain("done");
  });

  it("converges between two concurrent clients", () => {
    const serverDoc = new Y.Doc();
    initializeProjectDoc(serverDoc, "LK", "Test Project");

    // Client 1 clones server state
    const client1Doc = new Y.Doc();
    const serverUpdate = Y.encodeStateAsUpdate(serverDoc);
    Y.applyUpdate(client1Doc, serverUpdate);

    // Client 2 clones server state
    const client2Doc = new Y.Doc();
    Y.applyUpdate(client2Doc, serverUpdate);

    // Client 1 adds a task
    const task1: Task = {
      id: "task-1",
      key: "LK-1",
      title: "Task by Client 1",
      description: "Specs",
      priority: "high",
      laneId: "triage",
      rank: "0|100:",
      tags: ["frontend"],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addTaskToDoc(client1Doc, task1);

    // Client 2 adds a task
    const task2: Task = {
      id: "task-2",
      key: "LK-2",
      title: "Task by Client 2",
      description: "Specs",
      priority: "urgent",
      laneId: "todo",
      rank: "0|200:",
      tags: ["backend"],
      subtasks: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    addTaskToDoc(client2Doc, task2);

    // Both send updates to server
    const client1Update = Y.encodeStateAsUpdate(client1Doc, Y.encodeStateVector(serverDoc));
    const client2Update = Y.encodeStateAsUpdate(client2Doc, Y.encodeStateVector(serverDoc));

    Y.applyUpdate(serverDoc, client1Update);
    Y.applyUpdate(serverDoc, client2Update);

    // Sync back to Client 1
    const diffForClient1 = Y.encodeStateAsUpdate(serverDoc, Y.encodeStateVector(client1Doc));
    Y.applyUpdate(client1Doc, diffForClient1);

    // Both docs now have both tasks!
    const client1Tasks = client1Doc.getMap<Task>("tasks");
    expect(client1Tasks.size).toBe(2);
    expect(client1Tasks.get("task-1")?.title).toBe("Task by Client 1");
    expect(client1Tasks.get("task-2")?.title).toBe("Task by Client 2");
  });

  it("encodes and restores doc from base64", () => {
    const doc1 = new Y.Doc();
    initializeProjectDoc(doc1, "LK", "Test");
    const b64 = encodeDocToBase64(doc1);

    const doc2 = loadDocFromBase64(b64);
    const lanes = doc2.getMap("lanes");
    expect(lanes.size).toBe(6);
  });
});
