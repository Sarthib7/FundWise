# Off-chain group metadata, on-chain money movement

Storing every expense on-chain is expensive and slow; storing money movements off-chain is insecure and unverifiable. Group metadata lives in the app database layer off-chain, while money movement — SPL token transfers for Settlements and Contributions — is always on-chain, with the tx signature written back to the off-chain record as proof. See [0009-switch-from-firebase-to-supabase.md](./0009-switch-from-firebase-to-supabase.md) for the storage-backend change from Firebase to Supabase.

**Consequences:** No custom Anchor program is needed for Split Mode. The off-chain ledger remains the source of truth for who-owes-whom until a Settlement is recorded on-chain.
