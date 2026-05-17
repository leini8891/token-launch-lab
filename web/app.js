const agentRoles = [
  {
    name: "Dump Risk Agent",
    file: "outputs/dump-risk.md",
    role: "Reviews vesting, unlock pressure, insider allocation, liquidity optics, and CEX-listing timing.",
  },
  {
    name: "Protocol Risk Agent",
    file: "outputs/protocol-risk.md",
    role: "Reviews defensive protocol readiness, audit status, pause policy, multisig, and incident response assumptions.",
  },
  {
    name: "Regulatory Risk Agent",
    file: "outputs/regulatory-risk.md",
    role: "Flags distribution, jurisdiction, public sale, and incentive-campaign risk areas for qualified review.",
  },
  {
    name: "CT Adversary Agent",
    file: "outputs/ct-adversary.md",
    role: "Simulates the harshest credible public narrative critique before the market writes it.",
  },
  {
    name: "Judge Agent",
    file: "src/orchestrator.js",
    role: "Verifies schema, evidence, severity, safety boundaries, termination, and revision requirements.",
  },
];

const schemaChecks = [
  ["specific risk", "required"],
  ["severity", "low / medium / high / critical"],
  ["confidence", "low / medium / high"],
  ["evidence", "exact quote from tge-spec.md"],
  ["remediation", "defensive fix"],
  ["safety", "no exploit instructions / no legal advice"],
];

let state = {
  data: null,
  running: false,
  runStarted: false,
  lastRunAt: null,
  error: null,
};

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function severityClass(value) {
  return ["critical", "high", "medium", "low"].includes(value) ? value : "low";
}

function shortAgent(name) {
  return name.replace(" Risk Agent", "").replace(" Adversary Agent", "").replace("Regulatory", "Reg").replace("Protocol", "Proto");
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
    state = { ...state, data: await fetchJson("/api/report"), error: null };
  } catch (error) {
    state = { ...state, error: error.message };
  }
  render();
}

async function runHarness() {
  state = { ...state, running: true, runStarted: true, error: null };
  render();
  try {
    state = {
      ...state,
      data: await fetchJson("/api/run", { method: "POST" }),
      running: false,
      lastRunAt: new Date().toLocaleTimeString(),
      error: null,
    };
  } catch (error) {
    state = { ...state, running: false, error: error.message };
  }
  render();
}

function renderTopbar(data) {
  const status = state.running
    ? "running judge..."
    : state.lastRunAt
      ? `verified at ${state.lastRunAt}`
      : data?.judge?.revisionReports === 0
        ? "ready: click run"
        : "needs revision";
  return `
    <header class="topbar">
      <div class="brand"><span class="brand-mark"></span><span>Token Launch Lab</span></div>
      <div class="topbar-meta">Codex /goal -> markdown memory -> judge gate -> kill report</div>
      <div class="actions">
        <span class="command-pill">node src/orchestrator.js</span>
        <span class="status-pill">${escapeHtml(status)}</span>
        <button class="run-button" type="button" id="runHarness" ${state.running ? "disabled" : ""}>${state.running ? "Running..." : "Run Judge Verification"}</button>
      </div>
    </header>
  `;
}

function renderHero(data) {
  const readiness = data.launchReadiness;
  return `
    <section class="hero">
      <div>
        <div class="eyebrow">${escapeHtml(data.project.track)}</div>
        <h1>HarborUSD Kill Report</h1>
        <p class="lede">${escapeHtml(data.project.tagline)}</p>
        <div class="meta-grid">
          <div class="meta-cell"><span class="label">Subject</span><span class="value">${escapeHtml(data.project.subject)}</span></div>
          <div class="meta-cell"><span class="label">Agents</span><span class="value">4 adversaries + judge</span></div>
          <div class="meta-cell"><span class="label">Memory</span><span class="value">outputs/*.md</span></div>
          <div class="meta-cell"><span class="label">Safety</span><span class="value">Defensive only</span></div>
        </div>
      </div>
      <aside class="score-panel">
        <div class="stamp">${escapeHtml(readiness.recommendation).replace("-", "<br />")}</div>
        <div class="score-label"><span>Launch readiness</span><span>verified</span></div>
        <div class="score-number">${readiness.score}<span>/100</span></div>
        <div class="verdict">${escapeHtml(readiness.recommendation)}</div>
        <div class="score-bars">
          <div class="score-stat"><strong>${readiness.critical}</strong><span>critical</span></div>
          <div class="score-stat"><strong>${readiness.high}</strong><span>high</span></div>
          <div class="score-stat"><strong>${data.judge.validFindings}</strong><span>valid findings</span></div>
          <div class="score-stat"><strong>${readiness.revisions}</strong><span>revisions</span></div>
        </div>
      </aside>
    </section>
  `;
}

function renderAgents(data) {
  const reportStatus = new Map(data.judge.reports.map((report) => [report.file, report.status]));
  return `
    <section class="section">
      <div class="section-head">
        <span class="section-kicker">I</span>
        <h2 class="section-title">Adversarial Agents</h2>
        <span class="section-note">independent reports</span>
      </div>
      <div class="agent-grid">
        ${agentRoles
          .map((agent, index) => {
            const status = reportStatus.get(agent.file) || "PASS";
            return `
              <article class="agent">
                <div class="num">${String(index + 1).padStart(2, "0")}</div>
                <h3>${escapeHtml(agent.name)}</h3>
                <p>${escapeHtml(agent.role)}</p>
                <span class="pass">${escapeHtml(status)} · ${escapeHtml(agent.file)}</span>
              </article>
            `;
          })
          .join("")}
      </div>
    </section>
  `;
}

