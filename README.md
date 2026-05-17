# Token Launch Lab

Token Launch Lab is an adversarial AI harness for crypto founders preparing a token launch.

Instead of only helping founders build launch materials, it stress-tests a launch before mainnet. The harness coordinates specialized agents across vesting risk, contract risk, compliance risk, and narrative risk, then produces an inspectable failure trail.

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
  -> Dump Scenario Agent checks vesting and unlock risk
  -> Exploit Agent reviews contract and DeFi attack patterns
  -> Compliance Agent surfaces SEC / MAS / Howey-style risk
  -> CT Adversary stress-tests the public narrative
  -> Harness writes .pod/decisions.log, audit report, artifacts, pitch, and submission copy
  -> Orchestrator logs every dispatch in .pod/decisions.log
```

## Canned Demo

The cached token launch pre-mortem demo is stored in `demos/vesting/` after `npm run demo`.

## Pitch

Read `PITCH.md`.
