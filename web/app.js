const agentRoles = [
  {
    name: "Dump Risk Agent",
    file: "outputs/dump-risk.md",
    owner: "Markets",
    question: "Will unlocks or MM inventory become the launch story?",
    focus: "Unlock pressure, insider supply, market-maker optics, and listing timing.",
  },
  {
    name: "Protocol Risk Agent",
    file: "outputs/protocol-risk.md",
    owner: "Protocol",
    question: "Can the team defend the system when launch pressure hits?",
    focus: "Audit timing, pause authority, multisig operations, and launch readiness.",
  },
  {
    name: "Regulatory Risk Agent",
    file: "outputs/regulatory-risk.md",
    owner: "Counsel",
    question: "Are sale, eligibility, and campaign mechanics ready for review?",
    focus: "Distribution mechanics, sale design, jurisdiction exposure, and communications.",
  },
  {
    name: "Narrative Adversary (Crypto Twitter)",
    file: "outputs/ct-adversary.md",
    owner: "Narrative",
    question: "What will the market dunk on before users see the product?",
    focus: "The harshest credible public-market narrative before the market writes it.",
  },
  {
    name: "Judge Agent",
    file: "src/orchestrator.js",
    owner: "Gatekeeper",
    question: "Did every claim pass schema, evidence, and safety checks?",
    focus: "Schema, evidence, severity, safety boundaries, and termination criteria.",
  },
];

const schemaChecks = [
  ["Specific risk", "Required"],
  ["Severity", "low / medium / high / critical"],
  ["Confidence", "low / medium / high"],
  ["Evidence", "Exact quote from tge-spec.md"],
  ["Remediation", "Defensive fix"],
  ["Safety", "No exploit instructions or legal advice"],
];

const views = [
  ["findings", "Blockers"],
  ["agents", "War Room"],
  ["evidence", "Evidence"],
  ["run", "Judge"],
];

// The four adversarial lenses, used for the per-agent risk summary row.
const riskLenses = [
  { name: "Dump Risk Agent", label: "Dump risk", blurb: "Unlocks & sell pressure" },
  { name: "Protocol Risk Agent", label: "Protocol risk", blurb: "Audit, multisig, pause" },
  { name: "Regulatory Risk Agent", label: "Regulatory risk", blurb: "Sale & jurisdiction" },
  { name: "CT Adversary Agent", label: "Narrative risk", blurb: "How Crypto Twitter reacts" },
];

const severityOrder = ["low", "medium", "high", "critical"];

