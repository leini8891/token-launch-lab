# pod-spec.md — Token Launch Lab Harness Protocol (v2)

This file is the contract every adversarial sub-agent must honor. It IS the harness — Harness/Skills Track judges can read this file to evaluate delegation craft, safety boundaries, scoring, and output contracts.

## Shared State Layout

The primary red-team run operates inside a single working directory with this layout:

```
tge-spec.md             # shared input file
redteam-findings.md     # all agent findings
kill-report.md          # ranked failure modes and launch readiness
remediation.md          # prioritized fix plan
judge-evaluation.md     # harness explanation and score
```

The legacy `.pod/` and `artifacts/` folders remain as supporting evidence for the older vesting artifact demo, but the Harness Track demo should start with `node src/orchestrator.js`.

## Agent Roles

### Dump Risk Agent

Reviews vesting, unlock pressure, liquidity optics, and insider-dump scenarios.

### Protocol Risk Agent

Reviews defensive protocol readiness: pause policy, audit timing, multisig controls, and production readiness. It must not generate exploit instructions.

### Regulatory Risk Agent

Surfaces regulatory and compliance-review risk flags. It must not provide legal advice.

### CT Adversary Agent

Stress-tests public narrative, launch optics, and likely crypto Twitter attack angles.

### Orchestrator / Judge Agent

Runs all agents, normalizes findings, ranks severity, writes the output files, and computes launch readiness.

## Finding Schema

Every finding must include:

```markdown
- Agent
- Severity: low | medium | high | critical
- Confidence: low | medium | high
- Evidence from TGE spec
- Risk
- Remediation priority
- Recommended remediation
```

## Scoring

- Severity: `low`, `medium`, `high`, `critical`
- Confidence: `low`, `medium`, `high`
- Remediation priority: `P0` or `P1`
- Launch readiness score starts at `100` and subtracts severity-weighted penalties.
- Any critical finding forces a `NO-GO` recommendation.

## Orchestrator Behavior

1. Read `tge-spec.md`.
2. Run Dump Risk Agent, Protocol Risk Agent, Regulatory Risk Agent, and CT Adversary Agent.
3. Normalize every finding to the schema above.
4. Rank by severity and confidence.
5. Compute launch readiness score.
6. Write `redteam-findings.md`, `kill-report.md`, `remediation.md`, and `judge-evaluation.md`.
7. Print a concise demo Kill Report to stdout.

## Safety Boundaries

- Defensive review only.
- No exploit instructions.
- No legal advice.
- Regulatory output is a review flag, not a conclusion.
- Protocol risk output identifies missing controls, not attack steps.

## Versioning

This spec is v2. The older v1 PM/Builder/Auditor/Demo flow remains in the repo as supporting evidence, but Harness evaluation should focus on the adversarial v2 orchestrator.

The skills mechanism itself is the differentiator. It directly hits "skills" in Harness/Skills Track.

## Versioning

This spec is v1. Breaking changes require:
- bumping the version number at the top of this file
- entry in `decisions.log`
- entry in `notes.md`
