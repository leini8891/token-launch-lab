import "./env.js"; // must be first: loads .env before other modules read process.env
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeDocument } from "./analyze.js";

const MAX_UPLOAD_BYTES = 40 * 1024 * 1024; // 40MB request cap (PDF base64 inflates ~33%)

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > MAX_UPLOAD_BYTES) {
        reject(Object.assign(new Error("Document is too large (max 40MB)."), { status: 413 }));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(Object.assign(new Error("Invalid request body."), { status: 400 }));
      }
    });
    req.on("error", reject);
  });
}

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");
const WEB_ROOT = path.join(ROOT, "web");
const REPORTS_DIR = path.join(ROOT, "reports");
const PORT = Number(process.env.PORT ?? 3000);

// Persist a generated report so it can be re-opened via a shareable /?r=<id> link.
async function saveReport(payload) {
  await mkdir(REPORTS_DIR, { recursive: true });
  const id = randomBytes(9).toString("base64url"); // 12-char url-safe id
  payload.id = id;
  await writeFile(path.join(REPORTS_DIR, `${id}.json`), JSON.stringify(payload), "utf8");
  return id;
}

async function loadReport(id) {
  if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) return null; // guard against path traversal
  const file = path.join(REPORTS_DIR, `${id}.json`);
  if (!existsSync(file)) return null;
  return JSON.parse(await readFile(file, "utf8"));
}

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

const DOC_FILES = {
  codexGoal: "codex-goal.md",
  agents: "AGENTS.md",
  tgeSpec: "tge-spec.md",
  killReport: "outputs/kill-report.md",
  remediation: "outputs/remediation.md",
  judgeEvaluation: "outputs/judge-evaluation.md",
  dumpRisk: "outputs/dump-risk.md",
  protocolRisk: "outputs/protocol-risk.md",
  regulatoryRisk: "outputs/regulatory-risk.md",
  ctAdversary: "outputs/ct-adversary.md",
};

function send(res, statusCode, body, contentType = "text/plain; charset=utf-8") {
  res.writeHead(statusCode, {
    "content-type": contentType,
    "cache-control": "no-store",
  });
  res.end(body);
}

function sendJson(res, value, statusCode = 200) {
  send(res, statusCode, JSON.stringify(value, null, 2), MIME_TYPES[".json"]);
}

async function readRepoFile(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  if (!existsSync(fullPath)) return "";
  return readFile(fullPath, "utf8");
}

