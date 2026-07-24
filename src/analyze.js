import { PDFParse } from "pdf-parse";

// GLM (Zhipu AI) OpenAI-compatible chat completions endpoint.
const GLM_BASE_URL =
  process.env.GLM_BASE_URL || "https://open.bigmodel.cn/api/paas/v4/chat/completions";
const GLM_MODEL = process.env.GLM_MODEL || "glm-4.6";

// The four adversarial lenses map to the outputs/*.md files the existing UI
// already knows how to render in the War Room view.
const AGENT_FILES = {
  "Dump Risk Agent": "outputs/dump-risk.md",
  "Protocol Risk Agent": "outputs/protocol-risk.md",
  "Regulatory Risk Agent": "outputs/regulatory-risk.md",
  "CT Adversary Agent": "outputs/ct-adversary.md",
};

const SYSTEM_PROMPT = `You are Token Launch Lab, an adversarial pre-mortem harness for crypto founders preparing a token generation event (TGE). A founder has uploaded a whitepaper, tokenomics doc, or TGE spec. Your job is to find what could kill the launch BEFORE the market does, reading only the document provided.

You run four adversarial lenses. Assign every finding to exactly one:
- "Dump Risk Agent" (Markets): unlock pressure, insider/investor supply overhang, market-maker optics, thin initial float, listing/timing dynamics.
- "Protocol Risk Agent" (Protocol): audit status, emergency pause/authority, multisig and treasury control, upgradeability, launch-readiness of contracts.
- "Regulatory Risk Agent" (Counsel): sale/distribution mechanics, eligibility and jurisdiction exposure, security-likeness of the token, marketing/communications risk.
- "CT Adversary Agent" (Narrative — how Crypto Twitter will react): the harshest credible public-market narrative — points-farm optics, unsubstantiated claims, mismatch between promise and mechanics.

Rules for every finding:
- "evidence" MUST be a short, near-verbatim quote or tightly paraphrased fact taken FROM THE DOCUMENT. Never invent numbers the document does not state; if a critical fact is absent, that absence can itself be the finding (say "document does not specify ...").
- "severity": low | medium | high | critical. "confidence": low | medium | high.
- "priority": P0 (must fix before announcing), P1 (fix before the gated stage), P2 (monitor).
- "remediation": a concrete DEFENSIVE fix the founder can act on.
- IDs use the lens prefix + number: DUMP-001, PROTO-001, REG-001, NARR-001 (for the CT/Narrative agent), etc.

Safety boundaries (hard):
- Defensive review only. No exploit instructions, attack payloads, or step-by-step ways to harm the protocol or its users.
- You are not a lawyer. Do NOT give legal advice or legal conclusions; frame regulatory items as risks to review with qualified counsel.

Return between 4 and 12 findings covering all four lenses where the document gives you material. Be specific and grounded — a founder is going to make a go/no-go decision from this.

launchReadiness.score is 0-100 (higher = safer to launch). recommendation is "NO-GO" if any P0/critical blocker is unresolved, "CONDITIONAL" if launch is viable only with explicit mitigations, "GO" if ready with monitoring.

OUTPUT FORMAT — respond with ONLY a single JSON object (no markdown, no prose) with EXACTLY these keys:
{
  "projectName": string,
  "category": string,
  "tagline": string,
  "initialFloat": string,
  "investorUnlock": string,
  "liquidity": string,
  "founderConcerns": string[],
  "launchReadiness": { "score": number, "recommendation": "GO"|"CONDITIONAL"|"NO-GO", "rationale": string },
  "findings": [
    {
      "id": string,
      "risk": string,
      "agent": "Dump Risk Agent"|"Protocol Risk Agent"|"Regulatory Risk Agent"|"CT Adversary Agent",
      "severity": "low"|"medium"|"high"|"critical",
      "confidence": "low"|"medium"|"high",
      "evidence": string,
      "impact": string,
      "priority": "P0"|"P1"|"P2",
      "remediation": string
    }
  ]
}
Use "" or [] for facts the document does not state. Do not add keys that are not listed.`;

async function extractText({ kind, data }) {
  if (kind === "pdf") {
    const buffer = Buffer.from(data, "base64");
    const parser = new PDFParse({ data: new Uint8Array(buffer) });
    try {
      const result = await parser.getText();
      return (result.text || "").trim();
    } finally {
      await parser.destroy?.();
    }
  }
  return String(data);
}

function parseJsonLoose(text) {
  let t = String(text).trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1].trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

