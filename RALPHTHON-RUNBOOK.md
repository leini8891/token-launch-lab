# Ralphthon Runbook

## Keep Both Projects

- Static visual demo: `/Users/elena/Code/Crypto × Agent Pod/index.html`
- Real harness project: `/Users/elena/Code/Crypto × Agent Pod/agent-pod-harness`

Use the real harness as the main story. Use the static visual demo if the live CLI/dashboard feels too dry on stage.

## Before 1PM

```bash
cd "/Users/elena/Code/Crypto × Agent Pod/agent-pod-harness"
npm install
npm run build
npm run demo
npm run test:artifact
```

Confirm these files exist:

- `.pod/decisions.log`
- `.pod/audit-report.md`
- `artifacts/vesting-calculator.mjs`
- `artifacts/vesting-calculator.test.mjs`
- `PITCH.md`
- `SUBMISSION.md`
- `demos/vesting/`

## 1PM Auto-Run Option

If the rule is to let Codex run while laptops are closed, open Codex in this folder and paste the goal from `GOAL-FOR-CODEX.md`.

Minimum fallback if `/goal` is unavailable:

```bash
npm run demo
```

This produces a complete run trail in `.pod/decisions.log`.

## Demo Commands

```bash
cd "/Users/elena/Code/Crypto × Agent Pod/agent-pod-harness"
npm run demo
npm run test:artifact
node ./dist/index.js dashboard -p 3000
```

If the live run fails:

```bash
node ./dist/index.js replay
node ./dist/index.js dashboard -p 3000
```

## What To Say

Agent Pod is a delegation harness, not a chatbot. It uses markdown as the wire format between PM, Builder, Auditor, and Demo agents. For today's demo, the pod builds a Token Vesting artifact for crypto founders, including acceptance criteria, runnable code, tests, a Solidity scaffold, audit report, and pitch.
