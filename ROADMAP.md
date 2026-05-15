# FundWise — Roadmap

Phased plan from the current state through the Solana Summit Berlin launch and the multi-chain / fiat-onramp expansion that follows. See [STATUS.md](./STATUS.md) for the current checkpoint and [PRD.md](./PRD.md) for the locked MVP shape.

---

## Headline milestone — Solana Summit Berlin (2026-06-13)

**Split Mode mainnet = firm. Fund Mode mainnet closed beta = gated stretch** ([ADR-0041](./docs/adr/0041-fund-mode-mainnet-closed-beta-gated-stretch.md)) — default = devnet beta continues, mainnet flip iff gate clears by 2026-06-06. Everything below ordered around hitting Summit with coherent story under either variant.

FundLabs umbrella: financial layer for groups — human or AI. Three products in market by Summit:

- **FundWise** — shared finance, Split + Fund Modes.
- **Fundy** — Telegram-native agent + MCP server. **Live on Railway since 2026-05-15.** FundLabs product, not "just a surface" ([ADR-0039](./docs/adr/0039-fundy-is-a-product-and-agent-as-member-north-star.md)).
- **Receipt Endpoint** — standalone Solana tx → structured receipt service. Railway-hosted, x402/MPP payable, MCP-catalog-listed. **Ships by Summit** ([ADR-0040](./docs/adr/0040-receipt-endpoint-ships-standalone.md)).

The current rollout order:

**Summit Berlin launch (2026-06-13) — items 1, 2, 3, plus Fundy companion ship together:**

1. **Split Mode on Solana mainnet** — public, open wedge. Settlement asset is **USDC** ([ADR-011](./docs/adr/0011-fix-usdc-as-the-mvp-settlement-asset.md)). Wallet-native Groups, verified transfers, session-gated ledger access, Receipts.
2. **Fund Mode — gated stretch to mainnet closed beta** ([ADR-0041](./docs/adr/0041-fund-mode-mainnet-closed-beta-gated-stretch.md)). Default = devnet invite-only beta continues. Mainnet flip *only if* four gates clear by 2026-06-06: Proposal lifecycle end-to-end ≥3 wallets w/ mirrored status matching Squads on-chain; all four fee flows clean w/ `platform_fee_ledger` reconciliation; trusted ≤10-Member cohort identified + briefed; Squads program audit references checked. Otherwise → devnet at Summit, mainnet post-Summit. Pre-written Variant A (mainnet) + Variant B (devnet) copy in ADR-0041.
3. **Multi-chain participation** via Circle **CCTP + LI.FI** — EVM and other wallets can join Groups; CCTP/LI.FI converts inbound funds to USDC on Solana. Solana mainnet remains the ledger and Settlement venue. **Pulled into the Summit launch scope on 2026-05-16** — the LI.FI integration is built; the remaining work is mainnet pipeline, CCTP routing config, UX polish, and an end-to-end mainnet test.
4. **Fundy** — FundLabs product ([ADR-0039](./docs/adr/0039-fundy-is-a-product-and-agent-as-member-north-star.md)). Telegram-native personal finance agent + MCP server for external agents. Live on Railway since 2026-05-15, separate repo ([ADR-0022](./docs/adr/0022-fundy-moves-to-a-separate-repository.md)), calls FundWise over public HTTP. Money movement still deep-links to web app for wallet confirmation. Tax advisory ([ADR-0023](./docs/adr/0023-tax-advisory-and-filing-live-in-fundy.md)) lives in Fundy. **Agent-as-hands via Scoped Agent Access ships at Summit; agent-as-Member is the north-star direction** (own wallet, own allocation, own Member identity — see ADR-0039).
5. **Receipt Endpoint** — standalone Railway service ([ADR-0040](./docs/adr/0040-receipt-endpoint-ships-standalone.md)). Solana tx sig in → structured receipt JSON out, IPFS-pinned, payable per call via x402/MPP, listed in pay-skill / x402 MCP catalog. Any Solana tx accepted; FundWise Settlements = premium first-class source. Decoupled from Payable Settlement Requests + Scoped Agent Access — no FundWise dependency required to ship.

