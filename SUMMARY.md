# Workspace Summary

LLM-friendly tour of the two repos that make up this project. When you're
asked to help code, skim this first — it tells you where things live, what
owns what, and what's deliberately *not* here.

## Two repos, one product

```
capsuna_work/     # this repo — the web app (UI + serverless API)
piovra/           # sibling repo — the AI agent orchestrator service
```

They talk over HTTPS via a shared-secret (`X-Piovra-Key`) header. The
browser never touches piovra directly; a Netlify function proxies it.

```
Browser ──► Netlify CDN + Functions (capsuna_work)  ──► Piovra (VPS)
          │                                         │
          ├── MongoDB (user data: tasks, meetings…) │
          │                                         ├── Postgres (agents, runs, jobs)
          │                                         ├── OpenAI / Anthropic APIs
          │                                         ├── Langfuse (traces)
          │                                         └── External MCP servers (optional)
```

---

# 1. `capsuna_work` — Capsuna Control Panel

Personal productivity PWA: tasks, meetings, reminders, journals, a focus
timer, and an **Agents** hub that drives piovra.

## 1.1 Stack

- **Frontend**: React 19 + TypeScript + Vite. Routing via `react-router-dom`
  v7. Styling via `styled-components` v5 (theme vars in `src/index.css`).
- **State**: React context. `AppContext` owns domain data + timer;
  `AuthContext` owns login/session; `ToastProvider` owns toast notifications.
- **Backend**: Netlify Functions (CommonJS `.js`) under `netlify/functions/`.
  Database is MongoDB via Mongoose models. One function file per resource
  (CRUD), plus a generic health check and the piovra proxy.
- **Build**: `npm run dev` → vite dev server (currently wrapped in
  `netlify dev` during local work so functions run too). `npm run build` →
  `tsc -b && vite build`, output to `dist/`.

## 1.2 Directory map

```
capsuna_work/
├─ src/
│  ├─ App.tsx                     # routes + top-level providers
│  ├─ main.tsx                    # ReactDOM bootstrap
│  ├─ index.css                   # CSS variables / theme tokens
│  ├─ context/
│  │  ├─ AppContext.tsx           # tasks/meetings/reminders/journals/timer
│  │  └─ AuthContext.tsx          # login state, session
│  ├─ services/
│  │  ├─ api.ts                   # TasksAPI, MeetingsAPI, RemindersAPI, JournalsAPI
│  │  └─ piovra.ts                # PiovraAPI (agents, instances, runs, jobs, skills, SSE)
│  ├─ hooks/
│  │  └─ useOrchestrate.ts        # wraps PiovraAPI.orchestrate w/ turns + abort
│  ├─ pages/
│  │  ├─ Dashboard.tsx            # overview / day view
│  │  ├─ Tasks.tsx                # task board
│  │  ├─ Meetings.tsx
│  │  ├─ Reminders.tsx
│  │  └─ Agents.tsx               # agents hub w/ tabs: chat|agents|instances|schedules|runs
│  ├─ components/
│  │  ├─ ui/
│  │  │  ├─ primitives.tsx        # Card/Button/Input/Badge/Chip/Drawer/…  (design system)
│  │  │  ├─ icons.tsx             # every SVG icon (IconPlus, IconBot, …)
│  │  │  └─ Toast.tsx             # ToastProvider + useToast
│  │  ├─ layout/
│  │  │  ├─ Layout.tsx            # sidebar + nav + topbar (NAV_PRIMARY lives here)
│  │  │  └─ BackgroundFx.tsx      # ambient background effects
│  │  ├─ auth/
│  │  │  ├─ LoginScreen.tsx
│  │  │  └─ ProtectedRoute.tsx
│  │  ├─ agents/                  # Agents hub UI (see §1.5)
│  │  ├─ notes/StickyNote.tsx
│  │  ├─ timer/Timer.tsx          # floating pomodoro / focus timer
│  │  └─ shared/                  # ErrorMessage, LoadingState, TagStyles, LinkifyText
│  └─ types/index.ts              # Task, Meeting, Reminder, Journal, TimerSession
└─ netlify/
   └─ functions/
      ├─ tasks.js, meetings.js, reminders.js, journals.js, kcal.js, notes.js  # CRUD
      ├─ models/                  # Mongoose schemas (Task.js, Meeting.js, …)
      ├─ utils/db.js              # Mongo connection singleton
      ├─ utils/recurringHelpers.js
      ├─ health.js                # liveness
      └─ piovra-proxy.js          # auth + stream forwarder to piovra
```

## 1.3 Data flow for Capsuna CRUD

