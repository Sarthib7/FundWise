# Zerion CLI wallet-readiness support (FW-005)

A narrow sponsor-track demo that uses the official **Zerion CLI** to answer one question: *is this Solana wallet ready to settle a FundWise expense?*

This is **support tooling**, not part of the FundWise app. It does not connect a wallet, sign transactions, or execute Settlements. The Solana wallet-adapter remains the sole identity and money-movement path (see [ADR-0014](./adr/0014-optional-phantom-connect-alongside-wallet-adapter.md)).

## What it reports

For a given Solana address, the script reports:

- **USDC on Solana** — does the wallet hold enough USDC to settle?
- **SOL for gas** — does the wallet hold enough SOL for transaction fees?
- **Broader wallet context** — total positions, number of chains, count of distinct symbols, as visibility into what else the wallet holds.

It then prints a human verdict (`READY` / `NOT READY`) with concrete reasons, or emits a structured JSON summary when called with `--json`.

## Setup

1. **Install the Zerion CLI** — follow the official guide:
   <https://developers.zerion.io/build-with-ai/zerion-cli>

2. **Export an API key in your shell:**

   ```sh
   export ZERION_API_KEY=<your-key>
   ```

   The free tier is sufficient for the readiness use case. This script does **not** persist or invent secrets — it passes `ZERION_API_KEY` through to the CLI subprocess at runtime.

3. **(Optional) x402 pay-per-call on Solana.** Zerion supports an x402 payment flow for pay-per-call usage. If you want to demo that path, follow the Zerion CLI x402 docs to configure it (typically a Solana keypair plus an `ZERION_X402` opt-in flag the CLI documents). Do not commit any private key. This script will work the same way once the CLI itself is configured for x402; we do not re-implement payment logic here.

## Usage

```sh
pnpm zerion:readiness <wallet-address>
```

Flags:

| Flag | Default | Description |
| --- | --- | --- |
| `--json` | off | Emit a structured readiness summary as JSON |
| `--min-usdc=<n>` | `1` | Override the minimum USDC threshold for "ready" |
| `-h`, `--help` | — | Print usage |

Exit codes:

| Code | Meaning |
| --- | --- |
| `0` | Ready — wallet has enough USDC and SOL to settle |
| `1` | Not ready — concrete reasons printed (insufficient USDC, insufficient SOL, or empty wallet) |
| `2` | Setup or invocation error — CLI missing, API key missing, or output could not be parsed |

## Examples

Human-readable verdict:

```sh
$ pnpm zerion:readiness Bv1...8KJq
Zerion wallet readiness — Bv1...8KJq
────────────────────────────────────────────────
✓ USDC on Solana:  245.30 USDC  (≥ 1 USDC threshold met)
✓ SOL for gas:     0.1234 SOL   (above 0.005 dust floor)
ℹ Broader context: 6 positions across 2 chain(s); 4 on Solana

Verdict: READY to settle FundWise expenses.
────────────────────────────────────────────────
Source: Zerion CLI · Read-only · No transactions signed.
```

Structured output for tooling:

```sh
$ pnpm zerion:readiness Bv1...8KJq --json
{
  "address": "Bv1...8KJq",
  "minUsdcThreshold": 1,
  "summary": {
    "usdcAvailable": 245.30,
    "solAvailable": 0.1234,
    "solanaPositions": 4,
    "totalPositions": 6,
    "uniqueChains": 2,
    "uniqueSymbols": 5
  },
  "verdict": { "ready": true, "reasons": [] }
}
```

## Failure modes

| Symptom | What to do |
| --- | --- |
| `error: \`zerion\` CLI not found on PATH` | Install the Zerion CLI from the link above. |
| `error: zerion CLI exited with status …` plus an auth hint | Export `ZERION_API_KEY` in this shell. |
| `error: could not parse zerion CLI output as JSON` | The CLI's default output may have changed. Raw output is preserved on stderr for debugging. |

## Scope and non-goals

- **In scope:** Solana USDC + SOL readiness, broader wallet context, JSON output for downstream tooling.
- **Out of scope:** wallet connection, transaction signing, Settlement execution, Group / Member identity, balances pulled from the FundWise ledger.

The intent is to strengthen the FundWise sponsor story (Zerion track) without mixing readiness analysis into the wallet-bound Settlement path.

## Related

- Track context: [HACKATHON_PLAN.md](../HACKATHON_PLAN.md)
- Issue: `FW-005` in [issues.md](../issues.md)
- Future: Fundy will reuse the same Zerion CLI behind `/analyze`, `/readiness`, `/verify` (see [ADR-0018](./adr/0018-fundy-telegram-bot.md)).
