# AGENTS.md — Rules for Codex Building Agent Pod

## What You Are Building

You are building "Agent Pod" — a multi-agent dev team in a box. It is the entry for the Harness/Skills Track at Ralphthon @SG.

This is NOT a chatbot. This is a delegation harness. The deliverable is the orchestrator + four agent personas + shared-state protocol + a live dashboard.

## Read Order (Every Session)

Before any change, read in this order:

1. `plan.md` — milestones and definition of done
2. `pod-spec.md` — the immutable protocol that sub-agents must follow
3. `notes.md` — running log of decisions, blockers, and changes
4. `decisions.log` — chronological structured record of agent dispatches

After any meaningful change, append to `notes.md` with `[ISO-8601 timestamp] one-line rationale`.

## Working Principles

### Demo over engineering
This is a 6-hour hackathon project. If a feature does not contribute to the 7PM live demo, do not build it. Cut, do not extend.

### Markdown is the wire format
Sub-agents communicate via files on disk, not in-process function calls. This makes the pod inspectable, replay-able, and credible as real delegation. Do not introduce direct agent-to-agent calls or shared in-memory state.

### One retry max
If an upstream artifact fails downstream validation, dispatch back to the upstream agent ONCE with the failure context. Never loop. Never escalate to a third retry. Surface the failure and continue.

### Fail loud, log everything
Every agent dispatch writes a `decisions.log` entry: `[timestamp] [agent] [action] [outcome] [note]`. Crashes write a stack trace. Silent failures are forbidden.

### Deterministic file layout
Filenames, directory layout, and file schemas in `pod-spec.md` are immutable for v1. Do not let agents invent new filenames.

### Strict TypeScript
`strict: true` in tsconfig. No `any`. No `// @ts-ignore`. If types fight you, fix the design, not the type.

## Tech Stack (fixed)

- Node 20+
- TypeScript with strict mode
- Single package, no monorepo
- `commander` for CLI
- `chalk` for colored console output
- `chokidar` for file watching (dashboard)
- `next` (App Router) for the dashboard
- OpenAI Node SDK directly. **No LangChain. No agent frameworks.** The harness IS the thing — using a framework would defeat the entry.

Each agent's system prompt lives in its own file under `src/agents/<name>/system-prompt.md`. Skills live in `src/agents/<name>/skills/*.md` and are appended to the system prompt at load time.

## Forbidden

- Adding a database
- Adding authentication
- Adding a payment flow
- Adding model selection UI (one model hardcoded for v1)
- Refactoring "for clarity" if it costs more than 10 minutes
- Adding tests for the pod itself (artifact code gets tested by Builder; pod doesn't need tests for the demo)
- Using LangChain, LlamaIndex, AutoGen, CrewAI, or any agent framework

## Required at Stop Time (5PM submission)

- `pod init "<spec>"` works
- `pod run "<spec>"` produces `artifacts/` with code + tests, plus `audit-report.md`, `README.md`, `PITCH.md`
- `pod dashboard` opens a working dashboard at localhost:3000
- One pre-run canned demo exists under `demos/vesting/`
- Root `README.md` explains how to run the canned demo in under 60 seconds
- `PITCH.md` exists with the 45-second pitch
- `SUBMISSION.md` exists with the text to paste into the Ralphthon submission form

## Decision-Making Default

When unsure, default to: **keep it simple, make it demo**.
- If a change makes the demo more vivid: do it.
- If it makes the code "cleaner" but invisible to the audience: skip it.
- If it adds infrastructure but doesn't change what the audience sees: skip it.

## Update Discipline

If you change `plan.md`:
- Log the change in `decisions.log` with rationale.
- If a milestone slips, mark it slipped. Do not silently re-order.

If `pod-spec.md` needs a change:
- Stop. Surface the question. This file is the harness contract — changing it mid-run breaks the demo narrative.
