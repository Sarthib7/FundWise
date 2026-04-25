# Drop ZK compression, Meteora/Raydium, Kalshi, Light Protocol

These were hackathon-only features with no user demand. They added dependency weight, attack surface, and maintenance burden. All removed: kalshi-typescript, @lightprotocol/*, prediction-market code, ZK compression scaffolding, liquidity pool integrations, @abstract-foundation/agw-client, @privy-io/react-auth, permissionless.

**Consequences:** Leaner bundle, faster builds. Revisit ZK compression if cost becomes a real problem at scale.