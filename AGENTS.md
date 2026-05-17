# AGENTS.md — Rules for Codex Building Token Launch Lab

## What You Are Building

You are building "Token Launch Lab" — an adversarial multi-agent harness for crypto token launch pre-mortems. It is the entry for the Harness/Skills Track at Ralphthon @SG.

This is NOT a chatbot and not a generic report generator. The deliverable is the orchestrator + adversarial agent personas + shared input contract + inspectable output files + scoring / judge logic.

## Current Harness Entry

The primary Harness demo is:

```bash
node src/orchestrator.js
```

It reads `tge-spec.md` and writes:

- `redteam-findings.md`
- `kill-report.md`
- `remediation.md`
- `judge-evaluation.md`

## Agent Roles

- Dump Risk Agent
- Protocol Risk Agent
- Regulatory Risk Agent
- CT Adversary Agent
- Orchestrator / Judge Agent

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
Sub-agents communicate through files on disk, not hidden chat state. This makes the harness inspectable, replayable, and credible as real delegation.

### One retry max
If an upstream artifact fails downstream validation, dispatch back to the upstream agent ONCE with the failure context. Never loop. Never escalate to a third retry. Surface the failure and continue.

### Fail loud, log everything
Every agent dispatch writes a `decisions.log` entry: `[timestamp] [agent] [action] [outcome] [note]`. Crashes write a stack trace. Silent failures are forbidden.

### Deterministic file layout
Filenames, directory layout, and file schemas in `pod-spec.md` are immutable for v1. Do not let agents invent new filenames.

### Safety boundaries
This project is defensive risk review only. Do not generate exploit instructions. Do not provide legal advice. Regulatory output must be framed as "risk flags for qualified review."

## Tech Stack (fixed)

- Node 20+
- Single package, no monorepo
- Plain Node.js orchestrator for the adversarial Harness demo
- TypeScript CLI remains for the legacy vesting/dashboard demo
- No LangChain, LlamaIndex, AutoGen, CrewAI, or other agent framework. The harness IS the thing.

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

- `node src/orchestrator.js` runs
- `tge-spec.md` exists as shared input
- `redteam-findings.md`, `kill-report.md`, `remediation.md`, and `judge-evaluation.md` are generated
- Every finding includes severity, confidence, evidence from the TGE spec, and remediation priority
- `judge-evaluation.md` includes launch readiness score and Harness track explanation
- Legacy `pod run "<spec>"` and dashboard remain available as supporting evidence
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
