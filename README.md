# Lanekeeper 🚀

> **A fast, local-first task and project management PWA designed for solo developers and small engineering teams.**  
> *The sweet spot between Todoist (instant, frictionless capture, lightning-fast) and Jira (project keys, kanban workflow lanes, structured metadata, estimation, git automation).*

---

## 🌟 Key Capabilities

- **⚡ Local-First CRDT Architecture**: Built on **Yjs** and **y-indexeddb**. Zero-latency local reads and writes, 100% offline functionality, and mathematical conflict-free convergence over AWS Serverless.
- **🏷️ Deterministic Project Prefixes & Offline ID Leasing**: Predictable issue numbers (e.g. `LK-42`) backed by atomic DynamoDB counters and offline ID reservation leases so you can create tickets on an airplane without number collisions.
- **🔐 Amazon Cognito with Enforced TOTP MFA**: Hardware/Software Token MFA (`SOFTWARE_TOKEN_MFA`) with QR code onboarding flow.
- **🎯 Today'\''s Flight Deck (Focus Mode - Press `F`)**: Cures cognitive fatigue by collapsing boards down to 1–3 active cards in flight, overdue/due alerts, and a local markdown scratchpad.
- **🔔 Native Web Push Notifications**: Standards-based RFC 8291/8292 VAPID push notifications delivered via Service Worker, with EventBridge scheduled due date reminders.
- **🗣️ On-Device Voice-to-Task Capture**: Free, zero-cloud-cost speech-to-task dictation using the native browser Web Speech API.
- **📲 PWA Web Share Target API & App Shortcuts**: Appears directly in iOS / Android / macOS native share sheets, plus home screen long-press jumplist shortcuts for instant capture.
- **🐙 GitHub Smart Commit & PR Ingestion**: Pushing `fix(auth): handle token expiry (fixes LK-42)` automatically transitions `LK-42` to Done and embeds the commit into the task activity log.
- **💻 Terminal CLI Companion (`lk`)**: Rapid terminal capture, flight deck listing, and branch commands without leaving your shell.

---

## 🏗️ Architecture

```text
                                  +-----------------------+
                                  |   Browser / PWA SPA   |
                                  | React 19 + Tailwind 4 |
                                  +-----------+-----------+
                                              |
                   +--------------------------+--------------------------+
                   | (Offline Local Reads/Writes)                        | (Sync State Vectors & Diffs)
                   v                                                     v
        +---------------------+                               +---------------------+
        |  Yjs Local CRDT Doc |                               |   AWS HTTP API v2   |
        |  y-indexeddb (IDB)  |                               +----------+----------+
        +---------------------+                                          |
                                              +--------------------------+--------------------------+
                                              |                          |                          |
                                              v                          v                          v
                                     +-----------------+        +-----------------+        +-----------------+
                                     |  Sync Function  |        | Ingest Function |        |  Push Function  |
                                     | (Node 24 / Yjs) |        |  (API Key Web)  |        | (VAPID WebPush) |
                                     +--------+--------+        +--------+--------+        +--------+--------+
                                              |                          |                          |
                                              +--------------------------+--------------------------+
                                                                         |
                                                                         v
                                                            +------------------------+
                                                            | Amazon DynamoDB (DDB)  |
                                                            |   Single-Table Model   |
                                                            +------------------------+
```

---

## ⌨️ Quick Ingestion Syntax

Type naturally into the Quick Capture modal (`C` or `Cmd+K`) or via the `lk` CLI:

```text
Upgrade Cognito auth pool #backend #infra !urgent ^tomorrow ~2h @michael
```

| Token | Meaning | Examples |
| :--- | :--- | :--- |
| `text` | Task Title | Any leading/trailing words |
| `#tag` | Category / Tag | `#backend`, `#frontend`, `#infra` |
| `!priority` | Task Priority | `!urgent`, `!high`, `!med`, `!low` |
| `^due` | Due Date | `^today`, `^tomorrow`, `^friday`, `^2026-10-31` |
| `~estimate` | Time Sizing | `~30m`, `~1h`, `~2.5h`, `~3pt` |
| `@assignee` | Team Member | `@michael`, `@alex` |

---

## 🚀 Getting Started

### Prerequisites
- Node.js `>= 24.0.0`
- AWS SAM CLI `>= 1.120.0` (for cloud backend deployment)

### 1. Run the Frontend PWA Locally
```bash
cd frontend
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173). The app will run in full local-first mode with IndexedDB caching and full offline support.

### 2. Run Tests
```bash
# Frontend Unit & CRDT tests
cd frontend
npm test

# Backend Serverless & Parser tests
cd ../backend
npm test
```

### 3. Deploy the AWS Serverless Backend
```bash
cd backend
sam build
sam deploy --guided
```

### 4. Use the Terminal CLI (`lk`)
```bash
export LANEKEEPER_API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com"
export LANEKEEPER_API_TOKEN="lk_live_your_token"

node cli/lk.mjs add "Investigate memory spike #backend !urgent ~1h"
node cli/lk.mjs list
node cli/lk.mjs start LK-42
```

---

## 📜 License
MIT
