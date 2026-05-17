# Agent Pod Harness

Agent Pod is a mini AI product team for solo founders. It turns one founder brief into PM output, builder artifacts, audit review, and demo packaging.

## 60-Second Quickstart

```bash
npm install
npm run build
npm run demo
node --test artifacts/vesting-calculator.test.mjs
```

## Architecture

```
pod run "spec"
  -> PM-Agent writes .pod/user-stories.md, acceptance-criteria.md, test-plan.md
  -> Builder-Agent writes artifacts/
  -> Auditor-Agent writes .pod/audit-report.md
  -> Demo-Agent writes README.md, PITCH.md, SUBMISSION.md
  -> Orchestrator logs every dispatch in .pod/decisions.log
```

## Canned Demo

The cached vesting demo is stored in `demos/vesting/` after `npm run demo`.

## Pitch

Read `PITCH.md`.
