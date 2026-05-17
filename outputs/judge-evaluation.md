# Judge Evaluation

## Harness / Skills Track Fit

Token Launch Lab is a Codex-backed adversarial agent harness. Codex is given `codex-goal.md` as the /goal prompt, reads `AGENTS.md`, writes per-agent markdown memory under `outputs/`, and then the local Judge Agent verifies the outputs.

## Codex Integration

- Codex goal prompt: `codex-goal.md`
- Agent operating rules: `AGENTS.md`
- Shared launch spec: `tge-spec.md`
- Inspectable markdown memory: `outputs/*.md`
- Verification script: `src/orchestrator.js`

## Multi-Agent Reports

- Dump Risk Agent: PASS (outputs/dump-risk.md)
- Protocol Risk Agent: PASS (outputs/protocol-risk.md)
- Regulatory Risk Agent: PASS (outputs/regulatory-risk.md)
- CT Adversary Agent: PASS (outputs/ct-adversary.md)

## Verification

- Valid findings: 8
- Reports needing revision: 0
- Final launch readiness score: 24/100
- Recommendation: NO-GO

## Termination Criteria

The run terminates when all agent reports pass schema and safety verification. If any report fails, the orchestrator prints missing fields and the revision loop sends only failed files back to Codex for repair.

## Safety Policy

Defensive review only. No exploit instructions. No legal advice.