let state = {
  data: null,
  running: false,
  runStarted: false,
  lastRunAt: null,
  error: null,
  activeView: "findings",
  activeDoc: "tgeSpec",
  selectedFindingId: null,
  // Intake / analysis flow
  view: "intake", // "intake" | "dashboard"
  analyzing: false,
  analyzeError: null,
  intakeText: "",
  pendingFile: null, // { name, kind: "pdf" | "text", data }
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function severityClass(value = "") {
  return ["critical", "high", "medium", "low"].includes(value) ? value : "low";
}

function shortAgent(name = "") {
  const map = {
    "Dump Risk Agent": "Dump",
    "Protocol Risk Agent": "Protocol",
    "Regulatory Risk Agent": "Regulatory",
    "CT Adversary Agent": "Narrative",
  };
  return map[name] || name;
}

function percent(score = 0) {
  return Math.max(0, Math.min(100, Number(score) || 0));
}

function formatStatus(data) {
  if (state.running) return "Judge running";
  if (state.lastRunAt) return `Verified ${state.lastRunAt}`;
  if (data?.generated && data?.launchReadiness?.recommendation) return data.launchReadiness.recommendation;
  if (data?.judge?.revisionReports > 0) return "Needs revision";
  if (data?.launchReadiness?.recommendation) return `${data.launchReadiness.recommendation} verified`;
  return "Dossier loaded";
}

function ensureSelection(data) {
  if (!data?.findings?.length) return;
  const exists = data.findings.some((finding) => finding.id === state.selectedFindingId);
  if (!exists) {
    state.selectedFindingId = data.findings[0].id;
  }
}

function selectedFinding(data) {
  ensureSelection(data);
  return data.findings.find((finding) => finding.id === state.selectedFindingId) ?? data.findings[0];
}

function severityCounts(findings = []) {
  return findings.reduce(
    (counts, finding) => {
      const key = severityClass(finding.severity);
      counts[key] += 1;
      return counts;
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  );
}

function priorityLevel(priority = "") {
  return priority.match(/^P\d/i)?.[0]?.toUpperCase() ?? "P2";
}

function p0Findings(data) {
  return data.findings.filter((finding) => priorityLevel(finding.priority) === "P0");
}

function p1Findings(data) {
  return data.findings.filter((finding) => priorityLevel(finding.priority) === "P1");
}

function readinessCopy(readiness) {
  if (readiness.recommendation === "NO-GO") return "Do not announce until P0 gates clear";
  if (readiness.recommendation === "CONDITIONAL") return "Launch only with explicit mitigations";
  return "Ready with monitoring and evidence pack";
}

function shortText(value = "", max = 84) {
  if (value.length <= max) return value;
  return `${value.slice(0, max - 1).trim()}...`;
}

function docSources(data) {
  return [
    ["tgeSpec", "TGE Spec", "tge-spec.md", data.docs.tgeSpec],
    ["dumpRisk", "Dump Risk", "outputs/dump-risk.md", data.docs.dumpRisk],
    ["protocolRisk", "Protocol Risk", "outputs/protocol-risk.md", data.docs.protocolRisk],
    ["regulatoryRisk", "Regulatory Risk", "outputs/regulatory-risk.md", data.docs.regulatoryRisk],
    ["ctAdversary", "CT Adversary", "outputs/ct-adversary.md", data.docs.ctAdversary],
    ["killReport", "Kill Report", "outputs/kill-report.md", data.docs.killReport],
    ["remediation", "Remediation", "outputs/remediation.md", data.docs.remediation],
    ["judgeEvaluation", "Judge Eval", "outputs/judge-evaluation.md", data.docs.judgeEvaluation],
    ["agents", "Agents", "AGENTS.md", data.docs.agents],
    ["codexGoal", "Codex Goal", "codex-goal.md", data.docs.codexGoal],
  ];
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || json.runOutput?.stderr || "Request failed");
  }
  return json;
}

async function loadReport() {
  try {
    const data = await fetchJson("/api/report");
    state = { ...state, data, error: null };
    ensureSelection(data);
  } catch (error) {
    state = { ...state, error: error.message };
  }
  render();
}

async function runHarness() {
  state = { ...state, running: true, runStarted: true, error: null, activeView: "run" };
  render();
  try {
    const data = await fetchJson("/api/run", { method: "POST" });
    state = {
      ...state,
      data,
      running: false,
      lastRunAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      error: null,
    };
    ensureSelection(data);
  } catch (error) {
    state = { ...state, running: false, error: error.message };
  }
  render();
}

function readFileAsPending(file) {
  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.onload = () => {
      if (isPdf) {
        const result = String(reader.result);
        const base64 = result.slice(result.indexOf(",") + 1);
        resolve({ name: file.name, kind: "pdf", data: base64 });
      } else {
        resolve({ name: file.name, kind: "text", data: String(reader.result) });
      }
    };
    if (isPdf) reader.readAsDataURL(file);
    else reader.readAsText(file);
  });
}

async function analyze() {
  let source = state.pendingFile;
  if (!source) {
    const text = state.intakeText.trim();
    if (!text) return;
    source = { name: "pasted-document.md", kind: "text", data: state.intakeText };
  }

  state = { ...state, analyzing: true, analyzeError: null };
  render();

  try {
    const data = await fetchJson("/api/analyze", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        kind: source.kind,
        data: source.data,
        filename: source.name,
      }),
    });
    state = {
      ...state,
      data,
      analyzing: false,
      analyzeError: null,
      view: "dashboard",
      activeView: "findings",
      selectedFindingId: null,
      lastRunAt: null,
      runStarted: false,
    };
    ensureSelection(data);
  } catch (error) {
    state = { ...state, analyzing: false, analyzeError: error.message };
  }
  render();
}

function newAnalysis() {
  state = {
    ...state,
    view: "intake",
    data: null,
    analyzeError: null,
    pendingFile: null,
    intakeText: "",
  };
  render();
}

async function loadSample() {
  state = { ...state, analyzing: true, analyzeError: null };
  render();
  try {
    const data = await fetchJson("/api/report");
    state = { ...state, data, analyzing: false, view: "dashboard", activeView: "findings" };
    ensureSelection(data);
  } catch (error) {
    state = { ...state, analyzing: false, analyzeError: error.message };
  }
  render();
}

