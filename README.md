# Fund Flow

Fund Flow is a next-generation social fundraising platform built on Solana, enabling friend groups to collaboratively raise funds through shared liquidity pools. The platform leverages ZK Compression for massive cost savings, integrates with Meteora DLMM for passive yield, and uses Squads Protocol for secure multi-signature treasury management.

---

## Features

- Invite-to-Earn: Group creators deposit funds for invite tips; friends join via invite codes and receive compressed tokens as tips, reserved in the group pool.
- Shared Liquidity Pools: Pool funds collectively in multi-signature wallets with compressed state storage.
- Passive Yield Generation: Deploy pooled funds to liquidity pools (Meteora DLMM or Raydium) for yield.
- Mini Prediction Markets: Create challenges with prize pools and consensus voting.
- Real-Time Dashboard: Transparent allocations, yields, and group management.
- ZK Compression: 98.75% cost reduction for account and token storage.

---

## Platform Architecture

- **Frontend:** Next.js + React
- **SDK Layer:** TypeScript (group management, compressed tokens, LP interface)
- **Solana Programs:** Rust (group manager, compressed pool, challenge markets)
- **Multi-Sig:** Squads Protocol
- **Liquidity Pools:** Meteora DLMM, Raydium AMM
- **Compression:** Light Protocol (ZK Compression, concurrent Merkle trees)

---

## Getting Started

### Prerequisites

- Solana CLI ([Install Guide](https://solana.com/docs/cli/install-solana-cli))
- Anchor CLI (for smart contract development)
- Rust toolchain
- Node.js & npm (for frontend)
- Wallet with SOL (for devnet/mainnet testing)


## Installation

Clone the repository:
```bash
git clone https://github.com/Hrishikesh332/FundFlow.git
cd fund-flow
```

Install dependencies (for client):
```bash
npm install
```

## Usage

- Deploy programs to devnet:
```bash
anchor deploy
```


- Run initialization script:

```bash
ts-node scripts/initialize.ts
```

- Start frontend dashboard:
```bash
npm run dev
```


## Contributing

Contributions are welcome! Please read the [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting issues and pull requests[web:38][web:50].

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Support

If you have questions or need help, open an issue in this repository or contact the maintainer at your.email@example.com[web:38][web:50].

## Maintainers
- Hrishikesh (@Hrishikesh332)
- Sarthi (@SarthiBorkar)
