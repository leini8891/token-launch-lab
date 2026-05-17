# How to Run Codex on Agent Pod (Ralphthon Playbook)

This is your sequence for today. Follow it in order. Keep this file open on a second screen.

---

## Step 0 — Setup (5 minutes, do once)

```bash
# Install Codex CLI if not already
npm install -g @openai/codex

# Verify
codex --version

# Make a project folder and drop the three control files in
mkdir agent-pod && cd agent-pod
# copy plan.md, AGENTS.md, pod-spec.md into this folder

# Set your key
export OPENAI_API_KEY=sk-...

# Start Codex
codex
```

Inside Codex, turn on the experimental autonomous mode:

```
/experiment
```

→ select **All** (or whatever the autonomous loop is called today; the OpenAI speaker called it "the All feature" / `/o`). If the menu lists `goal`, that's the one.

---

## Step 1 — Bootstrap the project (11:00 → 11:30)

Paste this single message into Codex first:

```
Read these three files in order:
1. plan.md
2. AGENTS.md
3. pod-spec.md

These files are immutable references. Do not modify them.

Then create the initial project scaffold:
- package.json with TypeScript, commander, chalk, chokidar, openai, next (App Router)
- tsconfig.json with strict mode
- src/index.ts entrypoint
- src/cli.ts with commander setup for: init, agent, run, dashboard
- src/agents/{pm,builder,auditor,demo}/ folders, each with system-prompt.md and skills/ subfolder
- Create empty decisions.log and notes.md at repo root
- Do NOT install dependencies yet. Just create files.

After you finish, run `ls -R` and report the tree. Then stop and wait for my confirmation before continuing.
```

Read what it produced. If the tree looks right, type `continue` and tell it:

```
Good. Now run `npm install` and confirm there are no errors. Then implement pod init "<spec>" — it should:
1. Create a .pod/ folder in cwd
2. Write the spec string to .pod/spec.md
3. Create empty placeholders for the rest of the files listed in pod-spec.md "Shared State Layout"
4. Append a start line to decisions.log

Show me the code in src/cli.ts and src/commands/init.ts before running it.
```

---

## Step 2 — Fire the autonomous goal (11:30)

This is the "Ralph Loop" trigger. Once you paste this, you can walk away.

```
/goal

End state:
A fully working "Agent Pod" CLI and dashboard exists in this repo, capable of being demoed live at 7PM.

Verification (must all pass):
1. `pod init "build a token vesting calculator CLI in TypeScript"` creates .pod/spec.md and the directory layout described in pod-spec.md.
2. `pod agent pm` reads .pod/spec.md and writes .pod/user-stories.md, .pod/acceptance-criteria.md, .pod/test-plan.md following the strict formats in pod-spec.md.
3. `pod agent builder` reads .pod/acceptance-criteria.md and writes runnable TypeScript code under artifacts/, with tests that reference AC IDs.
4. `pod agent auditor` reads artifacts/ and writes .pod/audit-report.md following the strict format in pod-spec.md, including every AC in the coverage section.
5. `pod agent demo` writes README.md, PITCH.md, and SUBMISSION.md.
6. `pod run "<spec>"` runs the full PM → Builder → Auditor → (retry Builder once if BLOCKER) → Demo sequence end-to-end, writing start/end lines to decisions.log at each step.
7. `pod dashboard` opens a Next.js dashboard at localhost:3000 with the layout described in plan.md M4 (spec/plan on left, live tail of notes.md + decisions.log in center, artifacts list on right).
8. One pre-run canned demo exists under demos/vesting/ — the spec was "build a token vesting calculator CLI in TypeScript with tests for cliff and linear vesting" and the resulting artifacts pass their own tests.
9. The root README.md has a 60-second quickstart that a stranger can paste to run the canned demo.
10. PITCH.md exists with a 4-paragraph 45-second pitch.
11. SUBMISSION.md exists with project name, one-liner, track, 150-word description, and who-to-meet.
12. `npm run build` passes with zero TypeScript errors.
13. `npm run typecheck` passes.

Constraints:
- Follow AGENTS.md strictly.
- Follow pod-spec.md strictly. Treat it as an immutable contract.
- TypeScript strict mode. No `any`. No `@ts-ignore`.
- No LangChain, LlamaIndex, AutoGen, CrewAI, or other agent framework.
- Use OpenAI Node SDK directly.
- Markdown is the wire format between agents. No in-process shared state.
- One retry max on Builder if Auditor flags BLOCKER.
- Every agent dispatch writes start + end lines to decisions.log.
- Update notes.md when you make non-obvious decisions.

Boundaries:
- Do not modify plan.md, AGENTS.md, or pod-spec.md unless you stop and ask.
- Do not add a database, authentication, or payment.
- Do not skip M5 (canned demo) to keep polishing M4 (dashboard). M5 ranks higher than M4.

Iterative path:
- Build M1 → M2 → M3 → M5 → M4 → M6 in that priority order. M5 before M4 because the canned demo is the artifact the audience sees.
- After each milestone, run a smoke test, append to decisions.log, and append to notes.md.

Stop when all 13 verification points pass.
```