function renderIntake() {
  const hasInput = Boolean(state.pendingFile) || state.intakeText.trim().length > 0;
  const fileLabel = state.pendingFile
    ? `${escapeHtml(state.pendingFile.name)} ready`
    : "Drop a PDF, Markdown, or text file — or click to browse";

  return `
    <main class="intake-shell">
      <section class="intake-card">
        <div class="intake-head">
          <span class="brand-sigil">TL</span>
          <div>
            <strong>Token Launch Lab</strong>
            <small>Upload a whitepaper or TGE doc → get an adversarial risk report</small>
          </div>
        </div>
        <h1>Know what can kill the TGE before the market does.</h1>
        <p class="intake-lede">Four adversaries — Dump, Protocol, Regulatory, and Narrative (Crypto Twitter) — read your document and return launch blockers, evidence, and founder-ready remediation.</p>

        ${state.analyzeError ? `<div class="banner is-error">Error: ${escapeHtml(state.analyzeError)}</div>` : ""}

        <label class="dropzone ${state.pendingFile ? "has-file" : ""}" for="fileInput">
          <input type="file" id="fileInput" accept=".pdf,.md,.markdown,.txt,text/plain,text/markdown,application/pdf" ${state.analyzing ? "disabled" : ""} />
          <span class="dropzone-icon" aria-hidden="true">${state.pendingFile ? "OK" : "↑"}</span>
          <span class="dropzone-label">${fileLabel}</span>
        </label>

        <div class="intake-or"><span>or paste the document text</span></div>

        <textarea id="intakeText" class="intake-textarea" placeholder="Paste tokenomics, allocation, vesting, distribution, and launch plan..." ${state.analyzing ? "disabled" : ""}>${escapeHtml(state.intakeText)}</textarea>

        <div class="intake-actions">
          <button type="button" class="run-button" id="analyzeBtn" ${state.analyzing || !hasInput ? "disabled" : ""}>
            ${state.analyzing ? "Analyzing…" : "Generate risk report"}
          </button>
          <button type="button" class="link-button" id="sampleBtn" ${state.analyzing ? "disabled" : ""}>View sample (HarborUSD)</button>
        </div>

        ${
          state.analyzing
            ? `<div class="intake-progress">Reading the document and running four adversaries (Dump · Protocol · Regulatory · CT). A full report takes 1–2 minutes — hang tight, this page will update automatically.</div>`
            : `<p class="intake-note">Runs on GLM (Zhipu). Defensive review only — no exploit instructions, no legal advice. Your document text is sent to the GLM API for analysis.</p>`
        }
      </section>
    </main>
  `;
}

function bindIntakeEvents() {
  const fileInput = document.getElementById("fileInput");
  fileInput?.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const pending = await readFileAsPending(file);
      state = { ...state, pendingFile: pending, analyzeError: null };
      render();
    } catch (error) {
      state = { ...state, analyzeError: error.message };
      render();
    }
  });

  const textarea = document.getElementById("intakeText");
  textarea?.addEventListener("input", (event) => {
    // Update value without a full re-render so the caret stays put.
    state.intakeText = event.target.value;
    const btn = document.getElementById("analyzeBtn");
    if (btn) btn.disabled = state.analyzing || !(state.pendingFile || state.intakeText.trim());
  });

  document.getElementById("analyzeBtn")?.addEventListener("click", analyze);
  document.getElementById("sampleBtn")?.addEventListener("click", loadSample);
}

function renderTopbar(data) {
  return `
    <header class="command-bar">
      <div class="brand-block">
        <span class="brand-sigil">TL</span>
        <span>
          <strong>Token Launch Lab</strong>
          <small>${escapeHtml(data.project.track)}</small>
        </span>
      </div>
      <div class="command-actions">
        <span class="status-chip ${state.running ? "is-running" : ""}">${escapeHtml(formatStatus(data))}</span>
        <button class="link-button" type="button" id="newAnalysis" title="Analyze another document">New analysis</button>
        ${
          data.generated
            ? `<button class="link-button" type="button" id="exportPdf" title="Save this report as a PDF">Export PDF</button>
               ${data.id ? `<button class="run-button" type="button" id="shareReport" title="Copy a read-only link to this report">Share</button>` : ""}`
            : `<button class="run-button" type="button" id="runHarness" ${state.running ? "disabled" : ""} title="Run the local judge verifier">
          <span aria-hidden="true">${state.running ? "..." : "RUN"}</span>
          ${state.running ? "Running" : "Run Judge"}
        </button>`
        }
      </div>
    </header>
  `;
}

