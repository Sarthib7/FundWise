# LI.FI Route Rehearsal

FundWise uses LI.FI as a support path, not as Settlement itself. If a Member has USDC on a supported EVM chain, they can route funds into their Solana wallet, then finish the normal wallet-confirmed FundWise Settlement or Contribution.

## Shipped Path

- Source wallet: injected EVM wallet such as MetaMask or Rabby
- Source chains: Ethereum, Base, Arbitrum, Optimism, Polygon
- Source token: mainnet USDC on the selected EVM chain
- Destination: Member's Solana wallet
- Destination token: Solana mainnet USDC
- Return path: same FundWise Group, same Settlement or Contribution context

LI.FI never pays a FundWise creditor directly. FundWise still records a Settlement only after the Member signs the Solana USDC transfer and FundWise verifies it.

## Not Shipped

- Ethereum Sepolia -> Solana USDC
- Base Sepolia -> Solana USDC
- Arbitrum Sepolia -> Solana USDC
- OP Sepolia -> Solana USDC
- Solana devnet destination routing
- Automatic Settlement without wallet confirmation
- Cross-chain creditor payout that bypasses normal FundWise Settlement

As of 2026-05-13, `pnpm lifi:readiness` reports usable route metadata for FundWise mainnet USDC sources and no usable Sepolia-family route into Solana USDC. LI.FI's own testing guidance says integration tests should run on mainnets because testnet support/liquidity is not reliable.

## Readiness Command

```bash
pnpm lifi:readiness
```

This command is read-only. It checks LI.FI chain and connection metadata for:

`Ethereum/Base/Arbitrum/Optimism/Polygon USDC -> Solana mainnet USDC`

It does not connect wallets, request quotes, sign messages, or move funds.

JSON output:

```bash
pnpm lifi:readiness --json
```

## Mainnet Rehearsal

Run this before public launch, after FW-038 production env setup is complete.

1. Confirm production app is using Solana mainnet and prod Supabase.
2. Run `pnpm lifi:readiness`.
3. Create a Split Mode Group with two real wallets.
4. Add an Expense that creates a small settleable Balance.
5. Use `Route funds for Settlement`.
6. Connect injected EVM wallet.
7. Prefer Base or Optimism USDC for low gas.
8. Route a tiny USDC amount into the debtor's Solana wallet.
9. Return to FundWise.
10. Complete normal Solana USDC Settlement.
11. Open Receipt and verify mainnet explorer link.

## Pass Criteria

- `pnpm lifi:readiness` returns `READY_FOR_MAINNET_REHEARSAL`.
- EVM wallet connects without breaking Solana wallet session.
- LI.FI quote appears for supported mainnet source chain.
- Route execution sends USDC to Member's Solana wallet.
- FundWise does not record a Settlement until normal Solana transfer succeeds.
- Receipt shows Solana mainnet signature with no devnet cluster suffix.

## If Readiness Fails

Do not claim cross-chain routing is launch-ready. Keep normal Solana USDC Settlement live, hide or soften LI.FI launch copy, capture the failed chain/token pair, and create a new indexed `FW-*` issue.
