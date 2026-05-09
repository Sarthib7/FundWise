# FundWise - Hackathon Track Plan

**Owner:** Sarthi
**Last updated:** 2026-05-08
**Hackathon:** Colosseum Frontier
**Primary submission deadline:** May 11, 2026
**Demo Day:** May 12, 2026
**Region:** Germany

See also:

- [STATUS.md](./STATUS.md) for current repo state
- [ROADMAP.md](./ROADMAP.md) for delivery phases
- [PRD.md](./PRD.md) for MVP scope

---

## Core submission story

The product story for judges should stay simple:

1. Create a private Group
2. Add Expenses
3. See live Group Balances
4. Open a Settlement flow for the debtor
5. Confirm an on-chain USDC transfer on Solana
6. Land on a clear Receipt

That is the primary demo path.

The competitive frame should be honest: FundWise is not entering an empty category, and crypto bill-splitting clones already exist. The demo should therefore avoid "first crypto Splitwise" language and focus on the sharper wedge: live USDC Settlement from a private Group Balance, Settlement Request Links that never go stale, wallet-confirmed execution, and a verified Receipt.

The company frame can be more ambitious than the demo: FundLabs builds the financial layer for groups, human or AI. FundWise is the first product, Fundy is the planned Telegram / personal-agent distribution product, and Receipt Endpoint is the planned agent-commerce audit trail. Use this in investor and accelerator contexts, but keep the 3-minute demo anchored to shipped Split Mode behavior.

Everything else is a supporting layer:

- `LI.FI` helps an EVM-first debtor route funds if their USDC is on another chain, ideally from inside the Settlement flow.
- `Zerion CLI` helps with wallet analysis, reminders, and agent-style assistance around the same core flow.
- `FundWise Agent` is the later assistant layer for reminders, draft Expenses, proof upload, and wallet-aware suggestions. Telegram bot and Telegram mini app are channels for it, not the product name.
- `Fundy` is the hosted Telegram bot that will run the FundWise Agent. Users authenticate by linking Telegram to their FundWise wallet, then interact with Groups from Telegram. Read-only and draft-safe; money movement still requires wallet confirmation.
- The `Agent Skill Endpoint` (`/skill.md`) is a public URL at **`https://fundwise.fun/skill.md`** that autonomous agents can `curl` to discover FundWise capabilities, allowed vs disallowed usage, and planned Scoped Agent Access; it must not expose private Member data.
- `Receipt Endpoint` is a planned FundLabs infrastructure product for structured, verifiable receipts for agent and on-chain payments. It is directionally related to Payable Settlement Requests and FundWise Receipts, but it is not shipped in the hackathon MVP.
- `Fund Mode` is the hero product direction and the post-submission beta sprint, but it is incomplete today and should not be presented as fully shipped until Proposal creation, approval/rejection, proof/history, and execution work end to end.

---

## Track priorities

### 1. Visa Frontier - Priority 1

**Why it fits:**

- FundWise is a consumer payments product
- The main demo is easy for judges to understand
- Split Mode already maps directly to "pay your friends"
- On-chain Receipts and instant settlement are concrete payment improvements

**What matters most:**

- Smooth web-app UX
- Wallet connect that preserves context instead of dropping users into a generic app state
- A clean Expense flow that does not imply Source Currency or Expense Proof are shipped before their ledger/storage paths are complete
- Exact-amount Settlement
- Clear Receipt
- Mobile-friendly flow
- Mainnet-beta target story

**What not to do:**

- Do not bloat the core path with sponsor logic
- Do not force asset choice at settlement time
- Do not turn the product into a chat app or wallet onboarding experiment before the main flow works

### 2. LI.FI - Priority 1

**Why it fits:**

- Some users will have funds on other chains
- LI.FI solves a real obstacle to completing the normal Solana USDC settlement path

**Current framing:**

The strongest LI.FI story is not "FundWise is a generic multichain app." The strongest story is:

`I owe money in a Group, my USDC is on another network, LI.FI routes what is needed, then I complete the normal Settlement flow.`

