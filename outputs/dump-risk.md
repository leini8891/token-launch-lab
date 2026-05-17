# Dump Risk Agent Report

Codex agent role: Dump Risk Agent

Mission: stress-test unlocks, float, market-maker inventory, and sell-pressure optics before launch.

## Finding DUMP-001

- Specific risk: Investor unlock cliff may create a visible sell-pressure event.
- Severity: high
- Confidence: high
- Evidence from tge-spec.md: Investors: 18%, 6-month cliff, 24-month linear vesting
- Why it matters: A large investor allocation with a short cliff can become the first public trust test after TGE and may dominate the launch narrative if price action weakens around unlocks.
- Remediation: Model month-by-month unlock pressure, publish a transparent unlock calendar, and consider longer lockups or staggered unlock tranches before listing conversations.
- Remediation priority: P0 before CEX listing conversations

## Finding DUMP-002

- Specific risk: TGE liquidity and market-making allocation needs explicit guardrails.
- Severity: medium
- Confidence: medium
- Evidence from tge-spec.md: Liquidity and market making: 10%, available at TGE
- Why it matters: Without clear market-maker inventory rules, early liquidity can look like insider advantage, artificial support, or unmanaged sell pressure.
- Remediation: Document market-maker mandate, inventory limits, reporting cadence, and conflict controls before public launch materials.
- Remediation priority: P1 before public launch materials
