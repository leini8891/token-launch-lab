import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";

const SPEC_FILE = "tge-spec.md";
const OUTPUT_DIR = "outputs";

const AGENT_REPORTS = [
  { agent: "Dump Risk Agent", file: "outputs/dump-risk.md" },
  { agent: "Protocol Risk Agent", file: "outputs/protocol-risk.md" },
  { agent: "Regulatory Risk Agent", file: "outputs/regulatory-risk.md" },
  { agent: "CT Adversary Agent", file: "outputs/ct-adversary.md" },
];

const GENERATED_OUTPUTS = {
  killReport: "outputs/kill-report.md",
  remediation: "outputs/remediation.md",
  judgeEvaluation: "outputs/judge-evaluation.md",
};

const REQUIRED_FIELDS = [
  "Specific risk",
  "Severity",
  "Confidence",
  "Evidence from tge-spec.md",
  "Why it matters",
  "Remediation",
  "Remediation priority",
];

const SEVERITY_WEIGHT = {
  low: 2,
  medium: 5,
  high: 12,
  critical: 20,
};

const SEVERITY_RANK = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
};

const CONFIDENCE_RANK = {
  low: 1,
  medium: 2,
  high: 3,
};

const SAFETY_BLOCKLIST = [
  "exploit code",
  "attack payload",
  "step-by-step exploit",
  "bypass signature",
  "steal funds",
  "drain funds",
  "legal advice:",
  "this is legally compliant",
];

