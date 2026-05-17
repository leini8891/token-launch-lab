# Acceptance Criteria

## AC-001
Given a total allocation and a month before the cliff
When the calculator computes vested tokens
Then the vested amount is zero

## AC-002
Given a total allocation, cliff, and vesting duration
When the month is halfway through linear vesting
Then the vested amount is half of the allocation

## AC-003
Given a month after the vesting end
When the calculator computes vested tokens
Then the vested amount equals the full allocation

## AC-004
Given generated schedule rows
When the founder reads the output
Then each row includes month, vested tokens, and percentage vested

## AC-005
Given the artifact test file
When Node's built-in test runner executes it
Then all calculator tests pass

## AC-006
Given the demo package
When a judge inspects the repo
Then README, PITCH, SUBMISSION, audit report, and decisions log are present
