# Codex /goal Prompt

Paste this into Codex from the repository root:

```text
/goal

End state:
Token Launch Lab is a Codex-backed adversarial multi-agent harness for token launch pre-mortems. The repo must clearly demonstrate Codex integration, multi-agent orchestration, inspectable markdown memory, verification, termination criteria, and a recovery / revision loop.

Verification:
1. Read AGENTS.md and follow the agent role contracts.
2. Read tge-spec.md as the shared input.
3. Produce or revise these agent memory files:
   - outputs/dump-risk.md
   - outputs/protocol-risk.md
   - outputs/regulatory-risk.md
   - outputs/ct-adversary.md
4. Each agent report must include at least one finding with:
   - Specific risk
   - Severity: low / medium / high / critical
   - Confidence: low / medium / high
   - Evidence from tge-spec.md
   - Why it matters
   - Remediation
   - Remediation priority
5. Run node src/orchestrator.js.
6. If the orchestrator reports any missing fields or reports needing revision, revise only the failed output files and run node src/orchestrator.js again.
7. Stop only when all agent reports pass and outputs/kill-report.md, outputs/remediation.md, and outputs/judge-evaluation.md are generated.

Constraints:
- Defensive review only.
- Do not generate exploit instructions.
- Do not provide legal advice.
- Regulatory output must be framed as risk flags for qualified review, not conclusions.
- Protocol risk output may identify missing controls, but must not provide attack steps.
- Keep markdown as the inspectable memory format.
- Keep the project runnable locally with node src/orchestrator.js.

Boundaries:
- Do not add a database, authentication, hosted service, or payment flow.
- Do not use LangChain, CrewAI, AutoGen, LlamaIndex, or another agent framework.
- Do not hide reasoning in a black-box app; write the evidence into markdown files.

Recovery / revision loop:
- The Judge Agent / Orchestrator is src/orchestrator.js.
- If a report fails verification, use the printed missing fields as the repair instruction.
- Revise only the failed report file.
- Re-run node src/orchestrator.js until verification passes.

Final response:
Summarize which reports passed, the launch readiness score, and the generated files.
```