---

## Step 3 — Side-check during Ralph Loop (1PM–2PM, no laptop)

You can't touch the laptop, but the OpenAI speaker showed a `side` feature that forks the context for a read-only check. Before you walk away at 1PM, queue this in your head — you'll need it from your phone or by asking a friend with the lobster costume:

If you can sneak a peek, use the Codex web view to check `decisions.log` tail. You're looking for:
- Both PM and Builder agents have completed at least once
- No "halted" or "blocked" lines
- decisions.log has 10+ entries by 2PM

If something looks dead, that's when you put on the lobster and intervene.

---

## Step 4 — Mid-run intervention (2PM)

Most likely issues and the prompt to fix each:

### If PM-Agent over/under-specs:
```
The PM-Agent acceptance criteria are [too vague | too many]. Re-dispatch PM-Agent with this added instruction: "Aim for 7–10 acceptance criteria, each testable in under 20 lines of code." Then re-run Builder and Auditor.
```

### If Builder code doesn't compile:
```
Builder output has TypeScript errors. Append the compile errors to .pod/audit-report.md under ## BLOCKER and re-dispatch Builder-Agent with that file. Do not retry more than once.
```

### If Auditor is too lenient:
```
Auditor missed [X]. Update src/agents/auditor/skills/edge-case-checklist.md to include "<specific check>". Re-dispatch Auditor on the current artifacts.
```

### If dashboard isn't tailing files:
```
Dashboard isn't reflecting decisions.log updates. Check the chokidar watcher on .pod/ and ensure SSE or polling pushes updates to the client. Keep it simple — 500ms poll is fine.
```

---

## Step 5 — Polish (4PM–5PM, after Ralph Loop ends)

```
Show me PITCH.md. I want to read it aloud and time it.
```

Rehearse. If it's over 50 seconds, tell Codex:
```
PITCH.md is too long. Cut it to exactly 4 paragraphs that read aloud in 45 seconds. Keep the memorable closing line.
```

Then:
```
Show me SUBMISSION.md. I'm about to paste it into the Ralphthon form.
```

---

## Step 6 — Submission (5PM)

Paste SUBMISSION.md content into the Ralphthon submission form. Confirm the timer.

---

## Step 7 — Demo prep (5:15PM speaker sessions)

While speakers are on, run the canned demo from `demos/vesting/` one final time. Confirm everything works. Open a fresh terminal in case you need to live-run it on stage.

---

## Step 8 — Demo on stage (7PM if shortlisted)

Open with PITCH.md paragraph 1. Run the canned demo. Talk over the dashboard. Close with PITCH.md paragraph 4.

If live demo fails, fall back to: "Let me show you the recording from earlier today" and play the backup video.

---

## Emergency Shortcuts

If by 3PM things are seriously behind:
- Skip M4 dashboard entirely. Just `cat decisions.log | tail -30` on stage. Honest and works.
- Skip Auditor retry logic. Make Builder strong on first pass.
- Skip skills/ folder. Stubs are fine.

If by 4:30PM things are still rough:
- Use only the canned demo. Don't live-run.
- Submit whatever works. Honesty beats half-broken polish.

---

## What "Strong Goal" looks like (per OpenAI speaker)

The /goal block above is engineered for the three criteria they described:
- **Specific objective**: 13 numbered verification points
- **Evidence-based finish**: every point is binary pass/fail
- **Iterative path**: explicit milestone ordering with priority

Don't hand-wave the verification list. The more pass/fail criteria, the better the goal mode performs.