**Preferred MVP scope:**

- Show that LI.FI can route value from another chain into Solana USDC
- Present that path as `Route funds for Settlement` inside the Settle flow instead of teaching users the underlying route mechanics
- Return the user to the normal FundWise Group Settlement path
- Keep the Receipt and ledger model unchanged

**Secondary story and next-month priority:**

- LI.FI support for Fund Mode Contributions

### 3. Zerion CLI - Active sponsor focus

**Why it fits:**

- Zerion can strengthen wallet-awareness around settlement and treasury behavior
- A consumer-finance assistant angle is more distinctive than another DeFi agent

**Best near-term framing:**

- Wallet analysis before settlement
- Insufficient-funds guidance
- Reminder / suggestion layer
- Zerion CLI demo for group expense operations

**Explicitly later:**

- Embedded wallets
- Social login
- Replacing wallet-native identity in the MVP

### 4. Eitherway / Live dApp - Priority 3

This is worth pursuing only if the core FundWise product is already coherent and demo-ready. Do not chase deployment optics before the main Group flow is convincing.

### 5. Jupiter - Skip

Low fit for the current product direction.

---

## Track-by-track build framing

### Visa build framing

- Private Group creation
- Fast Expense entry
- Live Balances
- Settlement Request Links as the shareable repayment loop
- Exact USDC Settlement
- Receipt view

### LI.FI build framing

- Detect insufficient Solana USDC
- Offer cross-chain routing from the Settlement preview with app-owned language like `Route funds for Settlement`
- Land back in the same Group flow

### Zerion build framing

- Analyze wallet readiness
- Suggest next action
- Keep core settlement still wallet-native and user-authorized
- Use Zerion CLI as the implementation surface for the sponsor-track demo
- Frame assistant behavior as FundWise Agent capability, not a Telegram-specific product
- **Fundy (later):** Zerion CLI from the Railway bot for `/analyze`, `/readiness`, `/verify`; start with a free **`ZERION_API_KEY`**, optional **x402** on Solana for pay-per-call demos
- **Payable Settlement Requests (research):** x402 / MPP / pay.sh-style agent-paid settlement is promising, but should stay post-MVP unless implemented end-to-end with Scoped Agent Access, exact USDC amounts, idempotency, payment verification, and normal Receipt generation.
- **Agent Spending Policies (research):** before any agent-paid Settlement ships, Members need configurable payment caps and human fallback. This is a future safety story, not a hackathon demo claim.

---

## Delivery plan through the deadline

### April 26 to early May

- Finish Split Mode frontend polish first
- Sign off responsive behavior across desktop and mobile
- Tighten Receipt, join flow, and Group-page UX before backend and sponsor branches
- Lock and implement post-connect behavior: invite links return to the same Group with a clear Join action, Settlement Request Links reopen the live settlement state, and plain `/groups` opens create immediately for zero-state users
- The frontend pass is largely in place; remaining work is manual QA plus devnet settlement and receipt hardening

### Early May

- Harden backend trust model and verified ledger writes
- Tighten on-chain settlement behavior and devnet wiring
- Add LI.FI Settlement routing branch
- Add Zerion CLI support around wallet readiness and guidance
- Keep Fund Mode claims honest for the submission, but index and start the one-month Fund Mode beta sprint immediately after the shipped Split Mode proof is stable
- Prepare judge-friendly demo script

### Final stretch before May 11, 2026

- Audit the contract / on-chain surface
- Rewire frontend, backend, and sponsor integrations into one coherent flow
- Run full end-to-end devnet testing
- Rehearse end-to-end flows
- Record demos
- Write submission copy
- Keep the product story brutally simple

---

## Messaging guardrails

