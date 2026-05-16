/**
 * Public surface of the Squads Module. Callers can import a single
 * namespace — `import * as Squads from "@/lib/squads"` — and reach every
 * verify helper, wallet-signed governance op, and shared type without
 * touching `@sqds/multisig` directly. See ADR-0035.
 */

export * from "./lifecycle"
export * from "./governance"