function parseLineValue(markdown, label) {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = markdown.match(new RegExp(`^- ${escaped}:\\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
}

function parseFindings(killReport) {
  const matches = [
    ...killReport.matchAll(/^###\s+\d+\.\s+([^:]+):\s+(.+)\n([\s\S]*?)(?=\n###\s+\d+\.|\n##\s+|(?![\s\S]))/gm),
  ];
  return matches.map((match) => {
    const body = match[3];
    return {
      id: match[1].trim(),
      risk: match[2].trim(),
      agent: parseLineValue(body, "Agent"),
      severity: parseLineValue(body, "Severity").toLowerCase(),
      confidence: parseLineValue(body, "Confidence").toLowerCase(),
      evidence: parseLineValue(body, "Evidence from tge-spec.md"),
      impact: parseLineValue(body, "Why it matters"),
      priority: parseLineValue(body, "Remediation priority"),
      remediation: parseLineValue(body, "Remediation"),
    };
  });
}

function parseSpecFacts(specText) {
  const lineValue = (label) => specText.match(new RegExp(`^${label}:\\s*(.+)$`, "im"))?.[1]?.trim() ?? "";
  const bulletValue = (label) => specText.match(new RegExp(`^- ${label}:\\s*(.+)$`, "im"))?.[1]?.trim() ?? "";
  const sectionBullets = (heading) => {
    const match = specText.match(new RegExp(`## ${heading}\\n\\n([\\s\\S]*?)(?=\\n## |$)`, "i"));
    if (!match) return [];
    return match[1]
      .split("\n")
      .map((line) => line.replace(/^- /, "").trim())
      .filter(Boolean);
  };

  return {
    projectName: lineValue("Name"),
    category: lineValue("Category"),
    launchGoal: specText.match(/## Launch Goal\n\n([\s\S]*?)(?=\n## |$)/i)?.[1]?.trim() ?? "",
    totalSupply: lineValue("Total supply"),
    initialFloat: lineValue("Initial circulating supply at TGE"),
    teamUnlock: bulletValue("Team"),
    investorUnlock: bulletValue("Investors"),
    communityIncentives: bulletValue("Community incentives"),
    treasuryControl: bulletValue("Treasury"),
    liquidity: bulletValue("Liquidity and market making"),
    auditStatus: specText.match(/^- External audit .+$/im)?.[0]?.replace(/^- /, "") ?? "",
    pauseStatus: specText.match(/^- Emergency pause .+$/im)?.[0]?.replace(/^- /, "") ?? "",
    distribution: sectionBullets("Distribution"),
    founderConcerns: sectionBullets("Known Concerns From Founder"),
  };
}

function parseJudge(judgeEvaluation) {
  const reports = [...judgeEvaluation.matchAll(/^- (.+?):\s+(PASS|REVISION)(?:\s+\((.+?)\))?/gim)].map(
    (match) => ({
      agent: match[1].trim(),
      status: match[2].toUpperCase(),
      file: match[3] ?? "",
    }),
  );

  return {
    validFindings: Number(parseLineValue(judgeEvaluation, "Valid findings")) || 0,
    revisionReports: Number(parseLineValue(judgeEvaluation, "Reports needing revision")) || 0,
    score: parseLineValue(judgeEvaluation, "Final launch readiness score"),
    recommendation: parseLineValue(judgeEvaluation, "Recommendation"),
    reports,
  };
}

function firstNonEmptyLines(markdown, limit = 10) {
  return markdown
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .slice(0, limit)
    .join("\n");
}

async function buildReportPayload(runOutput = null) {
  const docs = Object.fromEntries(
    await Promise.all(
      Object.entries(DOC_FILES).map(async ([key, file]) => [key, await readRepoFile(file)]),
    ),
  );
  const killReport = docs.killReport;
  const judge = parseJudge(docs.judgeEvaluation);
  const findings = parseFindings(killReport);
  const specFacts = parseSpecFacts(docs.tgeSpec);

  return {
    project: {
      name: "Token Launch Lab",
      subject: `${specFacts.projectName || "HarborUSD"} TGE`,
      track: "Founder launch pre-mortem",
      tagline: "A Codex-backed adversarial harness that turns a token launch spec into verified blockers, evidence, and founder-ready remediation.",
      generatedAt: new Date().toISOString(),
    },
    specFacts,
    launchReadiness: {
      score: Number(killReport.match(/- Score:\s+(\d+)\/100/i)?.[1] ?? 0),
      recommendation: killReport.match(/- Recommendation:\s+(.+)/i)?.[1]?.trim() ?? "UNKNOWN",
      critical: Number(killReport.match(/- Critical findings:\s+(\d+)/i)?.[1] ?? 0),
      high: Number(killReport.match(/- High findings:\s+(\d+)/i)?.[1] ?? 0),
      revisions: Number(killReport.match(/- Reports requiring revision:\s+(\d+)/i)?.[1] ?? 0),
    },
    judge,
    findings,
    excerpts: {
      codexGoal: firstNonEmptyLines(docs.codexGoal, 20),
      tgeSpec: firstNonEmptyLines(docs.tgeSpec, 22),
      agents: firstNonEmptyLines(docs.agents, 18),
      remediation: firstNonEmptyLines(docs.remediation, 18),
    },
    docs,
    runOutput,
  };
}

function runOrchestrator() {
  return new Promise((resolve) => {
    execFile(process.execPath, ["src/orchestrator.js"], { cwd: ROOT, timeout: 15000 }, (error, stdout, stderr) => {
      resolve({
        ok: !error,
        code: error?.code ?? 0,
        stdout,
        stderr,
      });
    });
  });
}

async function serveStatic(req, res) {
  const requestUrl = new URL(req.url, `http://${req.headers.host}`);
  const routePath = requestUrl.pathname === "/" ? "/index.html" : requestUrl.pathname;
  const safePath = path.normalize(routePath).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(WEB_ROOT, safePath);
  if (!fullPath.startsWith(WEB_ROOT) || !existsSync(fullPath)) {
    send(res, 404, "Not found");
    return;
  }

  const ext = path.extname(fullPath);
  send(res, 200, await readFile(fullPath), MIME_TYPES[ext] ?? "application/octet-stream");
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "GET" && req.url?.startsWith("/api/report")) {
      sendJson(res, await buildReportPayload());
      return;
    }

    if (req.method === "POST" && req.url?.startsWith("/api/run")) {
      const runOutput = await runOrchestrator();
      sendJson(res, await buildReportPayload(runOutput), runOutput.ok ? 200 : 422);
      return;
    }

    if (req.method === "GET" && req.url?.startsWith("/api/r/")) {
      const id = decodeURIComponent(new URL(req.url, `http://${req.headers.host}`).pathname.slice("/api/r/".length));
      const report = await loadReport(id);
      if (!report) {
        sendJson(res, { error: "Report not found or expired." }, 404);
        return;
      }
      sendJson(res, report);
      return;
    }

    if (req.method === "POST" && req.url?.startsWith("/api/analyze")) {
      let body;
      try {
        body = await readJsonBody(req);
      } catch (error) {
        sendJson(res, { error: error.message }, error.status ?? 400);
        return;
      }
      const kind = body.kind === "pdf" ? "pdf" : "text";
      try {
        const payload = await analyzeDocument({
          kind,
          data: body.data ?? "",
          filename: body.filename ?? "",
        });
        try {
          await saveReport(payload); // sets payload.id; enables the share link
        } catch {
          // Storage is best-effort — the report still returns without a share id.
        }
        sendJson(res, payload);
      } catch (error) {
        const rawMessage = error instanceof Error ? error.message : String(error);
        const status = error?.status ?? 500;
        sendJson(res, { error: rawMessage }, status);
      }
      return;
    }

    if (req.method === "GET") {
      await serveStatic(req, res);
      return;
    }

    send(res, 405, "Method not allowed");
  } catch (error) {
    sendJson(res, { error: error instanceof Error ? error.message : String(error) }, 500);
  }
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`Token Launch Lab demo UI: http://127.0.0.1:${PORT}`);
});
