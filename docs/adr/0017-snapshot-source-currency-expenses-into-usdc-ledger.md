# Snapshot source-currency Expenses into the USDC ledger

FundWise may let Members enter Expenses in the real-world currency that was paid, but Balance and Settlement math must still run on a stable USD/USDC ledger value. We will use a current exchange-rate quote when an Expense is created or edited, store the Source Currency, original amount, converted amount, and Exchange Rate Snapshot, and avoid silently repricing historical Balances as market rates move.
