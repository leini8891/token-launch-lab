# Judge Evaluation

## Harness / Skills Track Fit

Token Launch Lab is an adversarial multi-agent harness. The harness itself is the deliverable: it defines agent roles, shared input, inspectable outputs, scoring, termination, and safety boundaries.

## Agent Roles

- Dump Risk Agent
- Protocol Risk Agent
- Regulatory Risk Agent
- CT Adversary Agent
- Orchestrator / Judge Agent

## Shared Input

- `tge-spec.md`

## Inspectable Outputs

- `redteam-findings.md`
- `kill-report.md`
- `remediation.md`
- `judge-evaluation.md`

## Scoring System

- Severity: low / medium / high / critical
- Confidence: low / medium / high
- Evidence from TGE spec: required for every finding
- Remediation priority: P0 / P1
- Launch readiness score: 24/100
- Launch recommendation: NO-GO

## Safety Policy

This is defensive risk review only. It does not generate exploit instructions and does not provide legal advice.
