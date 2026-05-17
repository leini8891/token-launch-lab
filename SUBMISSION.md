# SUBMISSION

## Project Name

Token Launch Lab

## One-Liner

An AI red team that stress-tests your token launch before mainnet does.

## Track

Harness/Skills

## Description

Token Launch Lab is a Codex-backed adversarial AI harness for crypto founders preparing a token launch. Token launches are high-pressure and hard to reverse. One bad vesting schedule, one missed protocol control, one weak investor narrative, or one regulatory blind spot can damage the launch in public. Codex runs specialized agents from `codex-goal.md`: Dump Risk, Protocol Risk, Regulatory Risk, and CT Adversary. The agents read a shared `tge-spec.md` file and write inspectable markdown memory under `outputs/`. A local Judge Agent, `src/orchestrator.js`, verifies every report for severity, confidence, evidence, why it matters, remediation, safety boundaries, and termination criteria. The final output is a Kill Report with ranked failure modes, revision status, and launch readiness score.

## Who I Want to Meet

Crypto founders, security reviewers, token launch teams, and OpenAI/Codex people interested in adversarial agent harnesses.