```
Page/Component ──► AppContext ──► services/api.ts (fetch /.netlify/functions/…)
                                    │
                                    ▼
                          netlify/functions/<resource>.js
                                    │
                                    ▼
                          MongoDB (Mongoose models)
```

- `AppContext` does optimistic updates, error rollback, and shows toasts.
- All domain types come from `src/types/index.ts`. Mongoose schemas in
  `netlify/functions/models/` should stay in sync with them.

## 1.4 Data flow for Agents (SSE)

```
ChatPanel
  └─ useOrchestrate()
       └─ PiovraAPI.orchestrate()   POST /api/piovra/orchestrate   (fetch + SSE)
              │
              ▼
       piovra-proxy.js (Netlify)    injects X-Piovra-Key, pipes the stream
              │
              ▼
       piovra /orchestrate          runs the agent, emits SSE:
                                      event: run.started
                                      event: step          (AgentStep JSON)
                                      event: run.completed | run.failed
```

The proxy is **the only place** `PIOVRA_API_KEY` is known in capsuna_work;
it's a server-side Netlify env var. Browser sees only the relative path.

## 1.5 Agents hub (`src/components/agents/`)

| File                | Purpose                                                         |
| ------------------- | --------------------------------------------------------------- |
| `ChatPanel.tsx`     | Live chat with an instance; renders streaming AgentSteps        |
| `StepCard.tsx`      | Shared step renderer (message / tool_call / tool_result / error) |
| `DefinitionsList.tsx` | Table of agent definitions; + New; edit drawer                |
| `AgentForm.tsx`     | Create/edit an agent definition (skills multi-select)           |
| `InstancesList.tsx` | Deployed instances; "Chat" button deep-links to chat tab        |
| `JobsList.tsx`      | Scheduled jobs (cron) with Run-now + enabled badges             |
| `JobForm.tsx`       | Create/edit a schedule (cron presets + instance picker)         |
| `RunsList.tsx`      | Recent runs; click row to open detail drawer                    |
| `RunDetail.tsx`     | Replays persisted steps + tokens + langfuse link                |
| `Drawer.tsx`        | Reusable right-side drawer                                      |

Page shell: `src/pages/Agents.tsx`. Tabs are query-param driven
(`?tab=chat&instanceId=…`) so they're shareable / deep-linkable.

## 1.6 Design system

Use the primitives; don't invent new styled-components unless the shape
doesn't exist in `src/components/ui/primitives.tsx`. CSS variables
(`--bg-*`, `--text-*`, `--accent`, `--border-*`, `--r-*`, `--s-*`) are the
source of truth for tokens — reach for them instead of hard-coding colors.

Icons always come from `src/components/ui/icons.tsx`. Add a new one by
calling `make(<jsx paths />)` in that file.

## 1.7 Environment variables

| Var                         | Where                         | What it does                               |
| --------------------------- | ----------------------------- | ------------------------------------------ |
| `VITE_API_URL`              | browser                       | Base path for Netlify functions            |
| `VITE_PIOVRA_PROXY_URL`     | browser                       | Base path for the piovra proxy (`/api/piovra`) |
| `REACT_APP_MONGODB_URI`     | Netlify functions             | MongoDB connection string                  |
| `PIOVRA_URL`                | Netlify functions             | Public HTTPS URL of the piovra service     |
| `PIOVRA_API_KEY`            | Netlify functions             | Shared secret forwarded as `X-Piovra-Key`  |

Never prefix the piovra key / URL with `VITE_`; they must stay server-side.

---

# 2. `piovra` — Agent Orchestrator

Standalone Node 22 + TypeScript Express service. Runs on a Debian VPS under
`systemd`, fronted by nginx + Let's Encrypt, with its own Postgres DB. It
knows nothing about MongoDB; it reaches back into Capsuna's serverless API
via the `capsuna.*` skills.

## 2.1 Stack

- **HTTP**: Express 5, `helmet`, `cors`, `pino-http`. All authenticated
  routes require `X-Piovra-Key`.
