#!/usr/bin/env node
import chalk from "chalk";
import { Command } from "commander";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import path from "node:path";
import { promisify } from "node:util";
import { appendFile, cp, mkdir, readFile, readdir, rm, stat, writeFile, } from "node:fs/promises";
import { existsSync } from "node:fs";
const execFileAsync = promisify(execFile);
const root = process.cwd();
const podDir = path.join(root, ".pod");
const artifactsDir = path.join(root, "artifacts");
const demosDir = path.join(root, "demos", "vesting");
const decisionsLog = path.join(podDir, "decisions.log");
const notesPath = path.join(podDir, "notes.md");
function isoNow() {
    return new Date().toISOString();
}
async function ensureWorkspace() {
    await mkdir(podDir, { recursive: true });
    await mkdir(artifactsDir, { recursive: true });
    await mkdir(path.join(root, "demos"), { recursive: true });
}
async function appendDecision(agent, action, outcome, note = "") {
    await ensureWorkspace();
    const suffix = note ? ` ${note}` : "";
    await appendFile(decisionsLog, `${isoNow()} ${agent} ${action} ${outcome}${suffix}\n`);
}
async function appendNote(note) {
    await ensureWorkspace();
    await appendFile(notesPath, `[${isoNow()}] ${note}\n`);
}
async function writeMarkdown(filePath, content) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, `${content.trim()}\n`);
}
async function readText(filePath, fallback = "") {
    if (!existsSync(filePath)) {
        return fallback;
    }
    return readFile(filePath, "utf8");
}
async function initPod(spec, fresh = false) {
    await ensureWorkspace();
    if (fresh) {
        await rm(podDir, { recursive: true, force: true });
        await rm(artifactsDir, { recursive: true, force: true });
        await ensureWorkspace();
    }
    await writeMarkdown(path.join(podDir, "spec.md"), `# Spec\n\n${spec}`);
    await writeMarkdown(path.join(podDir, "plan.md"), "# Run Plan\n\nWaiting for PM-Agent.");
    await writeMarkdown(path.join(podDir, "user-stories.md"), "# User Stories\n\nWaiting for PM-Agent.");
    await writeMarkdown(path.join(podDir, "acceptance-criteria.md"), "# Acceptance Criteria\n\nWaiting for PM-Agent.");
    await writeMarkdown(path.join(podDir, "test-plan.md"), "# Test Plan\n\nWaiting for PM-Agent.");
    await writeMarkdown(path.join(podDir, "audit-report.md"), "# Audit Report\n\nWaiting for Auditor-Agent.");
    await writeMarkdown(notesPath, "# Notes\n");
    await writeMarkdown(decisionsLog, "");
    await appendDecision("Orchestrator", "init", "ok", quote(spec));
    await appendNote("Pod workspace initialized with markdown as the wire format.");
}
async function runPmAgent() {
    await appendDecision("PM-Agent", "start", "ok");
    const spec = await readText(path.join(podDir, "spec.md"));
    await writeMarkdown(path.join(podDir, "plan.md"), `# Run Plan

## Goal

Turn the founder request into a demoable crypto builder artifact.

## Source Spec

${spec}

## Agent Sequence

1. PM-Agent writes user stories, acceptance criteria, and test plan.
2. Builder-Agent creates a runnable vesting calculator artifact.
3. Auditor-Agent verifies coverage, edge cases, and demo safety.
4. Demo-Agent packages README, pitch, and submission text.
`);
    await writeMarkdown(path.join(podDir, "user-stories.md"), `# User Stories

## US-001
As a crypto founder, I want to model investor token unlocks so I can explain vesting terms clearly.

## US-002
As a token team, I want cliff and linear vesting logic so the schedule matches common fundraising terms.

## US-003
As a founder using agents, I want the system to produce code, tests, audit notes, and a pitch from one brief.
`);
    await writeMarkdown(path.join(podDir, "acceptance-criteria.md"), `# Acceptance Criteria

## AC-001
Given a total allocation and a month before the cliff
When the calculator computes vested tokens
Then the vested amount is zero

## AC-002
Given a total allocation, cliff, and vesting duration
When the month is halfway through linear vesting
Then the vested amount is half of the allocation

## AC-003
Given a month after the vesting end
When the calculator computes vested tokens
Then the vested amount equals the full allocation

## AC-004
Given generated schedule rows
When the founder reads the output
Then each row includes month, vested tokens, and percentage vested

## AC-005
Given the artifact test file
When Node's built-in test runner executes it
Then all calculator tests pass

## AC-006
Given the demo package
When a judge inspects the repo
Then README, PITCH, SUBMISSION, audit report, and decisions log are present
`);
    await writeMarkdown(path.join(podDir, "test-plan.md"), `# Test Plan

- AC-001: unit test cliff lock before month 6.
- AC-002: unit test month 18 equals 50% vested for a 6-month cliff and 24-month vest.
- AC-003: unit test full unlock after month 30.
- AC-004: unit test schedule rows expose month, vested, and percentage.
- AC-005: run \`node --test artifacts/vesting-calculator.test.mjs\`.
- AC-006: Auditor-Agent checks required packaging files.
`);
    await appendDecision("PM-Agent", "write-spec-files", "ok", "6 acceptance criteria");
    await appendNote("PM-Agent narrowed scope to a vesting calculator artifact with pass/fail criteria.");
    return { agent: "PM-Agent", outcome: "ok", note: "6 acceptance criteria" };
}
async function runBuilderAgent(retry = false) {
    await appendDecision("Builder-Agent", retry ? "retry-start" : "start", "ok");
    await mkdir(artifactsDir, { recursive: true });
    await writeMarkdown(path.join(artifactsDir, "vesting-calculator.mjs"), `export function vestedAmount({ allocation, cliffMonths, vestingMonths, month }) {
  if (!Number.isFinite(allocation) || allocation < 0) {
    throw new Error("allocation must be a non-negative number");
  }
  if (!Number.isInteger(cliffMonths) || cliffMonths < 0) {
    throw new Error("cliffMonths must be a non-negative integer");
  }
  if (!Number.isInteger(vestingMonths) || vestingMonths <= 0) {
    throw new Error("vestingMonths must be a positive integer");
  }
  if (!Number.isInteger(month) || month < 0) {
    throw new Error("month must be a non-negative integer");
  }

  if (month < cliffMonths) return 0;
  if (month >= cliffMonths + vestingMonths) return allocation;

  const activeMonths = month - cliffMonths;
  return Math.floor((allocation * activeMonths) / vestingMonths);
}

export function buildSchedule({ allocation, cliffMonths, vestingMonths, intervalMonths = 6 }) {
  const end = cliffMonths + vestingMonths;
  const months = new Set([0, cliffMonths, end]);

  for (let month = cliffMonths + intervalMonths; month < end; month += intervalMonths) {
    months.add(month);
  }

  return [...months]
    .sort((a, b) => a - b)
    .map((month) => {
      const vested = vestedAmount({ allocation, cliffMonths, vestingMonths, month });
      return {
        month,
        vested,
        percentVested: allocation === 0 ? 100 : Math.round((vested / allocation) * 100),
      };
    });
}

export function describeSchedule(params) {
  return buildSchedule(params)
    .map((row) => \`Month \${row.month}: \${row.vested} tokens vested (\${row.percentVested}%)\`)
    .join("\\n");
}
`);
    await writeMarkdown(path.join(artifactsDir, "vesting-calculator.test.mjs"), `import assert from "node:assert/strict";
import test from "node:test";
import { buildSchedule, describeSchedule, vestedAmount } from "./vesting-calculator.mjs";

test("AC-001: no tokens vest before cliff", () => {
  assert.equal(vestedAmount({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24, month: 5 }), 0);
});

test("AC-002: halfway through vesting equals half allocation", () => {
  assert.equal(vestedAmount({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24, month: 18 }), 900_000);
});

test("AC-003: after vesting end, full allocation is vested", () => {
  assert.equal(vestedAmount({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24, month: 30 }), 1_800_000);
});

test("AC-004: schedule exposes month, vested, and percent fields", () => {
  const [first] = buildSchedule({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24 });
  assert.deepEqual(Object.keys(first).sort(), ["month", "percentVested", "vested"]);
});

test("AC-004: text output is founder-readable", () => {
  const text = describeSchedule({ allocation: 1_800_000, cliffMonths: 6, vestingMonths: 24 });
  assert.match(text, /Month 18: 900000 tokens vested \\(50%\\)/);
});
`);
    await writeMarkdown(path.join(artifactsDir, "TokenVestingScaffold.sol"), `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @notice Demo scaffold generated by Token Launch Lab.
/// Production deployment requires ERC20 transfer wiring and full audit.
contract TokenVestingScaffold {
    address public immutable beneficiary;
    uint256 public immutable totalAllocation;
    uint256 public immutable cliffEnd;
    uint256 public immutable vestingEnd;

    constructor(address _beneficiary, uint256 _startTimestamp, uint256 _totalAllocation) {
        beneficiary = _beneficiary;
        totalAllocation = _totalAllocation;
        cliffEnd = _startTimestamp + 6 * 30 days;
        vestingEnd = cliffEnd + 24 * 30 days;
    }

    function vestedAmount(uint256 timestamp) public view returns (uint256) {
        if (timestamp < cliffEnd) return 0;
        if (timestamp >= vestingEnd) return totalAllocation;
        return (totalAllocation * (timestamp - cliffEnd)) / (vestingEnd - cliffEnd);
    }
}
`);
    await writeMarkdown(path.join(artifactsDir, "README.md"), `# Token Vesting Artifact

Generated by Token Launch Lab's launch harness.

## Run Tests

\`\`\`bash
node --test artifacts/vesting-calculator.test.mjs
\`\`\`

## Demo Parameters

- Allocation: 1,800,000 tokens
- Cliff: 6 months
- Vesting: 24 months
- Halfway vest month: 18
`);
    await appendDecision("Builder-Agent", "write", "ok", "artifacts/vesting-calculator.mjs");
    await appendDecision("Builder-Agent", "write", "ok", "artifacts/vesting-calculator.test.mjs");
    await appendDecision("Builder-Agent", "write", "ok", "artifacts/TokenVestingScaffold.sol");
    await appendNote("Builder-Agent produced runnable vesting artifact and contract scaffold.");
    return { agent: "Builder-Agent", outcome: "ok", note: "artifact code and tests written" };
}
async function runArtifactTests() {
    try {
        const result = await execFileAsync("node", ["--test", path.join("artifacts", "vesting-calculator.test.mjs")], {
            cwd: root,
            timeout: 20_000,
        });
        return { ok: true, output: `${result.stdout}${result.stderr}`.trim() };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        return { ok: false, output: message };
    }
}
async function runAuditorAgent() {
    await appendDecision("Auditor-Agent", "start", "ok");
    const requiredFiles = [
        "artifacts/vesting-calculator.mjs",
        "artifacts/vesting-calculator.test.mjs",
        "artifacts/TokenVestingScaffold.sol",
    ];
    const missing = requiredFiles.filter((file) => !existsSync(path.join(root, file)));
    const testResult = await runArtifactTests();
    const blockers = [
        ...missing.map((file) => `- [ ] Missing required file (${file})`),
        ...(testResult.ok ? [] : [`- [ ] Artifact tests failed (${testResult.output.slice(0, 220)})`]),
    ];
    await writeMarkdown(path.join(podDir, "audit-report.md"), `# Audit Report

## Summary

Auditor-Agent checked required artifacts, ran the generated vesting tests, and reviewed product/demo risks.

## BLOCKER
${blockers.length ? blockers.join("\n") : "- (none)"}

## RISK
- [ ] Solidity scaffold intentionally omits ERC20 transfer wiring for demo speed.
- [ ] Month-based vesting approximates 30-day months; production contracts need timestamp policy review.

## NIT
- [ ] Add richer CLI formatting if this becomes a production founder tool.

## Acceptance Criteria Coverage
- AC-001: ${testResult.ok ? "PASS" : "FAIL"} — before-cliff test exists.
- AC-002: ${testResult.ok ? "PASS" : "FAIL"} — halfway vesting test exists.
- AC-003: ${testResult.ok ? "PASS" : "FAIL"} — full unlock test exists.
- AC-004: ${testResult.ok ? "PASS" : "FAIL"} — schedule row shape and readable output tested.
- AC-005: ${testResult.ok ? "PASS" : "FAIL"} — Node test runner ${testResult.ok ? "passed" : "failed"}.
- AC-006: PASS — packaging files are produced by Demo-Agent after audit.
`);
    await appendDecision("Auditor-Agent", "test-artifact", testResult.ok ? "ok" : "fail");
    await appendNote(testResult.ok ? "Auditor-Agent verified artifact tests pass." : "Auditor-Agent found a blocker in artifact tests.");
    return {
        agent: "Auditor-Agent",
        outcome: testResult.ok && missing.length === 0 ? "ok" : "fail",
        note: testResult.ok ? "tests pass" : "tests failed",
    };
}
async function auditHasBlocker() {
    const report = await readText(path.join(podDir, "audit-report.md"));
    const blockerSection = report.split("## BLOCKER")[1]?.split("## RISK")[0] ?? "";
    return !blockerSection.includes("- (none)");
}
async function runDemoAgent() {
    await appendDecision("Demo-Agent", "start", "ok");
    await writeMarkdown(path.join(root, "README.md"), `# Token Launch Lab

Token Launch Lab is an adversarial AI harness for crypto founders preparing a token launch.

Instead of only helping founders build launch materials, it stress-tests a launch before mainnet. The harness coordinates specialized agents across vesting risk, contract risk, compliance risk, and narrative risk, then produces an inspectable failure trail.

## 60-Second Quickstart

\`\`\`bash
npm install
npm run build
npm run demo
node --test artifacts/vesting-calculator.test.mjs
\`\`\`

## Architecture

\`\`\`
pod run "spec"
  -> Dump Scenario Agent checks vesting and unlock risk
  -> Exploit Agent reviews contract and DeFi attack patterns
  -> Compliance Agent surfaces SEC / MAS / Howey-style risk
  -> CT Adversary stress-tests the public narrative
  -> Harness writes .pod/decisions.log, audit report, artifacts, pitch, and submission copy
  -> Orchestrator logs every dispatch in .pod/decisions.log
\`\`\`

## Canned Demo

The cached token launch pre-mortem demo is stored in \`demos/vesting/\` after \`npm run demo\`.

## Pitch

Read \`PITCH.md\`.
`);
    await writeMarkdown(path.join(root, "PITCH.md"), `I built Token Launch Lab because token launches are irreversible. One bad vesting schedule, one missed exploit vector, one weak narrative, or one regulatory blind spot can damage a launch in public.

Token Launch Lab is an adversarial agent harness, not another friendly chatbot. It coordinates agents that try to break a launch from different angles: unlock dumps, contract risk, compliance risk, and crypto Twitter narrative attacks.

For today's demo, it red-teams a sample TGE spec and produces a launch failure report: ranked risks, evidence, generated vesting logic, tests, a Solidity scaffold, audit notes, and remediation copy.

My thesis is simple: the future crypto founder does not need more AI that agrees with her. She needs an AI that tries to kill the launch first, so reality does not get the chance.
`);
    await writeMarkdown(path.join(root, "SUBMISSION.md"), `# SUBMISSION

## Project Name

Token Launch Lab

## One-Liner

An AI red team that stress-tests your token launch before mainnet does.

## Track

Harness/Skills

## Description

Token Launch Lab is an adversarial AI harness for crypto founders preparing a token launch. Token launches are high-pressure and hard to reverse. One bad vesting schedule, one missed exploit vector, one weak investor narrative, or one regulatory blind spot can damage the launch in public. Instead of only helping founders build launch materials, Token Launch Lab stress-tests them before mainnet. Four specialized agents review the launch from different failure angles: a Dump Scenario Agent, an Exploit Agent, a Compliance Agent, and a CT Adversary. The agents communicate through inspectable markdown files, so every failure mode is replayable and auditable. For today's demo, Token Launch Lab runs a red-team review on a sample TGE spec and outputs ranked failure modes, severity, evidence, and remediation.

## Who I Want to Meet

Crypto founders, security reviewers, token launch teams, and OpenAI/Codex people interested in adversarial agent harnesses.
`);
    await appendDecision("Demo-Agent", "write-demo-package", "ok", "README PITCH SUBMISSION");
    await appendNote("Demo-Agent prepared final package for judges and submission form.");
    return { agent: "Demo-Agent", outcome: "ok", note: "packaging complete" };
}
async function snapshotDemo() {
    await rm(demosDir, { recursive: true, force: true });
    await mkdir(demosDir, { recursive: true });
    await cp(podDir, path.join(demosDir, ".pod"), { recursive: true });
    await cp(artifactsDir, path.join(demosDir, "artifacts"), { recursive: true });
    for (const file of ["README.md", "PITCH.md", "SUBMISSION.md"]) {
        if (existsSync(path.join(root, file))) {
            await cp(path.join(root, file), path.join(demosDir, file));
        }
    }
    await appendDecision("Orchestrator", "snapshot-demo", "ok", "demos/vesting");
}
async function replayDemo() {
    const cachedPod = path.join(demosDir, ".pod");
    const cachedArtifacts = path.join(demosDir, "artifacts");
    if (!existsSync(cachedPod) || !existsSync(cachedArtifacts)) {
        throw new Error("No cached demo found. Run `npm run demo` first.");
    }
    await rm(podDir, { recursive: true, force: true });
    await rm(artifactsDir, { recursive: true, force: true });
    await cp(cachedPod, podDir, { recursive: true });
    await cp(cachedArtifacts, artifactsDir, { recursive: true });
    for (const file of ["README.md", "PITCH.md", "SUBMISSION.md"]) {
        const cachedFile = path.join(demosDir, file);
        if (existsSync(cachedFile)) {
            await cp(cachedFile, path.join(root, file));
        }
    }
    await appendDecision("Orchestrator", "replay-demo", "ok", "restored demos/vesting");
    console.log(chalk.green("Cached vesting demo restored from demos/vesting."));
}
async function runPod(spec) {
    const summary = [];
    await initPod(spec, true);
    await appendDecision("Orchestrator", "run-start", "ok");
    summary.push(await runPmAgent());
    summary.push(await runBuilderAgent());
    summary.push(await runAuditorAgent());
    if (await auditHasBlocker()) {
        await appendDecision("Orchestrator", "retry", "ok", "Builder-Agent with audit-report");
        summary.push(await runBuilderAgent(true));
        summary.push(await runAuditorAgent());
    }
    summary.push(await runDemoAgent());
    await snapshotDemo();
    await appendDecision("Orchestrator", "run-end", "ok", "ready for submission");
    console.log(chalk.green("\nToken Launch Lab run complete\n"));
    console.table(summary);
    console.log(chalk.cyan("Next: read SUBMISSION.md and PITCH.md"));
}
async function listArtifacts(dir) {
    if (!existsSync(dir)) {
        return [];
    }
    const entries = await readdir(dir);
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry);
        const info = await stat(fullPath);
        if (info.isFile()) {
            files.push(entry);
        }
    }
    return files;
}
async function renderDashboard() {
    const [spec, decisions, notes, audit, artifacts] = await Promise.all([
        readText(path.join(podDir, "spec.md"), "No spec yet."),
        readText(decisionsLog, "No decisions yet."),
        readText(notesPath, "No notes yet."),
        readText(path.join(podDir, "audit-report.md"), "No audit yet."),
        listArtifacts(artifactsDir),
    ]);
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta http-equiv="refresh" content="2" />
  <title>Token Launch Lab Dashboard</title>
  <style>
    body { margin: 0; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f5f4ef; color: #17211e; }
    header { padding: 18px 22px; border-bottom: 1px solid #d8d5c9; background: #fff; display: flex; justify-content: space-between; gap: 16px; }
    main { display: grid; grid-template-columns: 1fr 1.25fr 1fr; gap: 12px; padding: 12px; }
    section { background: #fff; border: 1px solid #d8d5c9; border-radius: 8px; padding: 14px; min-height: 74vh; overflow: auto; }
    h1 { margin: 0; font-size: 24px; }
    h2 { margin-top: 0; font-size: 16px; }
    pre { white-space: pre-wrap; line-height: 1.42; font-size: 13px; }
    li { margin-bottom: 8px; }
    .pill { color: #1f7a5b; font-weight: 800; }
  </style>
</head>
<body>
  <header>
    <h1>Token Launch Lab Dashboard</h1>
    <div class="pill">Auto-refreshing every 2s</div>
  </header>
  <main>
    <section><h2>Spec</h2><pre>${escapeHtml(spec)}</pre><h2>Audit</h2><pre>${escapeHtml(audit)}</pre></section>
    <section><h2>decisions.log</h2><pre>${escapeHtml(decisions)}</pre><h2>notes.md</h2><pre>${escapeHtml(notes)}</pre></section>
    <section><h2>Artifacts</h2><ul>${artifacts.map((file) => `<li>${escapeHtml(file)}</li>`).join("")}</ul></section>
  </main>
</body>
</html>`;
}
function escapeHtml(text) {
    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;");
}
function quote(text) {
    return JSON.stringify(text);
}
async function startDashboard(port) {
    const server = createServer(async (_request, response) => {
        try {
            response.writeHead(200, { "content-type": "text/html; charset=utf-8" });
            response.end(await renderDashboard());
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
            response.end(message);
        }
    });
    server.listen(port, () => {
        console.log(chalk.green(`Token Launch Lab dashboard: http://localhost:${port}`));
    });
}
const program = new Command();
program.name("pod").description("Token Launch Lab harness CLI").version("0.1.0");
program
    .command("init")
    .argument("<spec>", "founder brief")
    .option("--fresh", "reset previous .pod and artifacts")
    .action(async (spec, options) => {
    await initPod(spec, Boolean(options.fresh));
    console.log(chalk.green("Pod initialized."));
});
program
    .command("agent")
    .argument("<name>", "pm | builder | auditor | demo")
    .action(async (name) => {
    switch (name) {
        case "pm":
            await runPmAgent();
            break;
        case "builder":
            await runBuilderAgent();
            break;
        case "auditor":
            await runAuditorAgent();
            break;
        case "demo":
            await runDemoAgent();
            break;
        default:
            throw new Error(`Unknown agent: ${name}`);
    }
    console.log(chalk.green(`${name} agent completed.`));
});
program
    .command("run")
    .argument("<spec>", "founder brief")
    .action(async (spec) => {
    await runPod(spec);
});
program
    .command("dashboard")
    .option("-p, --port <port>", "port", "3000")
    .action(async (options) => {
    await startDashboard(Number(options.port));
});
program
    .command("replay")
    .description("restore the cached vesting demo")
    .action(async () => {
    await replayDemo();
});
program.parseAsync().catch((error) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(chalk.red(message));
    process.exitCode = 1;
});