function renderBanner(data) {
  if (state.running) {
    return `<div class="banner is-running">Re-running the local verifier…</div>`;
  }

  if (state.error) {
    return `<div class="banner is-error">Error: ${escapeHtml(state.error)}</div>`;
  }

  if (state.lastRunAt) {
    return `<div class="banner is-ok">Verification completed at ${escapeHtml(state.lastRunAt)}.</div>`;
  }

  if (data.generated) {
    const p0 = p0Findings(data).length;
    const src = data.project?.source || "your document";
    return `<div class="banner">Report for <strong>${escapeHtml(
      data.specFacts.projectName || "your project",
    )}</strong> — ${data.findings.length} findings, ${p0} P0 blocker${p0 === 1 ? "" : "s"} · from ${escapeHtml(
      src,
    )} via ${escapeHtml(data.engine || "AI")}.</div>`;
  }

  return `<div class="banner">Sample report — HarborUSD (demo data). Upload your own doc with “New analysis”.</div>`;
}

function renderOverview(data) {
  const readiness = data.launchReadiness;
  const score = percent(readiness.score);
  const counts = severityCounts(data.findings);
  const p0Count = p0Findings(data).length;
  const facts = data.specFacts;
  const topConcern = facts.founderConcerns?.[0] ?? "Founder concern not stated";

  return `
    <section class="overview">
      <div class="briefing">
        <div>
          <div class="kicker">${escapeHtml(data.project.subject)} / ${escapeHtml(facts.category || "Token launch")}</div>
          <h1>Know what can kill the TGE before the market does.</h1>
          <p class="lede">${escapeHtml(data.project.tagline)}</p>
        </div>
        <div class="briefing-strip">
          <span><strong>${escapeHtml(facts.initialFloat || "N/A")}</strong><small>Initial float</small></span>
          <span><strong>${escapeHtml(shortText(facts.investorUnlock || "N/A", 36))}</strong><small>Investor unlock</small></span>
          <span><strong>${escapeHtml(shortText(facts.liquidity || "N/A", 36))}</strong><small>TGE liquidity</small></span>
          <span><strong>${escapeHtml(shortText(topConcern, 38))}</strong><small>Founder worry</small></span>
        </div>
      </div>
      <aside class="readiness-panel">
        <div class="panel-label">
          <span>Founder decision</span>
          <strong>${escapeHtml(readiness.recommendation)}</strong>
        </div>
        <div class="score-row">
          <div class="score-ring" style="--score: ${score}">
            <span>${score}</span>
            <small>/100</small>
          </div>
          <div class="score-copy">
            <strong>${escapeHtml(readinessCopy(readiness))}</strong>
            <span>${counts.critical} critical, ${counts.high} high, ${p0Count} P0 fixes</span>
          </div>
        </div>
        <div class="risk-bars" aria-label="Severity counts">
          ${renderRiskBar("critical", counts.critical)}
          ${renderRiskBar("high", counts.high)}
          ${renderRiskBar("medium", counts.medium)}
          ${renderRiskBar("low", counts.low)}
        </div>
      </aside>
    </section>
  `;
}

function renderRiskBar(label, count) {
  return `
    <div class="risk-bar ${label}">
      <span>${escapeHtml(label)}</span>
      <strong>${count}</strong>
    </div>
  `;
}

function renderTopActions(data) {
  const p0 = p0Findings(data);
  if (p0.length === 0) {
    return `
      <section class="fix-first is-clear">
        <div class="fix-first-head">
          <span class="kicker">Before you announce</span>
          <strong>No P0 blockers</strong>
        </div>
        <p class="fix-first-note">Nothing must be fixed before announcing. Work through the P1 items in the blocker queue below before the gated stage.</p>
      </section>
    `;
  }
  return `
    <section class="fix-first">
      <div class="fix-first-head">
        <span class="kicker">Do this before you announce</span>
        <strong>Fix first — ${p0.length} P0 blocker${p0.length === 1 ? "" : "s"}</strong>
      </div>
      <ol class="fix-first-list">
        ${p0
          .map(
            (finding) => `
              <li class="fix-first-item">
                <span class="severity-dot ${severityClass(finding.severity)}"></span>
                <span class="fix-first-body">
                  <strong>${escapeHtml(finding.id)} · ${escapeHtml(finding.risk)}</strong>
                  <span>${escapeHtml(finding.remediation)}</span>
                </span>
                <button type="button" class="fix-first-jump" data-jump-finding="${escapeHtml(finding.id)}">Details</button>
              </li>
            `,
          )
          .join("")}
      </ol>
    </section>
  `;
}

