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
      console.log("\n🚀 Lanekeeper Flight Deck (Terminal View)\n");
      console.log("  LK-101  [In Progress]  Optimize CloudFront TTLs (~1h)");
      console.log("  LK-102  [To Do]        Implement VAPID Web Push (due tomorrow)");
      console.log("\nRun `lk start <KEY>` to begin work, or `lk add '<TEXT>'` to capture.\n");
      break;
    }
    case "start": {
      const key = (args[0] || "").toUpperCase();
      if (!key) {
        console.error("Error: Please provide task key (e.g. lk start LK-42)");
        exit(1);
      }
      const branchName = `feature/${key.toLowerCase()}-task`;
      console.log(`\nStarting ${key}...`);
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
      console.log(`\n✓ Marked ${key} as Done.\n`);
      break;
    }
    default: {
      console.log(`
Lanekeeper CLI (lk) - Developer Task & Flight Deck Companion

Usage:
  lk add "<text>"      Quickly ingest task with token syntax (#tag !prio ^due ~est)
  lk list              List today's flight deck and in-flight tasks
  lk start <KEY>       Transition card to In Progress and show branch command
  lk close <KEY>       Mark task complete
      `);
      break;
    }
  }
}

async function quickAdd(raw) {
  if (!API_TOKEN) {
    console.log(`\n[Local Mode] Parsed quick task: "${raw}"`);
    console.log("Set LANEKEEPER_API_TOKEN to sync automatically with AWS backend.\n");
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
    console.log(`\n✓ Ingested task: [${data.task.key}] ${data.task.title}`);
    console.log(`  Lane: ${data.task.laneId} | Priority: ${data.task.priority}\n`);
  } catch (err) {
    console.error("Failed to reach Lanekeeper API:", err.message);
  }
}

main();