- **LLM**: [Vercel AI SDK](https://sdk.vercel.ai) `ai` + `@ai-sdk/openai` +
  `@ai-sdk/anthropic`. Tool-calling + streaming via `streamText`.
- **DB**: Postgres via Drizzle ORM; migrations in `src/db/migrations/*.sql`.
- **Validation**: Zod on every HTTP body + every skill's args.
- **Observability**: Pino logs → journald; Langfuse traces (one trace per
  run, span per tool call).
- **Scheduling**: `node-cron` + `cron-parser`.
- **MCP**: both a client (consumes external MCP servers from
  `mcp-servers.json`) and a server (exposes its own skills via stdio).

## 2.2 Directory map

```
piovra/
├─ src/
│  ├─ index.ts                    # boot: mcp init → scheduler.start → app.listen
│  ├─ config.ts                   # Zod-validated env loader
│  ├─ types/agent.ts              # AgentStep union + enums shared by code
│  ├─ db/
│  │  ├─ schema.ts                # Drizzle tables (definitions/instances/runs/jobs)
│  │  ├─ client.ts                # pg Pool + drizzle()
│  │  ├─ repo.ts                  # data access layer (all queries live here)
│  │  ├─ migrate.ts               # tsx runner for migrations
│  │  ├─ seed.ts                  # inserts default-assistant + default instance
│  │  └─ migrations/*.sql         # 0000_init.sql, 0001_add_scheduled_jobs.sql, …
│  ├─ http/
│  │  ├─ app.ts                   # assembles express app + routers
│  │  ├─ auth.ts                  # requireApiKey middleware
│  │  └─ routes/
│  │     ├─ health.ts             # GET /health (public)
│  │     ├─ orchestrate.ts        # POST /orchestrate (SSE, authed)
│  │     ├─ definitions.ts        # CRUD /definitions
│  │     ├─ instances.ts          # CRUD /instances
│  │     ├─ runs.ts               # GET /runs, /runs/:id
│  │     ├─ skills.ts             # GET /skills (aggregate builtin+MCP)
│  │     └─ jobs.ts               # CRUD /jobs + POST /jobs/:id/run
│  ├─ orchestrator/
│  │  ├─ runInstance.ts           # the agent loop: streamText + emit + persist
│  │  ├─ buildTools.ts            # turns Skill[] into AI SDK tool map
│  │  └─ events.ts                # StepEmitter / makeStepSink
│  ├─ skills/
│  │  ├─ context.ts               # SkillContext passed to every skill
│  │  ├─ registry.ts              # builtinSkills = { id: Skill }
│  │  └─ builtin/
│  │     ├─ echo.ts
│  │     ├─ capsuna.tasks.ts           # create a task
│  │     ├─ capsuna.tasks.list.ts      # list tasks
│  │     ├─ capsuna.meetings.ts        # create a meeting
│  │     ├─ capsuna.reminders.ts       # create a reminder
│  │     └─ web.search.ts              # Tavily
│  ├─ mcp/
│  │  ├─ client.ts                # spawns servers from mcp-servers.json
│  │  └─ server.ts                # exposes builtin skills over MCP stdio
│  ├─ mcp-stdio.ts                # alt entrypoint: piovra-as-MCP-server
│  ├─ scheduler/engine.ts         # node-cron loop + computeNextRunAt + register/deregister
│  └─ observability/
│     ├─ logger.ts                # pino base
│     └─ langfuse.ts              # trace/span wrapper w/ noop fallback
├─ mcp-servers.json               # external MCP servers (disabled by default)
├─ deploy/
│  ├─ install.sh                  # scripted VPS bootstrap
│  ├─ piovra.service              # systemd unit
│  └─ nginx.conf.snippet          # SSE-safe reverse proxy
├─ drizzle.config.ts
├─ README.md
└─ INITIAL_DEPLOY.md              # end-to-end first-time deploy walkthrough
```

## 2.3 Core concepts

- **AgentDefinition** — template: name, model (`provider:model`),
  `systemPrompt`, `skills[]` (allow-list of skill ids), `temperature`,
  `maxTokens`, `version`.
- **AgentInstance** — a deployed copy of a definition; has optional
  `configOverrides`, `schedule`, and `stats`. All chats + runs attach here.
- **AgentRun** — one execution: `input`, `status`, `steps[]` (persisted
  AgentStep union), `output`, `error`, tokens, `cost_usd`, optional
  `job_id` (if triggered by scheduler), `langfuse_trace_id`.
- **ScheduledJob** — `{instance_id, name, cron, enabled, payload, last_run_at,
  next_run_at}`. Scheduler reads these at boot and on every mutation.
- **Skill** — `{ id, description, schema (Zod), execute(args, ctx) }`.
  Registered in `src/skills/registry.ts`. The LLM sees the schema as a
  function-calling tool; the UI sees it via `GET /skills`.

## 2.4 How a run happens (detailed)

1. Client POSTs `{instanceId?, input}` to `/orchestrate`.
2. `runInstance` loads the definition + instance, opens a Langfuse trace,
   creates an `agent_runs` row (status `running`).
3. `buildTools` filters `builtinSkills` + MCP tools by the definition's
   `skills[]` allow-list, and returns an AI SDK tool map. Tool ids with
   dots are sanitized to underscores for the model; the UI keeps the
   original id.
4. `streamText` runs with `maxSteps: 10`. Each step → `onStepFinish` fires:
   - Convert tool calls / tool results / assistant text into `AgentStep`s.
   - Emit to both the SSE response and `repo.appendStep(...)`.
5. On completion: `repo.finalizeRun({status, output, tokensIn/Out})`,
   `trace.update({output})`, flush Langfuse.
6. On error: emit an `error` step, finalize with status `failed`.

If the request body omits `instanceId`, `repo.getDefaultInstance()` picks
the one seeded as `default` for `default-assistant`.

## 2.5 HTTP surface (authed except `/health`)

| Method | Path                 | Purpose                                  |
| ------ | -------------------- | ---------------------------------------- |
| GET    | `/health`            | liveness (public)                        |
| POST   | `/orchestrate`       | SSE stream of one run                    |
| GET    | `/definitions`       | list definitions                         |
| POST   | `/definitions`       | create                                   |
| PATCH  | `/definitions/:id`   | update (bumps `version`)                 |
| DELETE | `/definitions/:id`   | delete (cascades instances + runs)       |
| GET    | `/instances`         | list                                     |
| POST   | `/instances`         | create                                   |
| PATCH  | `/instances/:id`     | update                                   |
| DELETE | `/instances/:id`     | delete (cascades runs)                   |
| GET    | `/runs?instanceId=`  | list (default 100)                       |
| GET    | `/runs/:id`          | one run + persisted steps                |
| GET    | `/skills`            | builtin + MCP skill descriptors          |
| GET    | `/jobs?instanceId=`  | list schedules                           |
| POST   | `/jobs`              | create schedule (cron-validated)         |
| PATCH  | `/jobs/:id`          | update schedule                          |
| DELETE | `/jobs/:id`          | delete                                   |
| POST   | `/jobs/:id/run`      | fire now (ignores schedule)              |

## 2.6 Environment variables (on the VPS, in `/etc/piovra/env`)

See `piovra/.env.example`. The ones that actually gate behavior:

- `DATABASE_URL` — required.
- `OPENAI_API_KEY` and/or `ANTHROPIC_API_KEY` — at least one.
- `PIOVRA_API_KEY` — must match what Netlify forwards.
- `CAPSUNA_API_URL` + `CAPSUNA_API_KEY` — used by `capsuna.*` skills to
  call back into the Netlify functions.
- `TAVILY_API_KEY` — enables `web.search`; absent = skill errors cleanly.
- `LANGFUSE_*` — absent = observability falls back to a no-op client.
- `PIOVRA_MCP_SERVERS_FILE` — default `./mcp-servers.json`.

## 2.7 Adding things — copy patterns

- **New skill**: copy `src/skills/builtin/capsuna.tasks.ts`. Register in
  `src/skills/registry.ts`. Add its id to a definition's `skills[]`
  (either via the UI or by updating `seed.ts`).
- **New HTTP route**: copy `src/http/routes/skills.ts`. Mount under
  authenticated section in `src/http/app.ts`.
- **New table**: edit `src/db/schema.ts`, run `npx drizzle-kit generate`
  (produces `migrations/NNNN_*.sql`), then `npm run db:migrate`.
- **New page / Agents tab in UI**: add a new tab id to `TABS` in
  `src/pages/Agents.tsx`; a new component in `src/components/agents/`;
  wire PiovraAPI calls in `src/services/piovra.ts`.

---

# 3. Ops + local dev cheatsheet

## 3.1 Run capsuna locally

```bash
cd capsuna_work
npm install
netlify dev                 # runs vite + the functions + the piovra proxy
# browse http://localhost:8888
```

`.env` needs at minimum: `REACT_APP_MONGODB_URI`, `PIOVRA_URL`,
`PIOVRA_API_KEY` (if testing agents locally).

## 3.2 Run piovra locally

```bash
cd piovra
npm install
cp .env.example .env        # fill in DATABASE_URL + OPENAI_API_KEY + PIOVRA_API_KEY
npm run db:migrate
npm run db:seed
npm run dev                 # tsx watch src/index.ts on :3030
```

Requires a local Postgres with a `piovra` role/db.

## 3.3 Deploy piovra to VPS

See `piovra/INITIAL_DEPLOY.md`. Short version: `bash deploy/install.sh all`
on first boot, then build + `bash deploy/install.sh deploy`.

## 3.4 Deploy capsuna

Pushing to the connected branch triggers Netlify. Env vars live in
Netlify's UI; `PIOVRA_URL` + `PIOVRA_API_KEY` must be set there.

---

# 4. Conventions to respect when editing

- **TypeScript strict**: both repos typecheck with `tsc --noEmit`. Run
  this after any non-trivial change.
- **Zod at the boundary**: any new HTTP body or skill input goes through
  Zod. Never trust the wire.
- **Drizzle migrations are additive**: generate, review, commit the SQL.
  Never edit a migration that's already been applied somewhere.
- **No secrets in the browser**: if a var starts with `VITE_`, it's
  public. Anything sensitive stays Netlify-side (functions) or
  VPS-side (`/etc/piovra/env`).
- **Styled-components over inline styles**: use `primitives.tsx`. Don't
  introduce a UI library.
- **One source of truth for AgentStep**: `piovra/src/types/agent.ts` on the
  server, mirrored in `capsuna_work/src/services/piovra.ts` on the client.
  Changes must go in both places.
- **Skills declare descriptions for the LLM**: the `description` field on
  every Skill is what the model reads to decide when to call it. Write it
  like a function docstring for a junior dev.
- **Commit messages**: short, imperative. Don't commit without the user
  asking.

---

# 5. Roadmap — future work

Not started yet. Grouped by rough priority / size.

## 5.1 Agent quality

- **Model routing** — let a definition declare a cheap planner model and
  escalate to a stronger one via a dedicated skill. Today `pickModel` in
  `runInstance.ts` ignores `configOverrides.model`; that's the first thing
  to fix.
- **Per-turn memory / conversation threads** — today each `POST /orchestrate`
  is a fresh turn with no prior history. Add a `thread_id` concept and
  feed the last N `AgentStep`s back into `messages` for `streamText`.
- **Streaming deltas instead of step-finish** — currently the UI gets a
  full assistant message on each `onStepFinish`. Switch to token-level
  streaming so chat feels native. AI SDK already supports this; the SSE
  contract needs a new `token` event.
- **Confirmation gates for destructive skills** — the `SkillDescriptor`
  already carries `requiresConfirmation`. Actually honor it: pause the
  run, emit a `confirmation_needed` event, resume on user click.
- **Multi-agent delegation** — a planner agent with a `delegate_to(agent,
  input)` skill that spawns another `runInstance`.

## 5.2 Capsuna UI

- **Polling fallback for long runs** — Netlify function SSE cuts off at
  ~26s free / ~10min Pro. If the stream closes before `run.completed`,
  start polling `/runs/:id` every 2s until terminal.
- **Inline action proposals** — when the agent schedules a meeting /
  creates a task, render the resulting object as a clickable chip that
  deep-links into the matching Capsuna page.
- **Notifications** — browser notifications when a scheduled job
  completes, or when a reminder fires.
- **Search** — global cmd-K to search tasks / meetings / journals / runs.

## 5.3 Piovra platform

- **More built-in skills**:
  - `capsuna.journal.append` / `capsuna.journal.search` (Mongoose's text
    search already exists).
  - `capsuna.meetings.list` + `capsuna.reminders.list` for symmetry with
    `capsuna.tasks.list`.
  - `time.now` / `time.sleep` — trivial helpers the model asks for a lot.
  - `calendar.freeBusy` — once Google Calendar gets wired.
- **Real external MCP servers**:
  - Enable the shipped `@modelcontextprotocol/server-filesystem` (already
    in `mcp-servers.json`, flip `enabled: true`).
  - Add a Postgres MCP server (read-only) so agents can query their own
    history.
- **Cost tracking** — fill in `cost_usd` in `finalizeRun`; right now it's
  always null. Requires a small price table per model.
- **Rate limiting** — per-instance token / $/hour budgets; halt runs that
  blow through them.
- **Admin endpoints** — `/admin/queue` showing currently-running runs
  (today you have to tail logs).

## 5.4 Dev / ops

- **CI**: GitHub Actions running `tsc --noEmit` + `npm run lint` +
  `npm run build` on both repos on every PR.
- **Test harness** — currently zero tests. Add Vitest for piovra's
  `repo.ts`, `scheduler/engine.ts`, `buildTools.ts` at minimum.
- **Observability UI inside Capsuna** — small chart on the Runs page for
  tokens/day and latency; the data is already in Postgres.
- **Staging env** — second piovra instance on a different VPS or systemd
  unit for testing risky skill changes.
- **Backup** — scheduled `pg_dump` of the piovra DB; Mongo Atlas handles
  the Capsuna side.
