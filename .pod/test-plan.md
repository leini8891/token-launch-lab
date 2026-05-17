# Test Plan

- AC-001: unit test cliff lock before month 6.
- AC-002: unit test month 18 equals 50% vested for a 6-month cliff and 24-month vest.
- AC-003: unit test full unlock after month 30.
- AC-004: unit test schedule rows expose month, vested, and percentage.
- AC-005: run `node --test artifacts/vesting-calculator.test.mjs`.
- AC-006: Auditor-Agent checks required packaging files.