function renderFindings(data) {
  return `
    <section class="section">
      <div class="section-head">
        <span class="section-kicker">II</span>
        <h2 class="section-title">Ranked Failure Modes</h2>
        <span class="section-note">${data.findings.length} surfaced</span>
      </div>
      <div class="finding-grid">
        ${data.findings
          .map(
            (finding) => `
              <article class="finding">
                <div class="finding-top">
                  <div class="agent-line">${escapeHtml(finding.id)} -> ${escapeHtml(shortAgent(finding.agent))}</div>
                  <span class="severity ${severityClass(finding.severity)}">${escapeHtml(finding.severity)}</span>
                </div>
                <h3>${escapeHtml(finding.risk)}</h3>
                <blockquote class="evidence">${escapeHtml(finding.evidence)}</blockquote>
                <dl>
                  <dt>Confidence</dt><dd>${escapeHtml(finding.confidence)}</dd>
                  <dt>Why</dt><dd>${escapeHtml(finding.impact)}</dd>
                  <dt>Priority</dt><dd>${escapeHtml(finding.priority)}</dd>
                  <dt>Fix</dt><dd>${escapeHtml(finding.remediation)}</dd>
                </dl>
              </article>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderTrace(data) {
  let output = `Waiting for live verification.

Click "Run Judge Verification" in the top right.

The browser will call:
POST /api/run

The local server will execute:
node src/orchestrator.js`;

  if (state.running) {
    output = `Running live verification now...

POST /api/run
-> node src/orchestrator.js

Please wait for the PASS lines.`;
  }

  if (data.runOutput?.stdout) {
    output = `${data.runOutput.stdout.trim()}

UI-triggered run completed at ${state.lastRunAt ?? "just now"}.`;
  }

  return `
    <section class="section">
      <div class="section-head">
        <span class="section-kicker">III</span>
        <h2 class="section-title">Codex Harness Trace</h2>
        <span class="section-note">inspectable memory</span>
      </div>
      <div class="trace-grid">
        <div class="terminal">
          <div class="panel-head"><span>Judge terminal</span><span>src/orchestrator.js</span></div>
          <pre>${escapeHtml(output)}</pre>
        </div>
        <div class="doc-panel">
          <div class="panel-head"><span>Shared launch spec</span><span>tge-spec.md</span></div>
          <pre>${escapeHtml(data.excerpts.tgeSpec)}</pre>
        </div>
      </div>
    </section>
  `;
}

function renderBanner() {
  if (state.running) {
    return `<div class="banner is-running">Running Judge Verification: POST /api/run -> node src/orchestrator.js</div>`;
  }

  if (state.error) {
    return `<div class="banner is-error">Error: ${escapeHtml(state.error)}</div>`;
  }

  if (state.lastRunAt) {
    return `<div class="banner is-ok">Live verification completed at ${escapeHtml(state.lastRunAt)}. The terminal panel now shows real orchestrator output.</div>`;
  }

  return `<div class="banner">Backend connected. Click Run Judge Verification to trigger the real local verifier.</div>`;
}

function renderGate(data) {
  return `
    <section class="section">
      <div class="section-head">
        <span class="section-kicker">IV</span>
        <h2 class="section-title">Judge Gate</h2>
        <span class="section-note">termination criteria</span>
      </div>
      <div class="schema-grid">
        <div class="gate">
          <h3>Verification Contract</h3>
          <div class="checks">
            ${schemaChecks
              .map(
                ([label, meta]) => `
                  <div class="check"><strong>OK</strong><span>${escapeHtml(label)}</span><span>${escapeHtml(meta)}</span></div>
                `,
              )
              .join("")}
          </div>
        </div>
        <div class="doc-panel">
          <div class="panel-head"><span>Codex goal</span><span>codex-goal.md</span></div>
          <pre>${escapeHtml(data.excerpts.codexGoal)}</pre>
        </div>
      </div>
    </section>
  `;
}

function renderDocs(data) {
  return `
    <section class="section">
      <div class="section-head">
        <span class="section-kicker">V</span>
        <h2 class="section-title">Markdown Evidence</h2>
        <span class="section-note">repo artifacts</span>
      </div>
      <div class="full-docs">
        <div class="mini-doc doc-panel">
          <div class="panel-head"><span>Agents</span><span>AGENTS.md</span></div>
          <pre>${escapeHtml(data.excerpts.agents)}</pre>
        </div>
        <div class="mini-doc doc-panel">
          <div class="panel-head"><span>Remediation</span><span>outputs/remediation.md</span></div>
          <pre>${escapeHtml(data.excerpts.remediation)}</pre>
        </div>
        <div class="mini-doc doc-panel">
          <div class="panel-head"><span>Judge eval</span><span>outputs/judge-evaluation.md</span></div>
          <pre>${escapeHtml(data.docs.judgeEvaluation)}</pre>
        </div>
      </div>
    </section>
  `;
}

function renderError() {
  return `
    <main class="shell">
      <section class="hero">
        <div>
          <div class="eyebrow">Token Launch Lab</div>
          <h1>Demo server error</h1>
          <p class="lede">${escapeHtml(state.error || "Unknown error")}</p>
        </div>
      </section>
    </main>
  `;
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
    <main class="shell">
      ${renderTopbar(state.data)}
      ${renderBanner()}
      ${renderHero(state.data)}
      ${renderAgents(state.data)}
      ${renderFindings(state.data)}
      ${renderTrace(state.data)}
      ${renderGate(state.data)}
      ${renderDocs(state.data)}
      <footer class="footer">
        <span>Public repo: github.com/leini8891/token-launch-lab</span>
        <span>Defensive review only. No exploit instructions. No legal advice.</span>
      </footer>
    </main>
  `;

  document.getElementById("runHarness")?.addEventListener("click", runHarness);
}

loadReport();
