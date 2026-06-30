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
    name: "CT Adversary Agent",
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

const launchStages = [
  {
    label: "Public sale",
    match: ["public sale", "fundraising", "airdrop"],
    fallback: "REG-001",
    owner: "Counsel",
  },
  {
    label: "CEX track",
    match: ["cex", "listing"],
    fallback: "DUMP-001",
    owner: "Markets",
  },
  {
    label: "Mainnet",
    match: ["mainnet", "deployment"],
    fallback: "PROTO-001",
    owner: "Protocol",
  },
  {
    label: "Campaigns",
    match: ["campaign"],
    fallback: "CT-002",
    owner: "Growth",
  },
  {
    label: "Narrative",
    match: ["narrative", "materials"],
    fallback: "CT-001",
    owner: "Founder",
  },
];

let state = {
  data: null,
  running: false,
  runStarted: false,
  lastRunAt: null,
  error: null,
  activeView: "findings",
  activeDoc: "tgeSpec",
  selectedFindingId: null,
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
  return name
    .replace(" Risk Agent", "")
    .replace(" Adversary Agent", "")
    .replace("Regulatory", "Reg")
    .replace("Protocol", "Proto");
}

function percent(score = 0) {
  return Math.max(0, Math.min(100, Number(score) || 0));
}

function formatStatus(data) {
  if (state.running) return "Judge running";
  if (state.lastRunAt) return `Verified ${state.lastRunAt}`;
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

function stageFinding(data, stage) {
  return (
    data.findings.find((finding) =>
      stage.match.some((word) => `${finding.priority} ${finding.risk} ${finding.remediation}`.toLowerCase().includes(word)),
    ) ?? data.findings.find((finding) => finding.id === stage.fallback)
  );
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
      <div class="pipeline">
        <span>Spec intake</span>
        <span>4 adversaries</span>
        <span>Judge gate</span>
        <span>Founder brief</span>
      </div>
      <div class="command-actions">
        <span class="status-chip ${state.running ? "is-running" : ""}">${escapeHtml(formatStatus(data))}</span>
        <button class="run-button" type="button" id="runHarness" ${state.running ? "disabled" : ""} title="Run the local judge verifier">
          <span aria-hidden="true">${state.running ? "..." : "RUN"}</span>
          ${state.running ? "Running" : "Run Judge"}
        </button>
      </div>
    </header>
  `;
}

function renderBanner() {
  if (state.running) {
    return `<div class="banner is-running">POST /api/run is executing node src/orchestrator.js.</div>`;
  }

  if (state.error) {
    return `<div class="banner is-error">Error: ${escapeHtml(state.error)}</div>`;
  }

  if (state.lastRunAt) {
    return `<div class="banner is-ok">Verification completed at ${escapeHtml(state.lastRunAt)}. Generated markdown is reflected below.</div>`;
  }

  return `<div class="banner">Founder dossier loaded from tge-spec.md, outputs/*.md, and src/orchestrator.js.</div>`;
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
        ${renderLaunchRadar(data)}
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

function renderLaunchRadar(data) {
  const counts = severityCounts(data.findings);
  return `
    <div class="launch-radar" aria-label="Launch risk radar">
      <span class="radar-axis is-top">Reg</span>
      <span class="radar-axis is-right">CT</span>
      <span class="radar-axis is-bottom">Proto</span>
      <span class="radar-axis is-left">Dump</span>
      <span class="radar-pulse critical" style="--x: 50%; --y: 18%">${counts.critical}</span>
      <span class="radar-pulse high" style="--x: 77%; --y: 48%">${counts.high}</span>
      <span class="radar-pulse medium" style="--x: 48%; --y: 74%">${counts.medium}</span>
      <span class="radar-pulse low" style="--x: 23%; --y: 48%">${counts.low}</span>
    </div>
  `;
}

function renderMetrics(data) {
  const gates = launchStages.map((stage) => {
    const finding = stageFinding(data, stage);
    return [
      stage.label,
      finding?.id ?? "CLEAR",
      finding ? `${stage.owner} / ${priorityLevel(finding.priority)}` : "No blocker",
      finding?.severity ?? "low",
    ];
  });

  return `
    <section class="metric-grid" aria-label="Founder launch gates">
      ${gates
        .map(
          ([label, value, note, severity]) => `
            <article class="metric ${severityClass(severity)}">
              <span>${escapeHtml(label)}</span>
              <strong>${escapeHtml(value)}</strong>
              <small>${escapeHtml(note)}</small>
            </article>
          `,
        )
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

  document.querySelectorAll("[data-doc]").forEach((button) => {
    button.addEventListener("click", () => {
      state = { ...state, activeDoc: button.dataset.doc };
      render();
    });
  });
}

function render() {
  const root = document.getElementById("app");
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
      ${renderBanner()}
      ${renderOverview(state.data)}
      ${renderMetrics(state.data)}
      ${renderWorkspace(state.data)}
      <footer class="footer">
        <span>github.com/leini8891/token-launch-lab</span>
        <span>Defensive review only. No exploit instructions. No legal advice.</span>
      </footer>
    </main>
  `;

  bindEvents();
}

loadReport();
