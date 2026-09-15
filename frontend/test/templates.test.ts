import { describe, it, expect, beforeEach } from "vitest";
import { crdtStore } from "../src/crdt/doc.js";
import {
  WORKFLOW_TEMPLATES,
  getWorkflowTemplate,
  DEFAULT_TEMPLATE_ID
} from "../src/utils/templates.js";

describe("Workflow Templates & Project-Scoped Lanes", () => {
  beforeEach(() => {
    // Reset to default project state
    crdtStore.switchProject("default", "Lanekeeper Core", "LK", DEFAULT_TEMPLATE_ID);
  });

  it("exposes curated, distinct workflow templates with valid lanes", () => {
    expect(WORKFLOW_TEMPLATES.length).toBeGreaterThanOrEqual(5);

    for (const tmpl of WORKFLOW_TEMPLATES) {
      expect(tmpl.id).toBeDefined();
      expect(tmpl.name.length).toBeGreaterThan(0);
      expect(tmpl.description.length).toBeGreaterThan(0);
      expect(tmpl.lanes.length).toBeGreaterThanOrEqual(3);

      // Verify each lane in template has required properties and flow types
      for (const lane of tmpl.lanes) {
        expect(lane.id).toBeDefined();
        expect(lane.name).toBeDefined();
        expect(lane.color).toMatch(/^#[0-9a-fA-F]{6}$/);
        expect(["backlog", "unstarted", "started", "completed", "cancelled"]).toContain(lane.type);
      }
    }
  });

  it("retrieves templates by ID with safe fallback", () => {
    const kanban = getWorkflowTemplate("simple-kanban");
    expect(kanban.id).toBe("simple-kanban");
    expect(kanban.lanes).toHaveLength(3);

    const bugTracker = getWorkflowTemplate("bug-tracker");
    expect(bugTracker.id).toBe("bug-tracker");
    expect(bugTracker.lanes.some((l) => l.id === "reported")).toBe(true);

    // Fallback on unknown template ID
    const fallback = getWorkflowTemplate("non-existent-template-id");
    expect(fallback.id).toBe(DEFAULT_TEMPLATE_ID);
  });

  it("provisions projects scoped with their own chosen workflow template", () => {
    // Create a new Bug Tracking project
    const bugProj = crdtStore.createProject("Bug Incident Center", "BUG", "bug-tracker");
    expect(bugProj.prefix).toBe("BUG");
    expect(bugProj.templateId).toBe("bug-tracker");

    const bugLanes = crdtStore.getLanes();
    expect(bugLanes.map((l) => l.id)).toEqual([
      "reported",
      "investigating",
      "fixing",
      "verifying",
      "resolved",
      "wontfix"
    ]);

    // Create another project using Simple Kanban (3 lanes)
    const kanbanProj = crdtStore.createProject("Sprint Standup", "SSP", "simple-kanban");
    expect(kanbanProj.prefix).toBe("SSP");
    expect(kanbanProj.templateId).toBe("simple-kanban");

    const kanbanLanes = crdtStore.getLanes();
    expect(kanbanLanes.map((l) => l.id)).toEqual(["todo", "inprogress", "done"]);

    // Verify lanes remain isolated per project when switching back
    crdtStore.switchProject(bugProj.id, bugProj.name, bugProj.prefix);
    const restoredBugLanes = crdtStore.getLanes();
    expect(restoredBugLanes.map((l) => l.id)).toEqual([
      "reported",
      "investigating",
      "fixing",
      "verifying",
      "resolved",
      "wontfix"
    ]);
  });

  it("applies a workflow template to an existing project and safely remaps tasks", () => {
    // Start with a project that has tasks across multiple lanes
    const proj = crdtStore.createProject("Migration Test Project", "MIG", "simple-kanban");
    const t1 = crdtStore.addTask({ title: "Task in Todo", laneId: "todo" });
    const t2 = crdtStore.addTask({ title: "Task in Progress", laneId: "inprogress" });
    const t3 = crdtStore.addTask({ title: "Task Done", laneId: "done" });

    // Apply Bug Tracker template (reported, investigating, fixing, verifying, resolved, wontfix)
    crdtStore.applyWorkflowTemplate("bug-tracker");

    const newLanes = crdtStore.getLanes();
    const newLaneIds = newLanes.map((l) => l.id);
    expect(newLaneIds).toEqual([
      "reported",
      "investigating",
      "fixing",
      "verifying",
      "resolved",
      "wontfix"
    ]);

    // Verify tasks are preserved and safely remapped
    const allTasks = crdtStore.getTasks();
    expect(allTasks).toHaveLength(3);

    const remappedT1 = allTasks.find((t) => t.id === t1.id);
    const remappedT2 = allTasks.find((t) => t.id === t2.id);
    const remappedT3 = allTasks.find((t) => t.id === t3.id);

    // All remapped tasks must belong to valid lanes in the new template
    expect(newLaneIds).toContain(remappedT1?.laneId);
    expect(newLaneIds).toContain(remappedT2?.laneId);
    expect(newLaneIds).toContain(remappedT3?.laneId);

    // Check type matching:
    // t2 was 'inprogress' (type: 'started') -> maps to a started lane in bug-tracker ('fixing')
    const laneForT2 = newLanes.find((l) => l.id === remappedT2?.laneId);
    expect(laneForT2?.type).toBe("started");

    // t3 was 'done' (type: 'completed') -> maps to a completed lane in bug-tracker ('resolved')
    const laneForT3 = newLanes.find((l) => l.id === remappedT3?.laneId);
    expect(laneForT3?.type).toBe("completed");

    // Verify project metadata templateId was updated
    expect(crdtStore.getMetadata().templateId).toBe("bug-tracker");
  });
});
