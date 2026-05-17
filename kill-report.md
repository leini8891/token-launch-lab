# Kill Report

## Launch Readiness

- Score: 24/100
- Recommendation: NO-GO
- Critical findings: 1
- High findings: 3

## Executive Summary

Token Launch Lab found 8 launch failure modes across dump risk, protocol risk, regulatory risk, and public narrative risk. The current sample TGE should not be treated as launch-ready until all P0 items are resolved.

## Top Failure Modes

### 1. REG-001: Public sale and US participation are unresolved risk flags

- Agent: Regulatory Risk Agent
- Severity: critical
- Confidence: medium
- Evidence from TGE spec: "Public sale is being considered but not yet designed / Private round investors include funds in Singapore, Korea, and the US"
- Risk: The spec mentions US investors and a possible public sale without a distribution policy. This is not legal advice, but it is a launch-risk flag.
- Remediation priority: P0 before fundraising, airdrop, or public sale announcement
- Recommended remediation: Get qualified legal review, define jurisdiction gating, investor eligibility, transfer restrictions, and communications policy before any public sale decision.

### 2. DUMP-001: Investor unlock cliff may create a visible sell-pressure event

- Agent: Dump Risk Agent
- Severity: high
- Confidence: high
- Evidence from TGE spec: "Investors: 18%, 6-month cliff, 24-month linear vesting"
- Risk: A large investor allocation with a short cliff can become the launch's first public trust test.
- Remediation priority: P0 before CEX listing conversations
- Recommended remediation: Model month-by-month unlock pressure, publish a transparent unlock calendar, and consider longer lockups or staggered unlock tranches before listing talks.

### 3. PROTO-001: Emergency pause and incident response policy is undefined

- Agent: Protocol Risk Agent
- Severity: high
- Confidence: high
- Evidence from TGE spec: "Emergency pause policy is not finalized"
- Risk: A launch can fail operationally if the team cannot explain who can pause, when they can pause, and how users are protected.
- Remediation priority: P0 before mainnet deployment
- Recommended remediation: Define pause authority, multisig policy, event disclosure process, and post-incident restart criteria. This is defensive review only and does not include exploit instructions.

### 4. CT-002: Points-to-token farm concern is already present in founder notes

- Agent: CT Adversary Agent
- Severity: high
- Confidence: high
- Evidence from TGE spec: "Wants to avoid looking like another points-to-token farm"
- Risk: If the founder already fears this critique, the launch needs stronger proof of utility before incentives begin.
- Remediation priority: P0 before campaign launch
- Recommended remediation: Publish user workflows, non-speculative utility, and retention metrics before token reward campaigns.

## Safety Boundaries

- No exploit instructions are generated.
- No legal advice is provided.
- Findings are defensive launch-readiness signals for founders, exchanges, launchpads, and reviewers.
