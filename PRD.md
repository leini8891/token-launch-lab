# PRD: Token Launch Lab

## 1. Product Summary

**Product Name:** Token Launch Lab

**Product Type:** Adversarial AI harness for crypto founders preparing a token launch

**Demo Artifact:** Token Vesting Studio

**Track Fit:** Harness / Skills

Agent Pod is a lightweight delegation harness that turns one founder idea into a structured product delivery workflow. Instead of asking a single AI assistant to do everything, Agent Pod splits the work across specialized agents:

- **PM Agent:** turns the idea into user stories, acceptance criteria, and a test plan
- **Builder Agent:** creates runnable code and artifacts
- **Auditor Agent:** checks correctness, risk, and test coverage
- **Demo Agent:** prepares README, pitch, and submission copy

For the Ralphthon demo, Agent Pod uses **Token Vesting Studio** as the example artifact. The pod takes a crypto founder brief and produces a vesting calculator, tests, Solidity scaffold, audit report, and pitch materials.

## 2. Problem Statement

AI coding tools are powerful, but solo builders still struggle with turning an idea into a complete, reliable, and presentable product.

Common problems:

- A single AI agent often produces scattered outputs without a clear delivery structure.
- Builders get code, but not always requirements, tests, audit notes, or demo materials.
- Hackathon teams lose time switching between product thinking, coding, QA, and pitching.
- AI-generated work can be hard to inspect because the process is not logged or replayable.
- Non-engineering founders may know what they want to build, but struggle to coordinate the full workflow.

Agent Pod addresses this by making AI collaboration look more like a small product team: role-based, file-based, inspectable, and outcome-driven.

## 3. Target Users

### Primary Users

**Solo founders**

Founders who need to quickly turn a product idea into a prototype, technical artifact, and investor/customer-facing narrative.

**Hackathon builders**

Participants who need to build, validate, package, and present a project under severe time pressure.

**AI-native product builders**

Users who already work with tools like Codex, Claude, or ChatGPT and want a more structured way to delegate work to agents.

### Secondary Users

**Developer relations / community teams**

Teams teaching agentic workflows, AI coding best practices, or structured product prototyping.

**Crypto founder teams**

Teams that need repeatable workflows for tokenomics, contract scaffolds, audit preparation, and pitch materials.

## 4. Product Goals

1. Help one person coordinate multiple AI roles like a small product team.
2. Convert a one-line idea into a complete delivery package.
3. Make the agent workflow inspectable through markdown files and logs.
4. Produce artifacts that are useful for both engineering and pitching.
5. Demonstrate a Codex-style goal-driven workflow for hackathon judging.

## 5. Non-Goals

Agent Pod v1 is not intended to be:

- A fully autonomous software company
- A production-grade agent framework
- A replacement for human review
- A hosted SaaS product
- A crypto-specific product only
- A general chatbot
- A fully audited smart contract generator

Token Vesting Studio is only the demo artifact. The actual product is the agent delegation harness.

## 6. Core Product Thesis

The future solo founder will not do every job manually. She will define the finish line, delegate to specialized agents, review the evidence, and make the final call.

Agent Pod makes this workflow tangible.

## 7. User Journey

### Step 1: Founder Provides Brief

The user enters a one-line idea:

```text
Build a token vesting calculator for crypto founders with cliff and linear vesting.
```

### Step 2: PM Agent Defines Product Scope

PM Agent creates:

- user stories
- acceptance criteria
- test plan
- run plan

### Step 3: Builder Agent Creates Artifact

Builder Agent reads the PM output and generates:

- vesting calculator code
- unit tests
- Solidity scaffold
- artifact README

### Step 4: Auditor Agent Reviews Output

Auditor Agent checks:

- whether tests pass
- whether acceptance criteria are covered
- whether risks or blockers exist
- whether the artifact is safe to demo

### Step 5: Demo Agent Packages Project

Demo Agent prepares:

- root README
- 45-second pitch
- submission copy
- demo-ready narrative

### Step 6: Human Founder Reviews

The founder checks:

- `.pod/decisions.log`
- `.pod/audit-report.md`
- generated artifacts
- pitch and submission files

The founder remains the final decision-maker.

## 8. MVP Scope

### Must Have

1. CLI command to run the pod workflow
2. Shared markdown protocol under `.pod/`
3. Four agent roles: PM, Builder, Auditor, Demo
4. Generated vesting calculator artifact
5. Generated unit tests for the artifact
6. Audit report with blocker/risk/nit sections
7. Decisions log showing the workflow trail
8. README, PITCH, and SUBMISSION files
9. Cached demo replay
10. Simple local dashboard showing spec, logs, audit, and artifacts

### Should Have

1. Clear pitch script
2. Canned Token Vesting Studio demo
3. Easy fallback if live run fails
4. Inspectable file layout for judges

### Could Have

1. Real OpenAI API dispatch per agent
2. Richer dashboard interactions
3. Agent retry UI
4. More demo artifact templates
5. Video recording of a successful run

## 9. Functional Requirements

### FR-001: Initialize Pod Workspace

The system must create a `.pod/` workspace containing:

