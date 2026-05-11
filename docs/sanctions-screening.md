# Minimal Sanctions Screening

**Last updated:** 2026-05-11
**Issue:** FW-041

FundWise performs a minimal wallet-connect screen before issuing a wallet-session challenge. This is a good-faith mainnet-launch control, not a full compliance program and not legal advice.

## Source

- Source list: OFAC SDN XML — `https://www.treasury.gov/ofac/downloads/sdn.xml`
- Field used: `Digital Currency Address - SOL`
- Current static list lives in `lib/server/sanctions-screening.ts`

The 2026-05-11 OFAC SDN XML includes one Solana address under `Digital Currency Address - SOL`:

```text
42RLPACwZPx3vYYmxSueqsogfynBDqXK298EDsNoyoHi
```

## Runtime behavior

- `POST /api/auth/wallet/challenge` normalizes the submitted Solana wallet to base58.
- The normalized wallet is compared against the in-memory sanctioned Solana wallet set.
- If matched, FundWise returns `403` with the generic message: `This wallet is not supported by FundWise.`
- No wallet challenge is issued for blocked wallets.

## Refresh cadence

Until a managed compliance provider replaces this static list:

1. Re-check OFAC SDN XML before the mainnet rehearsal.
2. Re-check monthly after public launch.
3. Update `lib/server/sanctions-screening.ts`, this document, and FW-041 notes when the source changes.

## Limitations

- This screens only Solana addresses currently listed in OFAC SDN XML.
- It does not screen names, entities, IP geolocation, linked wallets, mixers, or other chains.
- It should be replaced with a compliance provider if FundWise grows beyond a small mainnet launch.
