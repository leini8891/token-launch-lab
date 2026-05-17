# pod-spec.md — Token Launch Lab Harness Protocol (v2)

This file is the contract every adversarial sub-agent must honor. It is part of the Harness / Skills Track deliverable: judges can read it to evaluate delegation craft, Codex integration, safety boundaries, scoring, verification, and recovery.

## Shared State Layout

```text
codex-goal.md                 # exact /goal prompt for Codex
AGENTS.md                     # agent contracts and safety rules
tge-spec.md                   # shared fictional launch input
outputs/dump-risk.md          # Dump Risk Agent memory
outputs/protocol-risk.md      # Protocol Risk Agent memory
outputs/regulatory-risk.md    # Regulatory Risk Agent memory
outputs/ct-adversary.md       # CT Adversary Agent memory
outputs/kill-report.md        # Judge Agent final report
outputs/remediation.md        # prioritized recovery plan
outputs/judge-evaluation.md   # Harness Track evaluation evidence
src/orchestrator.js           # local Judge Agent / verifier
```

The legacy `.pod/` and `artifacts/` folders remain as supporting evidence for the older vesting artifact demo, but the Harness Track demo should start with `codex-goal.md` and `node src/orchestrator.js`.

## Agent Roles

### Dump Risk Agent

Reviews vesting, unlock pressure, liquidity optics, and insider-dump scenarios.

### Protocol Risk Agent

Reviews defensive protocol readiness: pause policy, audit timing, multisig controls, and production readiness. It must not generate exploit instructions.

### Regulatory Risk Agent

Surfaces regulatory and compliance-review risk flags. It must not provide legal advice.

### CT Adversary Agent

Stress-tests public narrative, launch optics, and likely crypto Twitter attack angles without harassment, misinformation, or market manipulation.

### Orchestrator / Judge Agent

Implemented in `src/orchestrator.js`. It reads the four agent reports, verifies schema and safety boundaries, computes launch readiness, prints pass/revision status, and writes the final output files.

## Required Finding Schema

Every finding must include:

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

## Scoring

- Severity: `low`, `medium`, `high`, `critical`
- Confidence: `low`, `medium`, `high`
- Launch readiness score starts at `100` and subtracts severity-weighted penalties.
- Any critical finding forces a `NO-GO` recommendation.

## Orchestrator Behavior

1. Read `tge-spec.md`.
2. Read the four agent reports under `outputs/`.
3. Verify every finding has required fields.
4. Verify severity and confidence values are valid.
5. Verify evidence is traceable to `tge-spec.md`.
6. Check safety boundaries.
7. Print which reports passed and which need revision.
8. If all pass, write `outputs/kill-report.md`, `outputs/remediation.md`, and `outputs/judge-evaluation.md`.
9. If any fail, print missing fields and terminate with a non-zero exit code so Codex can revise only failed files.

## Recovery / Revision Loop

1. Codex runs `node src/orchestrator.js`.
2. The orchestrator prints failed reports and missing fields.
3. Codex revises only failed `outputs/*.md` files.
4. Codex re-runs `node src/orchestrator.js`.
5. The loop terminates when all reports pass.

## Safety Boundaries

- Defensive review only.
- No exploit instructions.
- No legal advice.
- Regulatory output is a review flag, not a conclusion.
- Protocol risk output identifies missing controls, not attack steps.

## Versioning

This spec is v2. The older v1 PM/Builder/Auditor/Demo flow remains in the repo only as supporting evidence. Harness evaluation should focus on the adversarial v2 Codex + markdown + verifier loop.