function severityCounts(findings) {
  return findings.reduce(
    (counts, f) => {
      const key = ["critical", "high", "medium", "low"].includes(f.severity)
        ? f.severity
        : "low";
      counts[key] += 1;
      return counts;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
}

// Map the model's structured result into the payload shape the existing
// web/app.js dashboard already renders (same shape as /api/report).
function shapeReport(result, meta) {
  const findings = Array.isArray(result.findings) ? result.findings : [];
  const counts = severityCounts(findings);
  const readiness = result.launchReadiness ?? {};
  const sourceDoc =
    meta.kind === "pdf"
      ? `Uploaded PDF: ${meta.filename || "document.pdf"}\n\n--- Extracted text ---\n${meta.text || ""}`
      : meta.text;

  const reports = Object.entries(AGENT_FILES).map(([agent, file]) => ({
    agent,
    status: "PASS",
    file,
  }));

  return {
    project: {
      name: "Token Launch Lab",
      subject: `${result.projectName || "Uploaded project"} TGE`,
      track: "Founder launch pre-mortem",
      tagline:
        result.tagline ||
        "AI-generated adversarial risk report from an uploaded launch document.",
      generatedAt: new Date().toISOString(),
      source: meta.filename || "pasted document",
    },
    specFacts: {
      projectName: result.projectName || "",
      category: result.category || "",
      launchGoal: "",
      initialFloat: result.initialFloat || "",
      investorUnlock: result.investorUnlock || "",
      liquidity: result.liquidity || "",
      founderConcerns: Array.isArray(result.founderConcerns) ? result.founderConcerns : [],
      distribution: [],
    },
    launchReadiness: {
      score: Number(readiness.score) || 0,
      recommendation: readiness.recommendation || "UNKNOWN",
      rationale: readiness.rationale || "",
      critical: counts.critical,
      high: counts.high,
      revisions: 0,
    },
    judge: {
      validFindings: findings.length,
      revisionReports: 0,
      score: String(readiness.score ?? ""),
      recommendation: readiness.recommendation || "UNKNOWN",
      reports,
    },
    findings,
    docs: {
      tgeSpec: sourceDoc,
      killReport: renderKillReport(result, findings),
      remediation: renderRemediation(findings),
      dumpRisk: "",
      protocolRisk: "",
      regulatoryRisk: "",
      ctAdversary: "",
      judgeEvaluation: "",
      agents: "",
      codexGoal: "",
    },
    runOutput: null,
    generated: true,
    engine: `GLM (${GLM_MODEL})`,
  };
}

function renderKillReport(result, findings) {
  const readiness = result.launchReadiness ?? {};
  const lines = [
    `# Kill Report: ${result.projectName || "Uploaded project"}`,
    "",
    `- Score: ${readiness.score ?? "N/A"}/100`,
    `- Recommendation: ${readiness.recommendation ?? "UNKNOWN"}`,
    `- Rationale: ${readiness.rationale ?? ""}`,
    "",
  ];
  findings.forEach((f, i) => {
    lines.push(`### ${i + 1}. ${f.id}: ${f.risk}`);
    lines.push(`- Agent: ${f.agent}`);
    lines.push(`- Severity: ${f.severity}`);
    lines.push(`- Confidence: ${f.confidence}`);
    lines.push(`- Evidence: ${f.evidence}`);
    lines.push(`- Why it matters: ${f.impact}`);
    lines.push(`- Remediation priority: ${f.priority}`);
    lines.push(`- Remediation: ${f.remediation}`);
    lines.push("");
  });
  return lines.join("\n");
}

function renderRemediation(findings) {
  const byPriority = (p) => findings.filter((f) => f.priority === p);
  const section = (title, items) =>
    [`## ${title}`, "", ...items.map((f) => `- ${f.id}: ${f.remediation}`), ""].join("\n");
  return [
    "# Remediation Plan",
    "",
    section("P0 — before announcing", byPriority("P0")),
    section("P1 — before the gated stage", byPriority("P1")),
    section("P2 — monitor", byPriority("P2")),
  ].join("\n");
}

async function callGlm({ apiKey, text, filename }) {
  const response = await fetch(GLM_BASE_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: GLM_MODEL,
      temperature: 0.6,
      max_tokens: 16000,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Analyze this token launch document${
            filename ? ` ("${filename}")` : ""
          } and return the risk report JSON.\n\n--- BEGIN DOCUMENT ---\n${text}\n--- END DOCUMENT ---`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    const err = new Error(
      response.status === 401
        ? "GLM rejected the API key (401). Check the key and try again."
        : `GLM request failed (${response.status}). ${detail.slice(0, 300)}`,
    );
    err.status = response.status === 401 ? 401 : 502;
    throw err;
  }

  const json = await response.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) {
    const err = new Error("GLM returned no content.");
    err.status = 502;
    throw err;
  }
  return content;
}

// Analyze an uploaded document and return the dashboard-ready report payload.
export async function analyzeDocument({ kind, data, filename }) {
  const key = (process.env.GLM_API_KEY || "").trim();
  if (!key) {
    const err = new Error(
      "Analysis is not configured. Set GLM_API_KEY in the server environment and restart.",
    );
    err.status = 503;
    throw err;
  }

  if (!data || (kind !== "pdf" && !String(data).trim())) {
    const err = new Error("No document content was provided.");
    err.status = 400;
    throw err;
  }

  const text = await extractText({ kind, data });
  if (!text.trim()) {
    const err = new Error(
      "Could not read any text from the document. If it's a scanned PDF, paste the text instead.",
    );
    err.status = 422;
    throw err;
  }

  const content = await callGlm({ apiKey: key, text, filename });

  let result;
  try {
    result = parseJsonLoose(content);
  } catch {
    const err = new Error("Could not parse GLM's JSON output. Try again.");
    err.status = 502;
    throw err;
  }

  return shapeReport(result, { kind, filename, text });
}
