# Wallet-only auth; no email/password

Users are assumed crypto-comfortable. Identity = connected Solana wallet. Display names are user-chosen labels stored alongside the wallet address. No Firebase Auth, no email, no account recovery flow. The current MVP join path is self-serve via share-link or QR.

**Consequences:** Wallet loss = data loss for that wallet's view. Group data survives because it's keyed by wallet addresses. Social login, embedded wallets, and pending-member abstractions are deferred from the MVP.
