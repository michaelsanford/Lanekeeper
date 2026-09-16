#!/usr/bin/env node
import { argv, env, exit } from "node:process";

const API_URL = env.LANEKEEPER_API_URL || "https://api.lanekeeper.dev";
const API_TOKEN = env.LANEKEEPER_API_TOKEN || "";

const command = argv[2];
const args = argv.slice(3);

async function main() {
  switch (command) {
    case "add": {
      const text = args.join(" ").trim();
      if (!text) {
        console.error("Error: Please provide task text.\nExample: lk add 'Fix cache header !urgent #infra'");
        exit(1);
      }
      await quickAdd(text);
      break;
    }
    case "list": {
      await listTasks();
      break;
    }
    case "start": {
      const key = (args[0] || "").toUpperCase();
      if (!key) {
        console.error("Error: Please provide task key (e.g. lk start LK-42)");
        exit(1);
      }
      await transitionTask(key, "inprogress", "Starting");
      const branchName = `feature/${key.toLowerCase()}-task`;
      console.log(`Suggested git command:`);
      console.log(`  git checkout -b ${branchName}\n`);
      break;
    }
    case "close":
    case "done": {
      const key = (args[0] || "").toUpperCase();
      if (!key) {
        console.error("Error: Please provide task key (e.g. lk close LK-42)");
        exit(1);
      }
      await transitionTask(key, "done", "Closing");
      break;
    }
    default: {
      console.log(`
Lanekeeper CLI (lk) - Developer Task & Flight Deck Companion

Usage:
  lk add "<text>"      Quickly ingest task with token syntax (#tag !prio ^due ~est)
  lk list              List tasks from the connected Lanekeeper project
  lk start <KEY>       Transition card to In Progress and show branch command
  lk close <KEY>       Mark task complete

Set LANEKEEPER_API_URL and LANEKEEPER_API_TOKEN to connect to your backend.
      `);
      break;
    }
  }
}

function requireApiToken(action) {
  if (!API_TOKEN) {
    console.log(`\n[Local Mode] Cannot ${action} without a connected backend.`);
    console.log("Set LANEKEEPER_API_TOKEN to sync automatically with your Lanekeeper backend.\n");
    return false;
  }
  return true;
}

async function quickAdd(raw) {
  if (!requireApiToken(`ingest "${raw}"`)) {
    console.log(`[Local Mode] Parsed quick task: "${raw}"`);
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/quick`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({ raw })
    });

    if (!res.ok) {
      console.error(`Error: Server responded with status ${res.status}`);
      return;
    }

    const data = await res.json();
    console.log(`\nIngested task: [${data.task.key}] ${data.task.title}`);
    console.log(`  Lane: ${data.task.laneId} | Priority: ${data.task.priority}\n`);
  } catch (err) {
    console.error("Failed to reach Lanekeeper API:", err.message);
  }
}

async function listTasks() {
  if (!requireApiToken("list tasks")) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/tasks`, {
      headers: { Authorization: `Bearer ${API_TOKEN}` }
    });

    if (!res.ok) {
      console.error(`Error: Server responded with status ${res.status}`);
      return;
    }

    const data = await res.json();
    const tasks = data.tasks || [];

    console.log("\nLanekeeper Flight Deck (Terminal View)\n");
    if (tasks.length === 0) {
      console.log("  No tasks yet. Run `lk add \"<text>\"` to capture one.\n");
      return;
    }

    for (const task of tasks) {
      const due = task.dueDate ? ` (due ${task.dueDate})` : "";
      const est = task.estimateMinutes ? ` (~${task.estimateMinutes}m)` : "";
      console.log(`  ${task.key.padEnd(8)}[${task.laneId}] ${task.title}${due}${est}`);
    }
    console.log("\nRun `lk start <KEY>` to begin work, or `lk close <KEY>` to finish.\n");
  } catch (err) {
    console.error("Failed to reach Lanekeeper API:", err.message);
  }
}

async function transitionTask(key, laneId, verb) {
  if (!requireApiToken(`transition ${key}`)) {
    return;
  }

  try {
    const res = await fetch(`${API_URL}/api/v1/tasks/${encodeURIComponent(key)}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_TOKEN}`
      },
      body: JSON.stringify({ laneId })
    });

    if (res.status === 404) {
      console.error(`Error: Task ${key} not found`);
      return;
    }
    if (!res.ok) {
      console.error(`Error: Server responded with status ${res.status}`);
      return;
    }

    const data = await res.json();
    console.log(`\n${verb} ${data.task.key}: ${data.task.title}`);
    console.log(`  Lane: ${data.task.laneId}\n`);
  } catch (err) {
    console.error("Failed to reach Lanekeeper API:", err.message);
  }
}

main();
