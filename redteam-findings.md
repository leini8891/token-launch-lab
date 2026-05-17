# Red-Team Findings

Defensive risk review only. This file does not provide exploit instructions or legal advice.

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

### 5. PROTO-002: Audit timing is too late for launch-readiness confidence

- Agent: Protocol Risk Agent
- Severity: medium
- Confidence: high
- Evidence from TGE spec: "External audit is planned after the prototype"
- Risk: Planning audit after prototype is normal, but launch messaging should not imply production readiness before audit findings are closed.
- Remediation priority: P1 before investor or listing materials
- Recommended remediation: Separate prototype demo from production launch, publish audit status honestly, and require all high-severity audit items to close before TGE.

### 6. CT-001: Narrative sounds derivative and may be attacked as tokenizing a SaaS metaphor

- Agent: CT Adversary Agent
- Severity: medium
- Confidence: high
- Evidence from TGE spec: "HarborUSD is "the Stripe Atlas for stablecoin settlement.""
- Risk: Crypto Twitter can frame the launch as a generic infrastructure metaphor plus token incentives, not a token with clear necessity.
- Remediation priority: P1 before public narrative push
- Recommended remediation: Clarify why the token is necessary, what users can do without speculation, and what measurable network behavior the token coordinates.

### 7. DUMP-002: TGE liquidity and market-making allocation needs explicit guardrails

- Agent: Dump Risk Agent
- Severity: medium
- Confidence: medium
- Evidence from TGE spec: "Liquidity and market making: 10%, available at TGE"
- Risk: The spec does not explain how liquidity inventory can be used, creating optics risk around early price support or insider advantage.
- Remediation priority: P1 before public launch materials
- Recommended remediation: Document market-maker mandate, inventory limits, reporting cadence, and conflict controls.

### 8. REG-002: Referral and trading rewards may create incentive-design concerns

- Agent: Regulatory Risk Agent
- Severity: medium
- Confidence: medium
- Evidence from TGE spec: "Community campaign may include airdrops, referrals, and trading rewards"
- Risk: Rewards tied to trading or referrals can attract regulatory, market integrity, or user-protection scrutiny depending on execution.
- Remediation priority: P1 before campaign design
- Recommended remediation: Review campaign mechanics with counsel and compliance reviewers; avoid promising returns or encouraging manipulative trading behavior.
