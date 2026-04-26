# Stablecoins only for balances; SOL only for gas

Splitwise-like apps need unit-of-account stability — SOL volatility makes it unusable for "you owe $14.50." FundWise uses stablecoins for balances and SOL only for gas. See [0011-fix-usdc-as-the-mvp-settlement-asset.md](./0011-fix-usdc-as-the-mvp-settlement-asset.md) for the later decision that narrows the MVP to USDC only.

**Consequences:** No FX or price-oracle code is needed in the MVP path. Stablecoin scope for the current MVP is now intentionally narrower than this earlier ADR.
