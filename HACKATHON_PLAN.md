# FundWise - Hackathon Track Plan

**Owner:** Sarthi
**Last updated:** 2026-04-29
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

Everything else is a supporting layer:

- `LI.FI` helps an EVM-first debtor arrive at Solana USDC if their funds are on another chain, ideally through a simple `Add funds` / `Top up to settle` experience.
- `Zerion CLI` helps with wallet analysis, reminders, and agent-style assistance around the same core flow.
- `FundWise Agent` is the later assistant layer for reminders, draft Expenses, proof upload, and wallet-aware suggestions. Telegram bot and Telegram mini app are channels for it, not the product name.
- `Fund Mode` broadens the product story, but it is incomplete and should not be presented as the current mainline product path.

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
- Expense entry that can preserve the original Source Currency while converting into a stable USD/USDC ledger value
- Optional receipt-photo upload as Expense Proof
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

`I owe money in a Group, my funds are not on Solana, LI.FI helps me top up into Solana USDC, then I complete the normal Settlement flow.`

**Preferred MVP scope:**

- Show that LI.FI can route value from another chain into Solana USDC
- Present that path as `Add funds` / `Top up to settle` instead of teaching users the underlying route mechanics
- Return the user to the normal FundWise Group Settlement path
- Keep the Receipt and ledger model unchanged

**Secondary story, if time allows:**

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
- Exact USDC Settlement
- Receipt view

### LI.FI build framing

- Detect insufficient Solana USDC
- Offer cross-chain top-up path with app-owned language like `Add funds` or `Top up to settle`
- Land back in the same Group flow

### Zerion build framing

- Analyze wallet readiness
- Suggest next action
- Keep core settlement still wallet-native and user-authorized
- Use Zerion CLI as the implementation surface for the sponsor-track demo
- Frame assistant behavior as FundWise Agent capability, not a Telegram-specific product

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
- Add LI.FI top-up branch
- Add Zerion CLI support around wallet readiness and guidance
- Keep Fund Mode in maintenance-only status unless the core Split Mode plus LI.FI path is already coherent
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
- Say `web app first`
- Say `wallet-native`

Avoid these claims in the main pitch unless they are actually shipped:

- Gasless
- Multichain-native settlement
- Social-login-first onboarding
- Telegram-first product surface
- AI-native expense entry

For future expansion after the core demo path is solid:

- Telegram is a strong distribution layer because the real groups already exist there, but it should call into the same FundWise wallet-bound engine rather than becoming a separate ledger product.
- Agent skills and personal-agent access are promising only if they operate through scoped capabilities instead of broad raw API keys.
- FundWise Agent can eventually support Telegram reminders, draft-safe Expense creation, proof upload, and Group summaries, but money movement still returns to app-and-wallet confirmation.
- Wallet mini apps and native mobile should come after the shared engine is stable enough to support multiple clients cleanly.
- Stablecoin-only UX with fee abstraction, smoother on/off ramps, and web2-friendly funding rails is a strong long-range direction, but it should stay out of the core hackathon pitch until the main crypto-native path is solid.

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
