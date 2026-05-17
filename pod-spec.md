# pod-spec.md — Sub-Agent Protocol (v1, immutable)

This file is the contract every Pod sub-agent must honor. It IS the harness — Harness/Skills Track judges read this file to evaluate delegation craft and skills design.

## Shared State Layout

Every pod run operates inside a single working directory with this layout:

```
.pod/
  spec.md                  # the original user-provided one-line spec
  plan.md                  # phased plan written by PM-Agent
  user-stories.md          # PM-Agent output
  acceptance-criteria.md   # PM-Agent output: testable criteria
  test-plan.md             # PM-Agent output
  audit-report.md          # Auditor-Agent output
  notes.md                 # running log, all agents may append
  decisions.log            # append-only structured log
artifacts/
  <code, tests, configs produced by Builder-Agent>
demos/
  vesting/                 # cached canned demo run for fallback playback
README.md                  # Demo-Agent output
PITCH.md                   # Demo-Agent output (45-second pitch)
SUBMISSION.md              # Demo-Agent output: text for the hackathon form
```

## decisions.log Format

Each line is exactly:

```
[ISO-8601 timestamp] [agent-name] [action] [outcome] [optional note]
```

Examples:

```
2026-05-17T11:42:13Z PM-Agent emit acceptance-criteria.md ok 7 criteria
2026-05-17T11:48:02Z Builder-Agent write artifacts/vesting.ts ok 142 lines
2026-05-17T11:51:15Z Auditor-Agent flag edge-case fail cliff=0 unhandled
2026-05-17T11:52:30Z Orchestrator retry Builder-Agent with audit-report
2026-05-17T11:55:01Z Demo-Agent write PITCH.md ok 4 paragraphs
```

Parsers MUST tolerate trailing whitespace and missing optional note.

## Agent Contracts

### PM-Agent

**Reads:** `.pod/spec.md`

**Writes:**
- `.pod/user-stories.md`
- `.pod/acceptance-criteria.md`
- `.pod/test-plan.md`
- one start + one end line in `decisions.log`

**acceptance-criteria.md format (strict):**

```markdown
# Acceptance Criteria

## AC-001
Given <context>
When <action>
Then <expected outcome>

## AC-002
...
```

Each AC must be testable. Minimum 5, maximum 15.

**Forbidden:** writing code, choosing tech stack beyond what spec.md specifies.

---

### Builder-Agent

**Reads:**
- `.pod/spec.md`
- `.pod/acceptance-criteria.md`
- `.pod/test-plan.md`
- optional, on retry only: `.pod/audit-report.md`

**Writes:**
- files under `artifacts/`
- one line in `decisions.log` per file written
- start + end lines

**Rules:**
- Code MUST be runnable.
- Tests MUST map 1:1 to acceptance criteria. Test names reference AC IDs.
- If `audit-report.md` exists on this dispatch, MUST address every item under `## BLOCKER`.
- Defaults to TypeScript unless spec demands otherwise.

**Forbidden:** rewriting acceptance criteria, skipping tests, modifying `.pod/` files other than `notes.md`.

---

### Auditor-Agent

**Reads:**
- everything under `artifacts/`
- `.pod/acceptance-criteria.md`
- `.pod/test-plan.md`

**Writes:**
- `.pod/audit-report.md`
- start + end lines in `decisions.log`

**audit-report.md format (strict):**

```markdown
# Audit Report

## Summary
<one paragraph>

## BLOCKER
- [ ] <issue> (file:line)

## RISK
- [ ] <issue> (file:line)

## NIT
- [ ] <issue> (file:line)

## Acceptance Criteria Coverage
- AC-001: PASS | FAIL | NOT_TESTED — <one-line note>
- AC-002: ...
```

**Rules:**
- `BLOCKER` = demo will visibly fail. Use sparingly.
- Every AC from `acceptance-criteria.md` must appear in coverage.
- If `## BLOCKER` is empty, write `- (none)`.

**Forbidden:** writing fixes, modifying `artifacts/`, modifying `acceptance-criteria.md`.

---

### Demo-Agent

**Reads:** everything (entire repo state).

**Writes:**
- `README.md` (project root)
- `PITCH.md`
- `SUBMISSION.md`
- start + end lines in `decisions.log`

**README.md must include:**
- one-line value proposition
- 60-second quickstart (commands a stranger can paste)
- architecture diagram (ASCII)
- canned demo command
- link to PITCH.md

**PITCH.md must:**
- be exactly 4 paragraphs
- speak in first person
- cover: the problem, the design choice, the demo moment, the wider implication
- end with one memorable line
- be readable aloud in 40–50 seconds

**SUBMISSION.md must include:**
- Project name
- One-liner
- Track (Harness/Skills)
- 150-word description
- Who I want to meet

**Forbidden:** modifying `artifacts/`, modifying `acceptance-criteria.md`, modifying `audit-report.md`.

---

## Orchestrator Behavior

Pseudocode:

```
1. Read .pod/spec.md. Halt with error if missing.
2. Log start.
3. Dispatch PM-Agent. Wait. Validate user-stories.md, acceptance-criteria.md, test-plan.md exist and are non-empty.
4. Dispatch Builder-Agent. Wait. Validate artifacts/ is non-empty.
5. Dispatch Auditor-Agent. Wait. Parse audit-report.md.
6. If audit-report.md contains a non-empty ## BLOCKER section:
     a. Log "retry Builder-Agent with audit-report".
     b. Dispatch Builder-Agent again with audit-report.md in context.
     c. Dispatch Auditor-Agent again.
     d. Do NOT retry again regardless of outcome.
7. Dispatch Demo-Agent. Wait.
8. Print final summary table (agent, duration, outcome). Exit 0.
```

Every dispatch writes start + end lines to `decisions.log`. The orchestrator never writes to artifacts or `.pod/` files other than `decisions.log` and `notes.md`.

## Skills (extensibility hook)

Each agent loads "skills" from `src/agents/<name>/skills/*.md` at startup. Skills are short markdown snippets appended to the agent's system prompt. This lets us add domain expertise (e.g., `solidity-audit.md` for Auditor-Agent, `defi-economics.md` for PM-Agent) without modifying the agent core.

For v1, ship one stub skill per agent so the loading mechanism is real and visible:

```
src/agents/pm/skills/clear-acceptance-criteria.md
src/agents/builder/skills/typescript-project-layout.md
src/agents/auditor/skills/edge-case-checklist.md
src/agents/demo/skills/pitch-structure.md
```

The skills mechanism itself is the differentiator. It directly hits "skills" in Harness/Skills Track.

## Versioning

This spec is v1. Breaking changes require:
- bumping the version number at the top of this file
- entry in `decisions.log`
- entry in `notes.md`
