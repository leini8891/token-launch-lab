# AGENTS.md — Token Launch Lab Harness Rules

## What This Is

Token Launch Lab is a **Codex-backed adversarial multi-agent harness** for crypto token launch pre-mortems.

This is not a chatbot and not a static report generator. The deliverable is the harness:

- a Codex `/goal` prompt
- clearly separated adversarial agent roles
- a shared markdown input file
- inspectable markdown memory under `outputs/`
- a local Judge Agent / Orchestrator that verifies reports
- termination criteria and a recovery / revision loop

## Codex Integration

The Codex entrypoint is:

```text
codex-goal.md
```

In the live demo, show the judge:

1. `codex-goal.md` — the exact `/goal` prompt
2. `AGENTS.md` — the agent role contracts
3. `tge-spec.md` — the shared input
4. `outputs/*.md` — inspectable agent memory
5. `src/orchestrator.js` — the Judge Agent verifier
6. `outputs/kill-report.md` — the final scored output

## Shared Input

All agents read:

```text
tge-spec.md
```

Agents must quote evidence from this file. The Judge Agent rejects findings whose evidence is not traceable to `tge-spec.md`.

## Agent Roles

### Dump Risk Agent

Reviews:

- investor and team unlocks
- TGE float
- liquidity and market-maker allocation
- dump pressure and launch optics

Writes:

```text
outputs/dump-risk.md
```

### Protocol Risk Agent

Reviews:

- defensive protocol readiness
- audit status
- pause policy
- multisig and incident response assumptions

Writes:

```text
outputs/protocol-risk.md
```

Safety boundary: identify missing controls only. Do not generate exploit instructions.

### Regulatory Risk Agent

Reviews:

- public sale risk flags
- jurisdiction and distribution ambiguity
- incentive campaign risk
- communication and eligibility concerns

Writes:

```text
outputs/regulatory-risk.md
```

Safety boundary: this is not legal advice. Frame output as risk flags for qualified review.

### CT Adversary Agent

Reviews:

- public narrative fragility
- likely crypto Twitter criticism
- token necessity
- incentive and farming optics

Writes:

```text
outputs/ct-adversary.md
```

Safety boundary: stress-test narrative without harassment, misinformation, or market manipulation.

### Judge Agent / Orchestrator

Implemented in:

```text
src/orchestrator.js
```

It reads the four agent reports, verifies schema and safety boundaries, computes launch readiness, and writes:

```text
outputs/kill-report.md
outputs/remediation.md
outputs/judge-evaluation.md
```

## Required Finding Schema

Every finding in every agent report must include:

```markdown
## Finding <ID>

- Specific risk: <one concrete risk>
- Severity: low | medium | high | critical
- Confidence: low | medium | high
- Evidence from tge-spec.md: <exact quote from tge-spec.md>
- Why it matters: <business / launch impact>
- Remediation: <defensive fix>
- Remediation priority: <P0 / P1 / P2 and timing>
```

## Verification

Run:

```bash
node src/orchestrator.js
```

The script prints:

- which agent reports passed
- which reports need revision
- missing fields
- final launch readiness score

## Termination Criteria

The run is complete only when:

- all four agent reports exist
- every finding has all required fields
- severity and confidence values are valid
- evidence is traceable to `tge-spec.md`
- no safety boundary violations are detected
- `outputs/kill-report.md`, `outputs/remediation.md`, and `outputs/judge-evaluation.md` are generated

## Recovery / Revision Loop

If the orchestrator reports a failed file:

1. Codex revises only that failed `outputs/*.md` file.
2. Codex preserves passing files.
3. Codex re-runs `node src/orchestrator.js`.
4. The loop stops when all reports pass.

## Safety Rules

- Defensive review only.
- Do not generate exploit instructions.
- Do not provide legal advice.
- Do not produce harassment or market manipulation content.
- Do not hide findings in non-inspectable state; write them to markdown.
