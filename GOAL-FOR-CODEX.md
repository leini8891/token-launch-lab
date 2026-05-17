# Goal For Codex

End state:
Token Launch Lab is a demo-ready Harness/Skills Track project: an adversarial multi-agent harness for token launch pre-mortems.

Verification:
1. `node src/orchestrator.js` runs successfully.
2. `tge-spec.md` exists as shared input.
3. `redteam-findings.md`, `kill-report.md`, `remediation.md`, and `judge-evaluation.md` are generated.
4. Output includes the five roles: Dump Risk Agent, Protocol Risk Agent, Regulatory Risk Agent, CT Adversary Agent, and Orchestrator / Judge Agent.
5. Every finding includes severity, confidence, evidence from the TGE spec, and remediation priority.
6. `kill-report.md` includes a launch readiness score.
7. `judge-evaluation.md` explains Harness / Skills Track fit.
8. `npm run build` still passes.
9. `npm run test:artifact` still passes for the legacy vesting artifact demo.

Constraints:
- Preserve the core framing: Token Launch Lab is the product; the sample TGE is the demo artifact.
- Keep markdown as the wire format between agents.
- Defensive review only.
- Do not generate exploit instructions.
- Do not provide legal advice.
- Do not add auth, database, payments, or deployment.
- Do not introduce LangChain, LlamaIndex, AutoGen, CrewAI, or an agent framework.
- Keep the project runnable on the local machine before 5PM.
- Prefer visible demo reliability over architecture purity.

Iterative path:
1. Run the verification commands.
2. Fix any failing orchestrator or output schema issue.
3. Improve README/PITCH/SUBMISSION only if the harness already runs.
4. Treat the older dashboard as supporting evidence, not the main demo.
5. Stop when all verification points pass.
