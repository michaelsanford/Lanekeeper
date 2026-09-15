# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development & Git Workflow

- **Do NOT create Pull Requests**: This project is in rapid single-developer development. Do not open PRs or create extraneous branches.
- **Work directly on `main`**: All commits must be made directly on `main` with a clean, linear history.
- **No merge commits**: Fast-forward only. Never produce merge commits.
- **Author identity**: All git commits must be authored by `Michael Sanford <michaelsanford@users.noreply.github.com>`.
- **Naming restrictions**: Never use `stelvio` anywhere in this project.
- **Conventional Commits**: Format commit messages as `<type>(<scope>): <description>` (v1.0.0).
- **Strictly zero emojis**: Never use emojis in code, comments, documentation, commit messages, or assistant output.

## Commands

```bash
npm install
npm run dev          # backend (:3001) + frontend (:5173) concurrently; Vite proxies /api -> :3001
npm test             # backend then frontend vitest suites
npm run build        # backend tsc, then frontend tsc -b + vite build
npm run seed         # cli/seed.mjs, sample tasks via the quick-ingest endpoint
npm run validate     # npm test + sam validate --lint (requires the SAM CLI)
```

Per workspace (`npm --workspace=backend`, `npm --workspace=frontend`), or `cd` into the dir:

```bash
cd frontend && npx vitest run test/rank.test.ts       # single test file
cd frontend && npx vitest run -t "archives completed" # single test by name
cd backend  && npm run test:watch                     # vitest watch
cd frontend && npm run lint                           # oxlint — frontend only, there is no root lint
cd backend  && sam build && sam deploy --guided       # deploy the serverless stack
```

No Docker or DynamoDB Local is needed: `isLocalDev()` in `backend/src/common/ddb.ts` swaps DynamoDB for in-memory `Map`s whenever `AWS_LAMBDA_FUNCTION_NAME` and `USE_AWS_DDB` are both unset.

## Architecture

npm workspaces monorepo: `frontend` (React 19 + Vite + Tailwind v4 PWA), `backend` (AWS Lambda handlers + SAM), and `cli/` — plain `.mjs` scripts, not a workspace, exposed as the `lk` bin.

### The Yjs document is the source of truth

`frontend/src/crdt/doc.ts` exports a singleton `crdtStore` wrapping one `Y.Doc` with four top-level types: `tasks` (Map), `lanes` (Map), `laneOrder` (Array), `metadata` (Map). All UI reads and writes go through it. There is no Redux/Zustand/query layer — `useCrdt()` (`frontend/src/hooks/useCrdt.ts`) subscribes to a hand-rolled listener set and re-derives plain arrays on every doc update. Mutating methods that must repaint call `notifyListeners()` explicitly; the `doc.on('update')` handler also fires it. If you add a store method that changes data outside a Yjs type, call `notifyListeners()` yourself.

**One Y.Doc per project.** Each project persists to its own IndexedDB database (`lanekeeper_default_project`, or `lanekeeper_project_<id>`). `switchProject()` tears down persistence, swaps in a fresh `Y.Doc`, and re-registers listeners. The *list* of projects and the active project id live in `localStorage`, deliberately outside the CRDT — so project metadata is reconciled from both sources in `getMetadata()`/`ensureDefaultLanes()`.

**Sync is a stateless state-vector diff exchange.** `frontend/src/crdt/sync.ts` sends `{stateVector, updates}` (base64 Yjs binary) to `POST /api/v1/sync`; `backend/src/handlers/sync.ts` loads the stored doc from DynamoDB, applies the client update, and returns `{serverDiff, serverStateVector}`. The client caches `lastServerVector` to send incremental diffs; without it, it sends the full doc state.

**Offline ID leasing.** Task keys (`LK-42`) come from an atomic DynamoDB counter (`backend/src/common/counter.ts`). The client pre-reserves contiguous blocks and consumes them from `localStorage` (`frontend/src/crdt/leases.ts`); sync refills the block when `hasRemainingLease()` is false. When a block is exhausted offline, keys degrade to `PREFIX-temp-NNNN`.

### Backend handlers are Lambda-shaped everywhere

Every handler in `backend/src/handlers/` takes an `APIGatewayProxyEventV2` and returns an `APIGatewayProxyResultV2`, including in local dev. `backend/src/dev-server.ts` is a bare `node:http` server that synthesizes API Gateway v2 events and injects a fake JWT authorizer claim (`sub: dev-user-01`, `custom:workspaceId: default`).

**Adding an endpoint means editing two places**: the route table in `dev-server.ts` *and* the `Events` block of the matching function in `backend/template.yaml`. They are not generated from a shared source.

DynamoDB is a single table (`PK`/`SK` + `GSI1`/`GSI2`, all `ALL` projection) with TTL and streams enabled. Key patterns: `WORKSPACE#<id>` / `CRDT#<projectId>` for documents, `WORKSPACE#<id>` / `PROJECT#<id>` for counters, `TOKEN_HASH#<sha256>` / `METADATA` for API tokens.

Two auth paths (`backend/src/common/auth.ts`): the SPA uses Cognito JWT claims via `getCognitoAuthContext()`; the CLI and external scripts use bearer API tokens validated by SHA-256 hash lookup in `validateApiToken()`. Any token starting with `lk_dev_` — or any request in local dev — short-circuits to a dev identity.

### Lanes, templates, and feature flags

`LaneType` (`backlog | unstarted | started | completed | cancelled`) is what behavior keys off, not lane ids — auto-archiving, completed-task styling in the board/table/calendar views, and template migration all match on `type`. Lane *ids* differ per workflow template (`frontend/src/utils/templates.ts`); `applyWorkflowTemplate()` remaps orphaned tasks by matching old lane `type` to a new lane of the same type. The GitHub smart-commit handler is the exception: it hardcodes the `software-dev` lane ids (`done`, `review`, `inprogress`).

Feature flags (`frontend/src/features/engine.ts`) resolve in order: URL override (`?ff_<flagId>=true`) → `localStorage` → definition default. Adding a flag means adding it to `FEATURE_DEFINITIONS` and the `FeatureFlagId` union.

## Conventions and gotchas

- **The quick-capture parser is duplicated.** `backend/src/common/parser.ts` and `frontend/src/utils/parser.ts` are near-identical copies with different import paths. Changes to the `#tag !priority ^due ~estimate @assignee` syntax must be applied to both, and both have their own tests.
- **Imports carry `.js` extensions even for `.ts`/`.tsx` sources**, including in frontend code and tests (`import { Header } from '../src/components/layout/Header.js'`). Backend is `module: NodeNext` where this is mandatory; the frontend follows the same style.
- **Tests run in Vitest's default Node environment — there is no jsdom and no vitest config file.** React components are tested with `renderToString` from `react-dom/server`, not Testing Library. Consequently any code touching `window`, `localStorage`, `indexedDB`, or `crypto.randomUUID` must degrade gracefully; the existing code wraps every storage access in `try/catch` and `CrdtStore` falls back to in-memory `Y.Doc`s when `indexedDB` is undefined. Preserve that pattern rather than adding a DOM environment.
- Backend `package.json` declares `engines.node >= 24`, but the SAM template deploys `nodejs22.x` — keep runtime APIs within Node 22.
- Frontend `tsconfig.app.json` sets `noUnusedLocals`/`noUnusedParameters`, so `npm run build` fails on unused bindings that dev mode tolerates.
