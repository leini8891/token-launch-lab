# Agent Pod — Plan

## Vision

Agent Pod is the smallest possible multi-agent dev team in a box.

You give it a one-line spec. It delegates across four specialized sub-agents (PM, Builder, Auditor, Demo) who collaborate via shared markdown files and produce working code, tests, an audit report, and a demo script.

This is the architecture for low-cost AI-native startups: one human director, an army of agents.

## Why This Exists

Today's AI coding tools treat the agent as a single contractor. But real product work requires roles: someone who clarifies the spec, someone who builds, someone who reviews, someone who packages and tells the story.

Agent Pod proves you can split these roles across agents and orchestrate them with a tiny harness. This is the Harness/Skills Track entry: a delegation framework, not a chatbot.

## Demo Promise

At 7PM I will:

1. Type a one-line spec into Pod CLI (e.g., "build a token vesting calculator CLI in TypeScript with tests for cliff and linear vesting").
2. Pod parses, plans, delegates.
3. PM-Agent expands the spec → produces user-stories.md + acceptance-criteria.md + test-plan.md.
4. Builder-Agent implements the code under `artifacts/`.
5. Auditor-Agent reviews for correctness, edge cases, security → audit-report.md.
6. Orchestrator retries Builder once if any BLOCKER.
7. Demo-Agent produces README.md + 45-second pitch.
8. The audience sees a working artifact built live by four delegated agents.

## Milestones

### M1 — Pod Skeleton (target 11:45)

- repo bootstrapped (Node + TypeScript)
- `pod` CLI entrypoint via `commander`
- shared-state directory layout (`.pod/`, `artifacts/`)
- minimal config: OpenAI API key via env (`OPENAI_API_KEY`)
- empty agent stubs callable individually

Done when:
- `pod init <spec-string>` creates `.pod/spec.md` and directory layout.
- `pod agent <name>` invokes the named agent stub.
- `pod run "<spec>"` runs the full sequence with stub outputs.

### M2 — Four Agent Personas (target 1PM)

Implement each agent as a system prompt + a thin TypeScript wrapper that calls the OpenAI API and writes outputs to the agreed files.

- **PM-Agent**: spec.md → user-stories.md, acceptance-criteria.md, test-plan.md
- **Builder-Agent**: acceptance-criteria.md + test-plan.md → files under `artifacts/`
- **Auditor-Agent**: artifacts/ + acceptance-criteria.md → audit-report.md
- **Demo-Agent**: everything → README.md, PITCH.md

Done when:
- Each agent can be called individually via `pod agent <name>`.
- Each reads from and writes to the exact files defined in pod-spec.md.
- End-to-end sequence runs without manual edits.

### M3 — Orchestrator (target 2:30PM)

- `pod run "<spec>"` triggers PM → Builder → Auditor → (retry Builder if BLOCKER) → Demo.
- After each step, write start/end entries to `decisions.log`.
- One retry max on Builder if Auditor flags BLOCKER.
- Console progress with timestamps and color (chalk).

Done when:
- A spec produces a populated `artifacts/` directory with code + audit + README.
- `decisions.log` shows a readable trail.
- One full end-to-end run completes in under 5 minutes on the demo spec.

### M4 — Live Dashboard (target 3:30PM)

Minimal Next.js dashboard at `pod dashboard`:

- left pane: current spec + plan.md
- center pane: live tail of notes.md + decisions.log (via chokidar)
- right pane: artifacts list, click to view
- header: which agent is active, elapsed time

Done when:
- `pod dashboard` opens browser to localhost:3000.
- A live pod run streams updates to the dashboard.
- Final artifacts are clickable and rendered as plain text or markdown.

### M5 — Demo Case (target 4:30PM)

- Canned demo spec: "build a token vesting calculator CLI in TypeScript with tests for cliff and linear vesting"
- Pre-run once to confirm output is impressive
- Record a backup video of the same run in case live API is slow
- Stash the cached run under `demos/vesting/` so we can replay without API calls if needed

Done when:
- The canned demo runs end-to-end in under 4 minutes.
- Output code passes its own tests.
- Backup video exists.

### M6 — Final Polish (target 5PM)

- Repo `README.md` with: what, why, how to run, architecture diagram (ASCII).
- `PITCH.md` — 45-second pitch script.
- Submission text drafted in `SUBMISSION.md`.

Done when:
- Repo is push-ready.
- Pitch rehearsed once aloud.
- Submission filed by 5PM.

## Architecture (ASCII)

```
                 ┌─────────────────┐
                 │  pod run "X"    │
                 └────────┬────────┘
                          │
                  ┌───────▼────────┐
                  │  Orchestrator  │
                  └───────┬────────┘
                          │
        ┌─────────────────┼─────────────────┬─────────────────┐
        │                 │                 │                 │
   ┌────▼────┐      ┌─────▼────┐     ┌─────▼─────┐    ┌─────▼─────┐
   │   PM    │ ───► │ Builder  │ ──► │ Auditor   │ ─► │   Demo    │
   └────┬────┘      └─────┬────┘     └─────┬─────┘    └─────┬─────┘
        │                 │                │                │
        ▼                 ▼                ▼                ▼
  user-stories.md     /artifacts/    audit-report.md    README.md
  acceptance.md       (code+tests)                      PITCH.md
  test-plan.md
                          ▲
                          │
                  shared-state files
                (plan, notes, decisions.log)
```

## Out of Scope (explicit)

- multi-language support beyond TypeScript for v1
- authentication, user accounts
- persisted history beyond current run
- agent-to-agent direct messaging (all communication via shared files)
- model selection UI (hardcoded to one model)
- payment, deployment, hosting

## Risks & Mitigations

- **Risk**: Agents emit inconsistent markdown that breaks downstream parsing.
  - Mitigation: pod-spec.md fixes the format; parsers tolerate extra whitespace; system prompts include the format verbatim.
- **Risk**: Live demo fails due to API latency.
  - Mitigation: pre-recorded backup video + cached run under `demos/vesting/` replayable without API calls.
- **Risk**: Builder produces broken code.
  - Mitigation: Auditor BLOCKER → one Builder retry. Hard cap.
- **Risk**: Overbuild and miss 5PM submission.
  - Mitigation: M5 must be done before M4 polish. Working canned demo beats half-done dashboard.

## Update Log

This file may be updated mid-run by the orchestrator or by a sub-session. If a milestone changes, check `decisions.log` for the rationale entry.
