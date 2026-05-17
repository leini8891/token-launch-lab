# Goal For Codex

Canonical live-demo goal:

```text
codex-goal.md
```

For Harness Track judging, open `codex-goal.md` first. It contains the exact `/goal` prompt that instructs Codex to:

- read `AGENTS.md`
- read `tge-spec.md`
- create or revise the four per-agent markdown reports under `outputs/`
- run `node src/orchestrator.js`
- revise failed reports until the Judge Agent verifies all reports
- terminate only after `outputs/kill-report.md`, `outputs/remediation.md`, and `outputs/judge-evaluation.md` are generated

Quick run:

```bash
node src/orchestrator.js
```