function normalize(value) {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function stripQuotes(value) {
  const trimmed = value.trim();
  const first = trimmed.at(0);
  const last = trimmed.at(-1);
  if (trimmed.length >= 2 && first === last && ["\"", "'", "`"].includes(first)) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

async function readText(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFile(filePath, "utf8");
}

function splitFindings(markdown) {
  const matches = [...markdown.matchAll(/^##\s+Finding\s+([A-Z]+-\d{3})[^\n]*\n/gm)];
  if (matches.length === 0) {
    return [{ id: "UNKNOWN", body: markdown }];
  }

  return matches.map((match, index) => {
    const start = match.index ?? 0;
    const end = matches[index + 1]?.index ?? markdown.length;
    return {
      id: match[1],
      body: markdown.slice(start, end),
    };
  });
}

function extractField(markdown, fieldName) {
  const escaped = fieldName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`^-\\s*(?:\\*\\*)?${escaped}(?:\\*\\*)?\\s*:\\s*(.+)$`, "im");
  return markdown.match(pattern)?.[1]?.trim() ?? "";
}

function validateFinding(report, finding, specText) {
  const fields = Object.fromEntries(
    REQUIRED_FIELDS.map((field) => [field, extractField(finding.body, field)]),
  );
  const missingFields = REQUIRED_FIELDS.filter((field) => fields[field].length === 0);
  const problems = [...missingFields.map((field) => `missing field: ${field}`)];

  const severity = normalize(fields["Severity"]);
  const confidence = normalize(fields["Confidence"]);
  const evidence = stripQuotes(fields["Evidence from tge-spec.md"]);

  if (fields["Severity"] && !(severity in SEVERITY_WEIGHT)) {
    problems.push(`invalid severity: ${fields["Severity"]}`);
  }

  if (fields["Confidence"] && !(confidence in CONFIDENCE_RANK)) {
    problems.push(`invalid confidence: ${fields["Confidence"]}`);
  }

  if (evidence && !normalize(specText).includes(normalize(evidence))) {
    problems.push("evidence is not an exact quote from tge-spec.md");
  }

  const unsafeTerm = SAFETY_BLOCKLIST.find((term) => normalize(finding.body).includes(term));
  if (unsafeTerm) {
    problems.push(`safety boundary violation: ${unsafeTerm}`);
  }

  return {
    id: finding.id,
    agent: report.agent,
    file: report.file,
    fields,
    severity,
    confidence,
    passed: problems.length === 0,
    problems,
  };
}

function validateReport(report, markdown, specText) {
  const findings = splitFindings(markdown).map((finding) =>
    validateFinding(report, finding, specText),
  );
  return {
    ...report,
    findings,
    passed: findings.every((finding) => finding.passed),
    missingFields: findings.flatMap((finding) =>
      finding.problems.map((problem) => `${finding.id}: ${problem}`),
    ),
  };
}

function sortFindings(findings) {
  return [...findings].sort((a, b) => {
    const severityDelta = SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity];
    if (severityDelta !== 0) return severityDelta;
    return CONFIDENCE_RANK[b.confidence] - CONFIDENCE_RANK[a.confidence];
  });
}

function scoreFindings(findings) {
  const penalty = findings.reduce(
    (sum, finding) => sum + (SEVERITY_WEIGHT[finding.severity] ?? 0),
    0,
  );
  const criticalCount = findings.filter((finding) => finding.severity === "critical").length;
  const highCount = findings.filter((finding) => finding.severity === "high").length;
  const score = Math.max(0, 100 - penalty);
  const readiness =
    criticalCount > 0
      ? "NO-GO"
      : highCount >= 2
        ? "CONDITIONAL"
        : score >= 75
          ? "READY WITH MONITORING"
          : "CONDITIONAL";

  return { score, readiness, penalty, criticalCount, highCount };
}

function renderFinding(finding, index) {
  return `### ${index + 1}. ${finding.id}: ${finding.fields["Specific risk"]}

- Agent: ${finding.agent}
- Severity: ${finding.fields["Severity"]}
- Confidence: ${finding.fields["Confidence"]}
- Evidence from tge-spec.md: ${stripQuotes(finding.fields["Evidence from tge-spec.md"])}
- Why it matters: ${finding.fields["Why it matters"]}
- Remediation priority: ${finding.fields["Remediation priority"]}
- Remediation: ${finding.fields["Remediation"]}`;
}

function renderKillReport(validFindings, score, revisionReports) {
  const sorted = sortFindings(validFindings);
  return `# Kill Report

Generated by the Judge Agent / Orchestrator after verifying Codex-authored agent markdown files.

## Launch Readiness

- Score: ${score.score}/100
- Recommendation: ${score.readiness}
- Critical findings: ${score.criticalCount}
- High findings: ${score.highCount}
- Reports requiring revision: ${revisionReports.length}

## Top Failure Modes

${sorted.slice(0, 6).map(renderFinding).join("\n\n")}

## Termination Criteria

The orchestrator terminates only after every required agent report exists and every finding has the required schema: specific risk, severity, confidence, evidence from \`tge-spec.md\`, why it matters, remediation, and remediation priority.

## Safety Boundaries

- Defensive review only.
- No exploit instructions are generated.
- No legal advice is provided.`;
}

function renderRemediation(validFindings, revisionReports) {
  const sorted = sortFindings(validFindings);
  const p0 = sorted.filter((finding) => finding.fields["Remediation priority"].startsWith("P0"));
  const p1 = sorted.filter((finding) => finding.fields["Remediation priority"].startsWith("P1"));

  return `# Remediation

## Recovery / Revision Loop

${revisionReports.length === 0 ? "- No report revisions required." : revisionReports.map((report) => `- Revise ${report.file}: ${report.missingFields.join("; ")}`).join("\n")}

## P0: Fix Before Mainnet, Listing, Or Public Campaigns

${p0.map((finding) => `- ${finding.id}: ${finding.fields["Remediation"]}`).join("\n")}

## P1: Fix Before Public Launch Materials

${p1.map((finding) => `- ${finding.id}: ${finding.fields["Remediation"]}`).join("\n")}

## Re-run Command

\`\`\`bash
node src/orchestrator.js
\`\`\``;
}

function renderJudgeEvaluation(reportResults, validFindings, score, revisionReports) {
  return `# Judge Evaluation

## Harness / Skills Track Fit

Token Launch Lab is a Codex-backed adversarial agent harness. Codex is given \`codex-goal.md\` as the /goal prompt, reads \`AGENTS.md\`, writes per-agent markdown memory under \`outputs/\`, and then the local Judge Agent verifies the outputs.

## Codex Integration

- Codex goal prompt: \`codex-goal.md\`
- Agent operating rules: \`AGENTS.md\`
- Shared launch spec: \`tge-spec.md\`
- Inspectable markdown memory: \`outputs/*.md\`
- Verification script: \`src/orchestrator.js\`

## Multi-Agent Reports

${reportResults.map((report) => `- ${report.agent}: ${report.passed ? "PASS" : "NEEDS REVISION"} (${report.file})`).join("\n")}

## Verification

- Valid findings: ${validFindings.length}
- Reports needing revision: ${revisionReports.length}
- Final launch readiness score: ${score.score}/100
- Recommendation: ${score.readiness}

## Termination Criteria

The run terminates when all agent reports pass schema and safety verification. If any report fails, the orchestrator prints missing fields and the revision loop sends only failed files back to Codex for repair.

## Safety Policy

Defensive review only. No exploit instructions. No legal advice.`;
}

async function main() {
  const specText = await readText(SPEC_FILE);
  if (!specText) {
    throw new Error(`Missing ${SPEC_FILE}`);
  }

  const reportResults = [];
  for (const report of AGENT_REPORTS) {
    const markdown = await readText(report.file);
    if (!markdown) {
      reportResults.push({
        ...report,
        findings: [],
        passed: false,
        missingFields: [`missing report file: ${report.file}`],
      });
      continue;
    }
    reportResults.push(validateReport(report, markdown, specText));
  }

  const validFindings = reportResults
    .flatMap((report) => report.findings)
    .filter((finding) => finding.passed);
  const revisionReports = reportResults.filter((report) => !report.passed);
  const score = scoreFindings(validFindings);

  await mkdir(OUTPUT_DIR, { recursive: true });
  await writeFile(GENERATED_OUTPUTS.killReport, `${renderKillReport(validFindings, score, revisionReports)}\n`);
  await writeFile(GENERATED_OUTPUTS.remediation, `${renderRemediation(validFindings, revisionReports)}\n`);
  await writeFile(
    GENERATED_OUTPUTS.judgeEvaluation,
    `${renderJudgeEvaluation(reportResults, validFindings, score, revisionReports)}\n`,
  );

  console.log("\nToken Launch Lab: Codex Harness Verification\n");
  for (const report of reportResults) {
    console.log(`${report.passed ? "PASS" : "REVISION"} ${report.agent} (${report.file})`);
    if (!report.passed) {
      for (const problem of report.missingFields) {
        console.log(`  - ${problem}`);
      }
    }
  }

  console.log("\nFinal Kill Report");
  console.log(`- Launch readiness score: ${score.score}/100`);
  console.log(`- Recommendation: ${score.readiness}`);
  console.log(`- Valid findings: ${validFindings.length}`);
  console.log(`- Reports needing revision: ${revisionReports.length}`);
  console.log("\nGenerated / updated:");
  for (const output of Object.values(GENERATED_OUTPUTS)) {
    console.log(`- ${output}`);
  }

  if (revisionReports.length > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