**Post-Summit:**

6. **Fiat onboarding** via **Privy + MoonPay + Bridge.xyz + Squads Protocol** — per-user embedded Solana wallet (Privy, non-custodial via TEE shards), card top-ups (MoonPay), bank rails (Bridge.xyz SEPA / IBAN / wire), and group treasury (Squads Protocol, already integrated). Settles to USDC on Solana underneath. Altitude is ruled out (it's a competing consumer-business neobank, not embeddable infra).
7. **Payable Settlement Requests + agent-paid Settlement** — `settlement:pay` authority with explicit caps, asset, expiry, revocation. Enables the full agent-as-Member path: Treasury → agent wallet allocations via approved reimbursement Proposals targeting the agent's wallet, agent-driven Expense logging at scale, Receipt Endpoint queries scoped to agent wallets as first-class.

Planning thesis: the market already has strong web2 substitutes and several crypto-native bill-splitting attempts. FundWise's wedge is **verified USDC Settlement for real private Groups**, with Settlement Request Links as the acquisition loop, and pooled USDC Treasuries as the durable-group product. Multi-chain inbound (Circle CCTP) is now part of the Summit launch; fiat onboarding remains explicitly post-Summit.

---

## Now — Split Mode + Fund Mode mainnet for Summit Berlin

**Goal:** Split Mode public on mainnet, Fund Mode graduated from devnet beta to mainnet, both reliable enough to demo and onboard real Groups at the Summit.

### Split Mode mainnet

**Already shipped:**

- Group CRUD UI, zero-state Group creation, invite link + QR join flow
- Expense entry with equal / exact / percentage / shares split methods
- Balance computation and simplified settlement graph
- Settlement receipt route, Activity Feed
- Creator-owned Expense edit/delete with later-Settlement guard
- Settlement Request Link flow, total settled volume display, Group profile editing
- Responsive pass across landing, Group list, Group page, Receipt, modals
- Wallet-signed session cookies for protected actions
- Authenticated server-side ledger writes for Groups, Members, Expenses, Settlements, Contributions, profile updates
- Session-aware Group and Receipt reads (no public browser ledger reads)
- RPC verification before persisting Settlement and Contribution receipts
- Distributed rate limit on every money-moving route ([FW-054](./issues.md))

**Still to finish:**

- Manual breakpoint QA across landing, Group list, Group page, join, dialogs, Receipt
- Mainnet USDC mint wiring, insufficient-USDC and insufficient-SOL states, ATA-creation messaging
- Production RPC and recipient USDC token-account auto-creation inside the Settlement flow
- Operator runbook execution (Supabase, Cloudflare, RLS verification) per [docs/ops-runbook.md](./docs/ops-runbook.md)
- Mainnet cutover per [docs/split-mode-mainnet-checklist.md](./docs/split-mode-mainnet-checklist.md)

**On-chain rule:** keep Split Mode on the simplest credible path — direct USDC settlement plus the minimum on-chain handling required for safety. No new custom contracts on this surface.

**Exit criterion:** a real user opens the web app on mobile or desktop, joins a Group, logs Expenses, settles their net Balance in USDC on Solana mainnet, and lands on a usable Receipt.

### Fund Mode mainnet

**Goal:** graduate Fund Mode from invite-only devnet beta to mainnet as the hero product for durable Groups. Beta validation work is captured in [docs/fund-mode-beta-checklist.md](./docs/fund-mode-beta-checklist.md).

**Already in the repo:**

- Group creation supports Fund Mode
- Treasury initialization
- Contribution history and on-chain Treasury balance display
- Multisig + vault address storage
- DB migration `20260515100000_fund_mode_beta_completion.sql` (roles, proposal kinds, monetization)
- Server enforcement: role permissions, proposal kinds, monetization mutations, cluster-aware Fund Mode
- Role / creation-fee / monetization / leave / admin endpoints
- Fund Mode beta UI banners, exit survey, nullable proposal fields

**Still to ship before Summit:**

- Proposal creation, approval/rejection, execution end-to-end with Squads-backed Treasury movement
- Proposal proof, comments, edit history, visible rejection history (no Group-wide chat)
- Reimbursement-first Proposals where Treasury payouts go to Member wallets only
- Threshold-approval execution callable by any Member
- Signer-management rules after Treasury initialization
- Better Contribution UX
- Mainnet cluster wiring + invite gate removal once stable

**Exit criterion:** a Fund Mode Group on mainnet can initialize a Treasury, accept Contributions, create a reimbursement Proposal, approve or reject it, and execute the approved reimbursement.

### Fundy companion (alongside Summit launch)

Fundy lives in a separate repository ([ADR-0022](./docs/adr/0022-fundy-moves-to-a-separate-repository.md)) and calls FundWise over public HTTP plus the Agent Skill Endpoint. Hosted Telegram bot, command-first v1, LLM layer later.

The FundWise side of the linkage is shipped:

- Telegram link-code flow (`/api/telegram/link-code`, wallet-session gated)
- Service-key gated Fundy endpoints (`/api/telegram/link` GET/POST/DELETE)
- DB tables with RLS on, service-role-only access

Capability scope at launch: personal finance for the individual user, read-only and draft-safe Group operations, group-chat mode after every Member authenticates. On-chain actions (settle, contribute, execute) deep-link back to the web app for wallet confirmation.

---

## Summit launch — Multi-chain participation via CCTP + LI.FI

**Goal:** let Members on EVM and other non-Solana wallets participate in Groups without forcing the FundWise ledger off Solana. **In Summit launch scope as of 2026-05-16.**

**Mechanism:**

- **Circle CCTP** for native USDC across supported chains.
- **LI.FI** for source-asset and route selection when the Member doesn't already hold USDC on a CCTP-supported chain.
- Inbound funds **always convert to USDC on Solana** before they touch the FundWise ledger. Solana mainnet is still the only ledger and Settlement venue.
- Surface in the Settlement / Contribution flow as a Member choice ("settle from another chain") rather than a separate dashboard.

**Hard rules:**

- Settlement asset stays USDC on Solana. CCTP/LI.FI is an inbound rail, not a multi-ledger product.
- Off-chain ledger model does not change.
- No multi-chain claims in launch copy until each route actually works end-to-end with verified Receipts.

**Already shipped:**

- `lib/lifi-config.ts` — EVM (Ethereum/Base/Arbitrum/Optimism/Polygon) + Solana providers wired, USDC addresses mapped
- `lib/lifi-bridge.ts` — full quote → sign → execute flow with status callbacks
- `components/cross-chain-bridge-modal.tsx` — bridge UI surfaced in Settlement (FW-004) and Contribution (FW-030) flows
- `pnpm lifi:readiness` — mainnet routes for Ethereum/Base/Arbitrum/Optimism/Polygon USDC → Solana USDC are validated

**Still to ship before Summit:**

- Devnet → mainnet release pipeline with a staging/beta gate before public mainnet
- Default-to-mainnet cluster switch in `components/solana-wallet-provider.tsx` / `components/wallet-provider.tsx` with env-var override
- CCTP routing config in LI.FI (`preferBridges`/`allowBridges`) — decision pending: CCTP-only vs prefer-CCTP-with-fallback
- "Powered by Circle CCTP" branding inside the bridge modal; surface which rail the active quote used
- End-to-end mainnet test with a tiny (~1 USDC) Base → Solana route, documented and reproducible

**Open verifications:** fee/quote display polish, route-success monitoring, recipient ATA handling for cross-chain originated flows.

---

## Later — Fiat onboarding for non-crypto users

**Goal:** make FundWise usable by people who don't currently hold crypto or a wallet.

**Stack (locked 2026-05-16):**

- **Privy** — per-user embedded Solana wallet, non-custodial via TEE shards, silent provisioning on email / Apple / Google signup, invisible gas via Privy's native fee-payer.
- **MoonPay** — headless card top-up (Apple Pay etc.); USDC-on-Solana straight to the Privy wallet.
- **Bridge.xyz** — bank rails (SEPA / SEPA Instant / IBAN / wire) → USDC-on-Solana to the Privy wallet. Stripe-owned; documented EUR IBAN issuance.
- **Squads Protocol** — already integrated; each FundWise Group is a Squads multisig holding USDC. Contributions flow from the user's Privy wallet → the Group's Squads multisig.
- **Altitude is ruled out** — it's Squads' own consumer-business neobank built on Squads API, not embeddable infra. Using it would mean sending users to a competing app instead of building on infrastructure.

**Hard rules:**

- Wallet provisioning via Privy is opt-in (email/social signup path). Self-custody via wallet-adapter remains the default for crypto-native users.
- KYC, holding limits, and offboarding rails follow what the partner provides — do not invent these in-house.
- Do not claim "no crypto needed" in copy until top-up → Group contribution actually works for a fiat-only user end-to-end.

**Open verification before spike:** does Bridge.xyz let SEPA/IBAN settle USDC directly to a Privy-managed Solana address, or is there a "destination must be Bridge-provisioned" gotcha in the EU flow?

**Sibling card-rail track (long-range):** USDC settled in a Group should eventually be spendable at Visa merchants via partners like **KAST**, **Avici**, or **Rain** (Rain is the only one with a developer-facing card-issuing API today). Treat as partner work, not core product, until a concrete integration exists.

---

## Sibling work — Fundy, Agent Skill Endpoint, Scoped Agent Access

These move on Fundy's own track but depend on FundWise contracts staying stable.

- **Agent Skill Endpoint** (`/skill.md`): live at `https://fundwise.fun/skill.md`. Purpose, allowed/forbidden calls, auth, limits, errors. Any agent can `curl` it.
- **Scoped Agent Access API**: permission model for autonomous agents — scoped capabilities tied to Member wallet, Group, and action type (read, draft, comment). Money-moving action types still require direct wallet confirmation. Capability grants with expiration and revocation.
- **Payable Settlement Requests** (research, [docs/agentic-settlement-endpoint.md](./docs/agentic-settlement-endpoint.md)): x402, MPP, pay.sh-style flows. First prototype is USDC-only, exact amount, short expiry, idempotent, Receipt-only after verified payment proof.
- **Agent Spending Policy** ([docs/agent-payment-policy.md](./docs/agent-payment-policy.md)): Member-configured payment caps, Group scope, asset scope, counterparty scope, expiry, revocation, human fallback.

---

## Out-of-scope and explicit non-claims

These should not appear in launch copy or be built into the core product unless a phase explicitly ships them:

- Multi-chain settlement (Solana stays the ledger)
- Any-chain or any-currency Settlement
- Gas abstraction / gasless settlement
- Social login as a replacement for wallet identity
- Embedded-wallet-only onboarding
- Live yield-bearing Treasuries
- AI-native expense entry beyond draft-safe Fundy/FundWise Agent flows
- Mini-games or prediction-market mechanics — out of FundWise entirely
- Autonomous-agent money movement (planned via Payable Settlement Requests post-Summit)
- Scoped Agent Access agent-as-Member full path (north-star direction; agent-as-hands token-scoped slice ships at Summit per ADR-0039)
- Receipt Endpoint as a coupled FundWise-only product (superseded — ships standalone per ADR-0040)
- Source Currency entry and Expense Proof upload until each is implemented end to end
- Unlimited agent spending, broad API keys, or prompt-only authorization for money movement

---

## Long-range expansion (after the three launch phases above are reliable)

- Multi-stablecoin support
- Broader Source Currency capture with Exchange Rate Snapshot storage
- Native mobile app once the shared engine and secondary surfaces are stable
- Telegram mini app and wallet mini-dapp distribution
- AI bill parsing beyond receipt-photo upload
- Yield routing (e.g. Meteora) for idle Treasury USDC, only after Fund Mode mainnet is stable
- Production card rails through Rain / KAST / Avici partners
- Activation, settlement, and treasury analytics; production monitoring; mainnet support tooling
