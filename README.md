# Token Launch Lab

Token Launch Lab is an adversarial AI harness for crypto founders preparing a token launch.

Instead of only helping founders build launch materials, it stress-tests a launch before mainnet. The harness coordinates specialized Codex agent roles across dump risk, protocol risk, regulatory risk, and narrative risk, then verifies their markdown reports with a local Judge Agent.

## Harness Track Proof

- **Codex integration:** `codex-goal.md` is the exact `/goal` prompt used to run Codex.
- **Multi-agent orchestration:** `AGENTS.md` defines Dump Risk, Protocol Risk, Regulatory Risk, CT Adversary, and Judge agents.
- **Inspectable markdown memory:** Codex writes agent reports under `outputs/`.
- **Verification:** `src/orchestrator.js` checks required fields, evidence, severity, confidence, and safety boundaries.
- **Termination:** the run stops only when all reports pass verification.
- **Recovery loop:** failed reports are revised individually and re-checked.

## 60-Second Quickstart

```bash
npm install
node src/orchestrator.js
npm run ui
```

This reads the Codex-authored agent reports in `outputs/`, verifies them, prints pass/revision status, computes launch readiness, and writes:

- `outputs/kill-report.md`
- `outputs/remediation.md`
- `outputs/judge-evaluation.md`

The demo UI runs at:

```text
http://127.0.0.1:3000
```

## Architecture

```
Codex /goal
  -> reads codex-goal.md, AGENTS.md, tge-spec.md
  -> writes outputs/dump-risk.md
  -> writes outputs/protocol-risk.md
  -> writes outputs/regulatory-risk.md
  -> writes outputs/ct-adversary.md
  -> Judge Agent runs node src/orchestrator.js
  -> verifier writes outputs/kill-report.md, outputs/remediation.md, outputs/judge-evaluation.md
```

## Scoring

- Severity: `low` / `medium` / `high` / `critical`
- Confidence: `low` / `medium` / `high`
- Evidence: every finding cites `tge-spec.md`
- Remediation priority: `P0` / `P1`
- Launch readiness score: `0-100`

## Live Demo Flow

1. Open `http://127.0.0.1:3000`.
2. Show the HarborUSD Kill Report and launch readiness score.
3. Click **Run Judge Verification** to run `node src/orchestrator.js` from the UI.
4. Show `codex-goal.md`, `AGENTS.md`, and `tge-spec.md` inside the UI evidence panels.
5. Open `outputs/kill-report.md` if judges ask to inspect the raw markdown.

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

## Contributors

- ElenaX <leini8891@qq.com>
