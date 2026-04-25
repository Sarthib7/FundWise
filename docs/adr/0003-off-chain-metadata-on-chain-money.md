# Off-chain group metadata, on-chain money movement

Storing every expense on-chain is expensive and slow; storing money movements off-chain is insecure and unverifiable. Group metadata (name, members, expense line items, split config) lives in Firebase Realtime DB (fast, editable, private). Money movement — SPL token transfers for settlements and fund contributions — is always on-chain, with the tx signature written back to the off-chain record as proof.

**Consequences:** No custom Anchor program needed for Split Mode — plain SPL transfers suffice. Firebase is a single point of trust for who-owes-whom until settled; acceptable for friend-group trust model.