- Say `Group`, not `circle`
- Say `Settlement`, not `payment`, in Split Mode
- Say `Contribution` and `Proposal` only for Fund Mode
- Say `USDC` clearly and often in the MVP story
- Say `Source Currency` for what someone paid in, and `USDC` for the ledger / Settlement value
- Say `Expense Proof` for uploaded merchant receipts; reserve `Receipt` for Settlement confirmation
- Say `FundWise Agent`, not `Telegram agent`
- Say `Fundy` for the hosted Telegram bot, not `the bot` or `FundWise Telegram`
- Say `Agent Skill Endpoint` for the public `/skill.md` discovery URL
- Say `Scoped Agent Access` for the agent permission model
- Say `web app first`
- Say `wallet-native`

Avoid these claims in the main pitch unless they are actually shipped:

- Gasless
- Multichain-native settlement
- Any-chain or any-currency Settlement
- Automatic Settlement
- Live yield-bearing Treasuries
- Social-login-first onboarding
- Telegram-first product surface
- AI-native expense entry
- Fundy as a shipped product (it is planned, not shipped)
- Receipt Endpoint as a shipped product (it is planned, not shipped)
- Scoped Agent Access or autonomous agent payment as a shipped feature
- Payable Settlement Requests or autonomous money movement as shipped features. They are documented research, not part of the current demo path.
- Source Currency entry or Expense Proof upload as shipped features. They are future-only for the current public demo.
- Mini-games, private games, or prediction-market-like mechanics as part of FundWise.
- Unlimited agent spending, broad API keys, or prompt-only authorization for financial actions.

For future expansion after the core demo path is solid:

- Telegram is a strong distribution layer because the real groups already exist there, but it should call into the same FundWise wallet-bound engine rather than becoming a separate ledger product.
- **Fundy** is the hosted Telegram bot that will run the FundWise Agent. It is a distribution surface for the same wallet-bound engine, not a separate product.
- The **Agent Skill Endpoint** (`/skill.md`) lets any autonomous agent curl the FundWise domain and discover what FundWise can do. Private data and durable agent actions still require planned Scoped Agent Access, not broad API keys.
- Agent skills and personal-agent access are promising only if they operate through scoped capabilities instead of broad raw API keys.
- FundWise Agent can eventually support Telegram reminders, draft-safe Expense creation, proof upload, and Group summaries, but money movement still returns to app-and-wallet confirmation.
- Fundy still gives FundWise distribution in existing Telegram groups, but Fund Mode engineering now moves first as the hero-product beta. Public Fund Mode claims still wait until Proposal execution is real.
- Wallet mini apps and native mobile should come after the shared engine is stable enough to support multiple clients cleanly.
- Stablecoin-only UX with fee abstraction, smoother on/off ramps, and web2-friendly funding rails is a strong long-range direction, but it should stay out of the core hackathon pitch until the main crypto-native path is solid and a concrete card/IBAN partner path exists.

---

## Risk management

### Biggest product risk

Trying to make Visa, LI.FI, Zerion, Telegram, social login, embedded wallets, and Fund Mode all first-class at once.

**Mitigation:** keep one primary narrative:

`Split Mode web app with USDC settlement on Solana`

### Biggest technical risk

Mainnet-beta settlement friction:

- missing USDC
- missing SOL for gas
- missing recipient token account
- confusing wallet behavior on mobile
- insecure or unverified ledger writes

**Mitigation:** harden those paths before adding more feature branches.

### Build-order guardrail

Do the work in this order:

1. Frontend responsiveness and UX sign-off
2. Backend trust hardening and verified receipts
3. On-chain settlement / devnet hardening
4. LI.FI support layer
5. Zerion support layer
6. Contract audit
7. Full-stack rewiring
8. End-to-end devnet testing

This keeps the MVP narrow while still leaving room for sponsor-track demos.

### Biggest demo risk

Judges get a sponsor integration demo without understanding the product.

**Mitigation:** show the Group flow first, then show sponsor layers as optional support.

---

## Sponsor references

- LI.FI docs: [https://docs.li.fi/](https://docs.li.fi/)
- Zerion CLI docs: [https://developers.zerion.io/build-with-ai/zerion-cli](https://developers.zerion.io/build-with-ai/zerion-cli)

Use the vendor docs only to strengthen the chosen product path, not to invent a new one.
