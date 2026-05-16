/**
 * Public barrel for the FundWise Fees Module (FW-066, ADR-0036).
 *
 * Surfaces:
 *   - `quoteCreationFee`, `quoteContributionFee`,
 *     `quoteReimbursementFee`, `quoteRoutingFee` — pure quote functions
 *     that return `FeeQuote` blueprints (no I/O, no signing).
 *   - `recordFee` — the only side-effectful operation; inserts a row
 *     into `platform_fee_ledger` after on-chain success.
 *   - `getFeeConfig` — resolves the operator config (platform fee
 *     wallet + per-cluster USDC mint + rates).
 *
 * No fees are charged anywhere from this PR (FW-066). Actual wiring
 * happens in FW-067 (contribution), FW-068 (reimbursement),
 * FW-069 (creation), FW-070 (routing).
 */

export * from "./config"
export * from "./quote"
export * from "./record"
export * from "./types"
