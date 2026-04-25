# Stablecoins only for balances; SOL only for gas

Splitwise-like apps need unit-of-account stability — SOL volatility makes it unusable for "you owe $14.50." Every group picks a single SPL stablecoin mint at creation (USDC default, USDT/PYUSD/arbitrary SPL allowed). Balances, expenses, settlements, and contributions all use that mint. No FX or price-oracle code needed in MVP.

**Consequences:** A group can't mix mints — simplifies math and UX. Curated stablecoin list vs arbitrary mint input remains an open question.