function worstSeverity(findings) {
  return findings.reduce((worst, finding) => {
    const rank = severityOrder.indexOf(severityClass(finding.severity));
    return rank > severityOrder.indexOf(worst) ? severityClass(finding.severity) : worst;
  }, "low");
}

function renderAgentSummary(data) {
  const findings = data.findings ?? [];
  return `
    <section class="metric-grid" aria-label="Risk by adversary">
      ${riskLenses
        .map((lens) => {
          const items = findings.filter((finding) => finding.agent === lens.name);
          const worst = items.length ? worstSeverity(items) : "clear";
          const label = items.length ? worst : "Clear";
          return `
            <article class="metric ${worst}">
              <span>${escapeHtml(lens.label)}</span>
              <strong>${items.length}</strong>
              <small><em class="metric-tag ${worst}">${escapeHtml(label)}</em> · ${escapeHtml(lens.blurb)}</small>
            </article>
          `;
        })
        .join("")}
    </section>
  `;
}

function renderTabs() {
  return `
    <nav class="view-tabs" aria-label="Workspace views">
      ${views
        .map(
          ([id, label], index) => `
            <button type="button" class="tab ${state.activeView === id ? "is-active" : ""}" data-view="${id}">
              <span>${String(index + 1).padStart(2, "0")}</span>
              ${escapeHtml(label)}
            </button>
          `,
        )
        .join("")}
    </nav>
  `;
}

function renderWorkspace(data) {
  const view =
    state.activeView === "agents"
      ? renderAgents(data)
      : state.activeView === "evidence"
        ? renderEvidence(data)
        : state.activeView === "run"
          ? renderRun(data)
          : renderFindings(data);

  return `
    <section class="workspace">
      <div class="workspace-head">
        <div>
          <span class="kicker">Founder operating room</span>
          <h2>${escapeHtml(data.specFacts.projectName || "HarborUSD")} launch blockers</h2>
        </div>
        ${renderTabs()}
      </div>
      ${view}
    </section>
  `;
}

function renderFindings(data) {
  const finding = selectedFinding(data);
  const p0 = p0Findings(data);
  const p1 = p1Findings(data);

  return `
    <div class="finding-board">
      <div class="finding-queue">
        <div class="queue-head">
          <span>Launch blocker queue</span>
          <strong>${data.findings.length} risks</strong>
        </div>
        <div class="finding-list">
          ${data.findings
            .map(
              (item) => `
                <button type="button" class="finding-row ${state.selectedFindingId === item.id ? "is-selected" : ""}" data-finding="${escapeHtml(item.id)}">
                  <span class="severity-dot ${severityClass(item.severity)}"></span>
                  <span>
                    <strong>${escapeHtml(item.id)}</strong>
                    <small>${escapeHtml(shortAgent(item.agent))}</small>
                  </span>
                  <em>${escapeHtml(item.severity)}</em>
                </button>
              `,
            )
            .join("")}
        </div>
      </div>
      <article class="finding-detail">
        <div class="detail-top">
          <span>${escapeHtml(finding.id)} / ${escapeHtml(shortAgent(finding.agent))} / ${escapeHtml(priorityLevel(finding.priority))}</span>
          <strong class="severity ${severityClass(finding.severity)}">${escapeHtml(finding.severity)}</strong>
        </div>
        <h3>${escapeHtml(finding.risk)}</h3>
        <blockquote>${escapeHtml(finding.evidence)}</blockquote>
        <dl class="detail-grid">
          <div><dt>Confidence</dt><dd>${escapeHtml(finding.confidence)}</dd></div>
          <div><dt>Founder gate</dt><dd>${escapeHtml(finding.priority)}</dd></div>
          <div><dt>Why it matters</dt><dd>${escapeHtml(finding.impact)}</dd></div>
          <div><dt>Remediation</dt><dd>${escapeHtml(finding.remediation)}</dd></div>
        </dl>
      </article>
      <aside class="remediation-rail">
        <div class="rail-block">
          <span>P0 founder actions</span>
          ${renderRailItems(p0)}
        </div>
        <div class="rail-block">
          <span>P1 launch materials</span>
          ${renderRailItems(p1)}
        </div>
      </aside>
    </div>
  `;
}