- `spec.md`
- `plan.md`
- `user-stories.md`
- `acceptance-criteria.md`
- `test-plan.md`
- `audit-report.md`
- `notes.md`
- `decisions.log`

### FR-002: Run PM Agent

The system must generate user stories, acceptance criteria, and a test plan from the original spec.

### FR-003: Run Builder Agent

The system must generate a runnable artifact under `artifacts/`.

For the demo, this includes:

- `vesting-calculator.mjs`
- `vesting-calculator.test.mjs`
- `TokenVestingScaffold.sol`
- artifact README

### FR-004: Run Auditor Agent

The system must run artifact tests and write an audit report with:

- summary
- blocker section
- risk section
- nit section
- acceptance criteria coverage

### FR-005: Run Demo Agent

The system must write:

- `README.md`
- `PITCH.md`
- `SUBMISSION.md`

### FR-006: Log Decisions

Every major agent action must be recorded in `.pod/decisions.log`.

### FR-007: Replay Cached Demo

The system must restore a known-good demo from `demos/vesting/`.

### FR-008: Display Dashboard

The system must provide a local dashboard that shows:

- current spec
- audit report
- decisions log
- notes
- artifact list

## 10. Non-Functional Requirements

### Reliability

The demo must run locally without cloud dependencies during judging.

### Inspectability

All important agent outputs must exist as files that a judge can open and inspect.

### Speed

The demo run should complete in under one minute for the canned example.

### Simplicity

The MVP should avoid databases, authentication, deployment, and complex infrastructure.

### Portability

The project should run on a standard local Node.js environment.

## 11. Acceptance Criteria

The MVP is complete when:

1. `npm run build` passes.
2. `npm run demo` completes the PM → Builder → Auditor → Demo workflow.
3. `.pod/decisions.log` contains a readable workflow trail.
4. `artifacts/vesting-calculator.test.mjs` passes with Node's test runner.
5. `.pod/audit-report.md` shows no blockers for the demo.
6. `README.md`, `PITCH.md`, and `SUBMISSION.md` exist.
7. `node ./dist/index.js replay` restores the cached demo.
8. `node ./dist/index.js dashboard -p 3000` starts a local dashboard.

## 12. Success Metrics

### Demo Success

- Judge understands the product in under 60 seconds.
- The pod run produces visible artifacts.
- Tests pass during or before the demo.
- The decisions log proves the workflow happened.

### Product Success

- A solo builder can go from one idea to structured delivery package faster than using one generic AI chat.
- Outputs are more complete than code-only generation.
- The workflow is understandable to both technical and non-technical audiences.

### Hackathon Success

- The project clearly fits Harness/Skills Track.
- It demonstrates agent orchestration, not just app generation.
- It provides a credible path from demo to real product.

## 13. Risks and Mitigations

### Risk: The project looks like a simple script, not a real agent system.

**Mitigation:** Emphasize the protocol: role-based agents, markdown wire format, audit trail, acceptance criteria, and replayable artifacts.

### Risk: The Token Vesting artifact looks too small.

**Mitigation:** Explain that Token Vesting Studio is the demo artifact. Agent Pod is the actual product.

### Risk: Live run fails.

**Mitigation:** Use `node ./dist/index.js replay` to restore the cached successful run.

### Risk: Judges expect real model calls.

**Mitigation:** Position v1 as the harness layer. Real OpenAI API dispatch is the next step; the demo proves the workflow contract and file protocol.

### Risk: Dashboard is too simple.

**Mitigation:** Treat dashboard as an inspection surface, not the product itself.

## 14. Demo Narrative

The demo should be framed as:

> I am not building just another token vesting calculator. I am building Agent Pod, a delegation harness for solo founders. Token Vesting Studio is the artifact produced by the pod today.

Recommended demo sequence:

1. Show `pod-spec.md` to explain the agent protocol.
2. Run `npm run demo`.
3. Show `.pod/decisions.log`.
4. Show generated acceptance criteria.
5. Show generated artifact and tests.
6. Run `npm run test:artifact`.
7. Show audit report.
8. Show PITCH / SUBMISSION.
9. Open dashboard if time allows.

## 15. Future Roadmap

### V1.1

- Use real OpenAI API calls for each agent role
- Add configurable model selection in config
- Improve dashboard with live run status
- Add artifact templates beyond Token Vesting Studio

### V1.2

- Add human approval gates between agents
- Add retry policies per agent
- Add project memory and versioned runs
- Add exportable run reports

### V2

- Hosted workspace
- Agent marketplace / skill library
- GitHub integration
- Multi-project founder dashboard
- Team collaboration mode

## 16. Open Questions

1. Should Agent Pod focus first on hackathon builders, solo founders, or crypto founders?
2. Should the next version prioritize real model dispatch or dashboard polish?
3. Should generated artifacts be limited to code, or include business materials like GTM plans and investor memos?
4. What level of human approval should exist between agents?
5. Should the pod optimize for speed, auditability, or artifact quality first?

## 17. One-Sentence Pitch

Agent Pod is a delegation harness that lets one founder coordinate PM, Builder, Auditor, and Demo agents to turn one idea into a tested, audited, and pitch-ready product artifact.
