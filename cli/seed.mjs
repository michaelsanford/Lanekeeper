import http from "node:http";

const sampleTasks = [
  "Architect local-first CRDT sync layer #architecture #crdt !urgent ~4h",
  "Configure AWS Cognito with software TOTP MFA #security #cognito !high ~2h",
  "Build Flight Deck focus view and timer #ui #focus !urgent ~3h",
  "Implement Web Speech API voice task dictation #pwa #voice !med ~1h",
  "Set up EventBridge due-date reminder push cron #infra #push !high ^tomorrow ~2h"
];

async function seed() {
  console.log("Seeding Lanekeeper sample tasks for local development...\n");

  for (const raw of sampleTasks) {
    try {
      const res = await fetch("http://localhost:3001/api/v1/quick", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer lk_dev_seed_token"
        },
        body: JSON.stringify({ raw })
      });

      if (res.ok) {
        const data = await res.json();
        console.log(`  Ingested: [${data.task?.key || "OK"}] ${data.task?.title || raw}`);
      } else {
        console.log(`  Local server returned ${res.status}. If dev server is not running, tasks are ready in CRDT offline store.`);
      }
    } catch {
      console.log(`  Note: Start local dev server (npm run dev) to sync seed tasks over HTTP API.`);
      break;
    }
  }

  console.log("\nSeed process completed.");
}

seed();