function renderRailItems(items) {
  if (items.length === 0) return `<p class="empty">Clear</p>`;
  return `
    <ul>
      ${items.map((item) => `<li><strong>${escapeHtml(item.id)}</strong>${escapeHtml(item.remediation)}</li>`).join("")}
    </ul>
  `;
}

function renderAgents(data) {
  const reportStatus = new Map(data.judge.reports.map((report) => [report.file, report.status]));
  return `
    <div class="agent-board">
      ${agentRoles
        .map((agent, index) => {
          const status = reportStatus.get(agent.file) || "PASS";
          return `
            <article class="agent-card">
              <div class="agent-index">${String(index + 1).padStart(2, "0")}</div>
              <div>
                <h3>${escapeHtml(agent.name)}</h3>
                <p class="agent-question">${escapeHtml(agent.question)}</p>
                <p>${escapeHtml(agent.focus)}</p>
              </div>
              <span class="agent-owner">${escapeHtml(agent.owner)}</span>
              <span class="agent-status ${status === "PASS" ? "is-pass" : "is-revision"}">${escapeHtml(status)}</span>
              <code>${escapeHtml(agent.file)}</code>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderEvidence(data) {
  const docs = docSources(data);
  const active = docs.find(([id]) => id === state.activeDoc) ?? docs[0];

  return `
    <div class="evidence-board">
      <div class="doc-tabs">
        ${docs
          .map(
            ([id, title, file]) => `
              <button type="button" class="${state.activeDoc === id ? "is-active" : ""}" data-doc="${id}">
                <span>${escapeHtml(title)}</span>
                <small>${escapeHtml(file)}</small>
              </button>
            `,
          )
          .join("")}
      </div>
      <article class="doc-viewer">
        <div class="doc-head">
          <strong>${escapeHtml(active[1])}</strong>
          <span>${escapeHtml(active[2])}</span>
        </div>
        <pre>${escapeHtml(active[3] || "No content available.")}</pre>
      </article>
    </div>
  `;
}

function renderRun(data) {
  const output = state.running
    ? "Running live verification...\n\nPOST /api/run\nnode src/orchestrator.js"
    : data.runOutput?.stdout?.trim() || "Awaiting local verification.\n\nnode src/orchestrator.js";

  return `
    <div class="run-board">
      <article class="terminal">
        <div class="terminal-head">
          <strong>Judge terminal</strong>
          <span>src/orchestrator.js</span>
        </div>
        <pre>${escapeHtml(output)}</pre>
      </article>
      <aside class="contract-panel">
        <h3>Verification contract</h3>
        <div class="checks">
          ${schemaChecks
            .map(
              ([label, meta]) => `
                <div class="check">
                  <strong>OK</strong>
                  <span>${escapeHtml(label)}</span>
                  <small>${escapeHtml(meta)}</small>
                </div>
              `,
            )
            .join("")}
        </div>
      </aside>
    </div>
  `;
}

function renderPrintReport(data) {
  const readiness = data.launchReadiness;
  const facts = data.specFacts;
  const p0 = p0Findings(data);
  const date = new Date().toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const findingBlock = (f) => `
    <div class="pr-finding">
      <div class="pr-finding-head">
        <strong>${escapeHtml(f.id)} · ${escapeHtml(f.risk)}</strong>
        <span>${escapeHtml(f.severity)} · ${escapeHtml(f.priority)} · ${escapeHtml(shortAgent(f.agent))}</span>
      </div>
      <p class="pr-evidence">“${escapeHtml(f.evidence)}”</p>
      <p><b>Why it matters:</b> ${escapeHtml(f.impact)}</p>
      <p><b>Remediation:</b> ${escapeHtml(f.remediation)}</p>
    </div>
  `;

  return `
    <div class="print-report">
      <div class="pr-titlebar">
        <span>Token Launch Lab — Launch Risk Report</span>
        <span>${escapeHtml(date)}</span>
      </div>
      <h1 class="pr-h1">${escapeHtml(facts.projectName || "Token launch")} <small>${escapeHtml(facts.category || "")}</small></h1>
      <div class="pr-decision pr-${(readiness.recommendation || "").toLowerCase().replace(/[^a-z]/g, "")}">
        Decision: <strong>${escapeHtml(readiness.recommendation)}</strong> · Readiness ${escapeHtml(String(readiness.score))}/100
        · ${data.findings.length} findings, ${p0.length} P0
      </div>
      ${readiness.rationale ? `<p class="pr-rationale">${escapeHtml(readiness.rationale)}</p>` : ""}

      ${
        p0.length
          ? `<h2 class="pr-h2">Fix first — ${p0.length} P0 blocker${p0.length === 1 ? "" : "s"}</h2>
             <ol class="pr-fixlist">${p0
               .map((f) => `<li><strong>${escapeHtml(f.id)} · ${escapeHtml(f.risk)}</strong><br>${escapeHtml(f.remediation)}</li>`)
               .join("")}</ol>`
          : `<h2 class="pr-h2">No P0 blockers</h2>`
      }

      <h2 class="pr-h2">All findings (${data.findings.length})</h2>
      ${data.findings.map(findingBlock).join("")}

      <div class="print-watermark">Generated by Token Launch Lab · leini8891@gmail.com · Defensive review only — not legal advice.</div>
    </div>
  `;
}

function renderError() {
  return `
    <main class="app-shell">
      <section class="error-state">
        <span class="kicker">Token Launch Lab</span>
        <h1>Demo server error</h1>
        <p>${escapeHtml(state.error || "Unknown error")}</p>
      </section>
    </main>
  `;
}

function bindEvents() {
  document.getElementById("runHarness")?.addEventListener("click", runHarness);
  document.getElementById("newAnalysis")?.addEventListener("click", newAnalysis);
  document.getElementById("exportPdf")?.addEventListener("click", () => window.print());
  document.getElementById("shareReport")?.addEventListener("click", async (event) => {
    const id = state.data?.id;
    if (!id) return;
    const url = `${location.origin}/?r=${id}`;
    const button = event.currentTarget;
    try {
      await navigator.clipboard.writeText(url);
      button.textContent = "Link copied";
      setTimeout(() => {
        button.textContent = "Share";
      }, 1600);
    } catch {
      window.prompt("Copy this read-only link:", url);
    }
  });

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", () => {
      state = { ...state, activeView: button.dataset.view };
      render();
    });
  });

  document.querySelectorAll("[data-finding]").forEach((button) => {
    button.addEventListener("click", () => {
      state = { ...state, selectedFindingId: button.dataset.finding };
      render();
    });
  });

  document.querySelectorAll("[data-jump-finding]").forEach((button) => {
    button.addEventListener("click", () => {
      state = { ...state, activeView: "findings", selectedFindingId: button.dataset.jumpFinding };
      render();
    });
  });

  document.querySelectorAll("[data-doc]").forEach((button) => {
    button.addEventListener("click", () => {
      state = { ...state, activeDoc: button.dataset.doc };
      render();
    });
  });
}

