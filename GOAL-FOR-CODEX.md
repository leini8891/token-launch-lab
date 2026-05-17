# Goal For Codex

End state:
Agent Pod is a demo-ready Harness/Skills Track project that can be submitted and shown live.

Verification:
1. `npm run build` passes.
2. `npm run demo` completes PM-Agent -> Builder-Agent -> Auditor-Agent -> Demo-Agent.
3. `.pod/decisions.log` contains start/end events for every agent.
4. `artifacts/vesting-calculator.test.mjs` passes with `node --test`.
5. `.pod/audit-report.md` has no BLOCKER items.
6. `PITCH.md` is readable aloud in 45 seconds.
7. `SUBMISSION.md` contains project name, one-liner, track, description, and who-to-meet.
8. `node ./dist/index.js dashboard -p 3000` opens an auto-refreshing dashboard that displays spec, decisions log, audit report, and artifacts.
9. `node ./dist/index.js replay` restores the cached demo from `demos/vesting`.

Constraints:
- Preserve the core framing: Agent Pod is the product; Token Vesting Studio is the demo artifact.
- Keep markdown as the wire format between agents.
- Do not add auth, database, payments, or deployment.
- Do not introduce LangChain, LlamaIndex, AutoGen, CrewAI, or an agent framework.
- Keep the project runnable on the local machine before 5PM.
- Prefer visible demo reliability over architecture purity.

Boundaries:
- Do not delete the static fallback demo in the parent folder.
- Do not rewrite `AGENTS.md`, `plan.md`, or `pod-spec.md` unless necessary for consistency.
- If a change makes the live demo less reliable, revert that specific change.

Iterative path:
1. Run the verification commands.
2. Fix any failing build or artifact test.
3. Improve README/PITCH/SUBMISSION only if tests already pass.
4. Polish dashboard only after the CLI run is stable.
5. Stop when all verification points pass.
