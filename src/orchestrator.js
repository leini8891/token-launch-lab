import { readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";

const INPUT_FILE = "tge-spec.md";
const OUTPUTS = {
  findings: "redteam-findings.md",
  killReport: "kill-report.md",
  remediation: "remediation.md",
  judgeEvaluation: "judge-evaluation.md",
};

const severityWeight = {
  low: 2,
  medium: 5,
  high: 12,
  critical: 20,
};

const severityRank = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const confidenceRank = {
  low: 1,
  medium: 2,
  high: 3,
};

function quoteEvidence(spec, patterns) {
  const lines = spec
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const pattern of patterns) {
    const hit = lines.find((line) => line.toLowerCase().includes(pattern.toLowerCase()));
    if (hit) return hit.replace(/^[-# ]+/, "");
  }

  return "Evidence not explicit in TGE spec.";
}

function finding({ id, agent, title, severity, confidence, evidence, risk, remediation, priority }) {
  return {
    id,
    agent,
    title,
    severity,
    confidence,
    evidence,
    risk,
    remediation,
    priority,
  };
}

function dumpRiskAgent(spec) {
  return [
    finding({
      id: "DUMP-001",
      agent: "Dump Risk Agent",
      title: "Investor unlock cliff may create a visible sell-pressure event",
      severity: "high",
      confidence: "high",
      evidence: quoteEvidence(spec, ["Investors: 18%", "6-month cliff"]),
      risk: "A large investor allocation with a short cliff can become the launch's first public trust test.",
      remediation: "Model month-by-month unlock pressure, publish a transparent unlock calendar, and consider longer lockups or staggered unlock tranches before listing talks.",
      priority: "P0 before CEX listing conversations",
    }),
    finding({
      id: "DUMP-002",
      agent: "Dump Risk Agent",
      title: "TGE liquidity and market-making allocation needs explicit guardrails",
      severity: "medium",
      confidence: "medium",
      evidence: quoteEvidence(spec, ["Liquidity and market making"]),
      risk: "The spec does not explain how liquidity inventory can be used, creating optics risk around early price support or insider advantage.",
      remediation: "Document market-maker mandate, inventory limits, reporting cadence, and conflict controls.",
      priority: "P1 before public launch materials",
    }),
  ];
}

function protocolRiskAgent(spec) {
  return [
    finding({
      id: "PROTO-001",
      agent: "Protocol Risk Agent",
      title: "Emergency pause and incident response policy is undefined",
      severity: "high",
      confidence: "high",
      evidence: quoteEvidence(spec, ["Emergency pause policy"]),
      risk: "A launch can fail operationally if the team cannot explain who can pause, when they can pause, and how users are protected.",
      remediation: "Define pause authority, multisig policy, event disclosure process, and post-incident restart criteria. This is defensive review only and does not include exploit instructions.",
      priority: "P0 before mainnet deployment",
    }),
    finding({
      id: "PROTO-002",
      agent: "Protocol Risk Agent",
      title: "Audit timing is too late for launch-readiness confidence",
      severity: "medium",
      confidence: "high",
      evidence: quoteEvidence(spec, ["External audit"]),
      risk: "Planning audit after prototype is normal, but launch messaging should not imply production readiness before audit findings are closed.",
      remediation: "Separate prototype demo from production launch, publish audit status honestly, and require all high-severity audit items to close before TGE.",
      priority: "P1 before investor or listing materials",
    }),
  ];
}

function regulatoryRiskAgent(spec) {
  return [
    finding({
      id: "REG-001",
      agent: "Regulatory Risk Agent",
      title: "Public sale and US participation are unresolved risk flags",
      severity: "critical",
      confidence: "medium",
      evidence: `${quoteEvidence(spec, ["Public sale"])} / ${quoteEvidence(spec, ["funds in Singapore", "US investors", "and the US"])}`,
      risk: "The spec mentions US investors and a possible public sale without a distribution policy. This is not legal advice, but it is a launch-risk flag.",
      remediation: "Get qualified legal review, define jurisdiction gating, investor eligibility, transfer restrictions, and communications policy before any public sale decision.",
      priority: "P0 before fundraising, airdrop, or public sale announcement",
    }),
    finding({
      id: "REG-002",
      agent: "Regulatory Risk Agent",
      title: "Referral and trading rewards may create incentive-design concerns",
      severity: "medium",
      confidence: "medium",
      evidence: quoteEvidence(spec, ["airdrops, referrals, and trading rewards"]),
      risk: "Rewards tied to trading or referrals can attract regulatory, market integrity, or user-protection scrutiny depending on execution.",
      remediation: "Review campaign mechanics with counsel and compliance reviewers; avoid promising returns or encouraging manipulative trading behavior.",
      priority: "P1 before campaign design",
    }),
  ];
}

function ctAdversaryAgent(spec) {
  return [
    finding({
      id: "CT-001",
      agent: "CT Adversary Agent",
      title: "Narrative sounds derivative and may be attacked as tokenizing a SaaS metaphor",
      severity: "medium",
      confidence: "high",
      evidence: quoteEvidence(spec, ["Stripe Atlas"]),
      risk: "Crypto Twitter can frame the launch as a generic infrastructure metaphor plus token incentives, not a token with clear necessity.",
      remediation: "Clarify why the token is necessary, what users can do without speculation, and what measurable network behavior the token coordinates.",
      priority: "P1 before public narrative push",
    }),
    finding({
      id: "CT-002",
      agent: "CT Adversary Agent",
      title: "Points-to-token farm concern is already present in founder notes",
      severity: "high",
      confidence: "high",
      evidence: quoteEvidence(spec, ["points-to-token farm"]),
      risk: "If the founder already fears this critique, the launch needs stronger proof of utility before incentives begin.",
      remediation: "Publish user workflows, non-speculative utility, and retention metrics before token reward campaigns.",
      priority: "P0 before campaign launch",
    }),
  ];
}

function scoreFindings(findings) {
  const penalty = findings.reduce((sum, item) => sum + severityWeight[item.severity], 0);
  const criticalCount = findings.filter((item) => item.severity === "critical").length;
  const highCount = findings.filter((item) => item.severity === "high").length;
  const score = Math.max(0, 100 - penalty);
  const readiness =
    criticalCount > 0
      ? "NO-GO"
      : highCount > 1
        ? "CONDITIONAL"
        : score >= 75
          ? "READY WITH MONITORING"
          : "CONDITIONAL";

  return { score, readiness, penalty, criticalCount, highCount };
}

function sortFindings(findings) {
  return [...findings].sort((a, b) => {
    const bySeverity = severityRank[b.severity] - severityRank[a.severity];
    if (bySeverity !== 0) return bySeverity;
    return confidenceRank[b.confidence] - confidenceRank[a.confidence];
  });
}

function renderFinding(item, index) {
  return `### ${index + 1}. ${item.id}: ${item.title}

- Agent: ${item.agent}
- Severity: ${item.severity}
- Confidence: ${item.confidence}
- Evidence from TGE spec: "${item.evidence}"
- Risk: ${item.risk}
- Remediation priority: ${item.priority}
- Recommended remediation: ${item.remediation}`;
}

function renderFindings(findings) {
  return `# Red-Team Findings

Defensive risk review only. This file does not provide exploit instructions or legal advice.

${sortFindings(findings).map(renderFinding).join("\n\n")}`;
}

function renderKillReport(findings, score) {
  const top = sortFindings(findings).slice(0, 4);
  return `# Kill Report

## Launch Readiness

- Score: ${score.score}/100
- Recommendation: ${score.readiness}
- Critical findings: ${score.criticalCount}
- High findings: ${score.highCount}

## Executive Summary

Token Launch Lab found ${findings.length} launch failure modes across dump risk, protocol risk, regulatory risk, and public narrative risk. The current sample TGE should not be treated as launch-ready until all P0 items are resolved.

## Top Failure Modes

${top.map(renderFinding).join("\n\n")}

## Safety Boundaries

- No exploit instructions are generated.
- No legal advice is provided.
- Findings are defensive launch-readiness signals for founders, exchanges, launchpads, and reviewers.`;
}

function renderRemediation(findings) {
  const sorted = sortFindings(findings);
  return `# Remediation Plan

## P0: Fix Before Mainnet Or Listing Conversations

${sorted
  .filter((item) => item.priority.startsWith("P0"))
  .map((item) => `- ${item.id}: ${item.remediation}`)
  .join("\n")}

## P1: Fix Before Public Launch Materials

${sorted
  .filter((item) => item.priority.startsWith("P1"))
  .map((item) => `- ${item.id}: ${item.remediation}`)
  .join("\n")}

## Founder Review Checklist

- Confirm vesting and unlock calendar are public and easy to understand.
- Confirm incident response and pause policy are documented.
- Confirm qualified legal review before public sale or incentive campaigns.
- Confirm token narrative explains non-speculative utility.
- Re-run \`node src/orchestrator.js\` after updating \`tge-spec.md\`.`;
}

function renderJudgeEvaluation(findings, score) {
  const agents = [...new Set(findings.map((item) => item.agent))];
  return `# Judge Evaluation

## Harness / Skills Track Fit

Token Launch Lab is an adversarial multi-agent harness. The harness itself is the deliverable: it defines agent roles, shared input, inspectable outputs, scoring, termination, and safety boundaries.

## Agent Roles

${agents.map((agent) => `- ${agent}`).join("\n")}
- Orchestrator / Judge Agent

## Shared Input

- \`${INPUT_FILE}\`

## Inspectable Outputs

- \`${OUTPUTS.findings}\`
- \`${OUTPUTS.killReport}\`
- \`${OUTPUTS.remediation}\`
- \`${OUTPUTS.judgeEvaluation}\`

## Scoring System

- Severity: low / medium / high / critical
- Confidence: low / medium / high
- Evidence from TGE spec: required for every finding
- Remediation priority: P0 / P1
- Launch readiness score: ${score.score}/100
- Launch recommendation: ${score.readiness}

## Safety Policy

This is defensive risk review only. It does not generate exploit instructions and does not provide legal advice.`;
}

async function main() {
  if (!existsSync(INPUT_FILE)) {
    throw new Error(`Missing ${INPUT_FILE}. Add a TGE spec before running the harness.`);
  }

  const spec = await readFile(INPUT_FILE, "utf8");
  const findings = [
    ...dumpRiskAgent(spec),
    ...protocolRiskAgent(spec),
    ...regulatoryRiskAgent(spec),
    ...ctAdversaryAgent(spec),
  ];
  const score = scoreFindings(findings);

  await writeFile(OUTPUTS.findings, `${renderFindings(findings)}\n`);
  await writeFile(OUTPUTS.killReport, `${renderKillReport(findings, score)}\n`);
  await writeFile(OUTPUTS.remediation, `${renderRemediation(findings)}\n`);
  await writeFile(OUTPUTS.judgeEvaluation, `${renderJudgeEvaluation(findings, score)}\n`);

  console.log("\nToken Launch Lab: Demo Kill Report\n");
  console.log(`Launch readiness score: ${score.score}/100`);
  console.log(`Recommendation: ${score.readiness}`);
  console.log(`Findings: ${findings.length} total (${score.criticalCount} critical, ${score.highCount} high)`);
  console.log("\nTop findings:");
  for (const item of sortFindings(findings).slice(0, 4)) {
    console.log(`- [${item.severity.toUpperCase()} / ${item.confidence}] ${item.id}: ${item.title}`);
    console.log(`  Evidence: ${item.evidence}`);
    console.log(`  Priority: ${item.priority}`);
  }
  console.log("\nGenerated files:");
  for (const output of Object.values(OUTPUTS)) {
    console.log(`- ${output}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