function render() {
  const root = document.getElementById("app");

  if (state.view === "intake") {
    root.innerHTML = renderIntake();
    bindIntakeEvents();
    return;
  }

  if (state.error && !state.data) {
    root.innerHTML = renderError();
    return;
  }

  if (!state.data) {
    return;
  }

  root.innerHTML = `
    <main class="app-shell">
      ${renderTopbar(state.data)}
      ${renderBanner(state.data)}
      ${renderOverview(state.data)}
      ${renderTopActions(state.data)}
      ${renderAgentSummary(state.data)}
      ${renderWorkspace(state.data)}
      <footer class="footer">
        <span>github.com/leini8891/token-launch-lab</span>
        <span>Defensive review only. No exploit instructions. No legal advice.</span>
      </footer>
    </main>
    ${renderPrintReport(state.data)}
  `;

  bindEvents();
}

async function loadShared(id) {
  try {
    const data = await fetchJson(`/api/r/${encodeURIComponent(id)}`);
    state = { ...state, data, view: "dashboard", activeView: "findings" };
    ensureSelection(data);
  } catch (error) {
    state = { ...state, view: "intake", analyzeError: `Could not open shared report: ${error.message}` };
  }
  render();
}

const sharedId = new URLSearchParams(location.search).get("r");
if (sharedId) {
  loadShared(sharedId);
} else {
  render();
}
