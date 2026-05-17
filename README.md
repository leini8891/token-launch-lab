# Token Launch Lab

Token Launch Lab is an adversarial AI harness for crypto founders preparing a token launch.

Instead of only helping founders build launch materials, it stress-tests a launch before mainnet. The harness coordinates specialized agents across vesting risk, contract risk, compliance risk, and narrative risk, then produces an inspectable failure trail.

## 60-Second Quickstart

```bash
npm install
npm run redteam
```

This reads `tge-spec.md`, runs the adversarial agent harness, prints a demo Kill Report, and writes inspectable output files:

- `redteam-findings.md`
- `kill-report.md`
- `remediation.md`
- `judge-evaluation.md`

## Architecture

```
node src/orchestrator.js
  -> reads tge-spec.md
  -> Dump Risk Agent reviews vesting and unlock pressure
  -> Protocol Risk Agent reviews defensive protocol readiness
  -> Regulatory Risk Agent flags distribution and compliance-review risk
  -> CT Adversary Agent attacks public narrative and launch optics
  -> Orchestrator / Judge Agent ranks findings and computes launch readiness
  -> writes redteam-findings.md, kill-report.md, remediation.md, judge-evaluation.md
```

## Scoring

- Severity: `low` / `medium` / `high` / `critical`
- Confidence: `low` / `medium` / `high`
- Evidence: every finding cites `tge-spec.md`
- Remediation priority: `P0` / `P1`
- Launch readiness score: `0-100`

## Safety Boundaries

This is defensive launch-risk review only. It does not generate exploit instructions and does not provide legal advice.

## Legacy Canned Demo

The older vesting artifact demo is still available:

```bash
npm run build
npm run demo
npm run test:artifact
node ./dist/index.js dashboard -p 3000
```

## Pitch

Read `PITCH.md`.
