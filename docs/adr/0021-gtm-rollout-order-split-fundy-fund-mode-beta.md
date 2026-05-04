# Lock GTM rollout order — Split Mode → Fundy → Fund Mode invite-only beta

The order in which FundWise surfaces are exposed to users is fixed, even where engineering work runs in parallel. This is hard to reverse without re-pitching the product story and would surprise contributors who assume Fund Mode is part of the open Split Mode launch.

## Decisions

### Public order is Split → Fundy → Fund Mode

1. **Split Mode** ships first on **Solana mainnet** as the open public product. Settlement asset is **USDC** (see ADR-0011). This is what hackathon judges and early users see, and what we test in production.
2. **Fundy** companion agent ships second as a sibling product (separate repository — see ADR-0022). It is the second user-facing surface, and the engagement wedge that justifies opening Fund Mode.
3. **Fund Mode** opens as an **invite-only closed beta** to a curated cohort *after* Split Mode is stable in production and Fundy is in users' hands. Public availability is deferred until the Proposal lifecycle is genuinely complete and the treasury surface has been stress-tested with real groups.

### Phase numbers are engineering scope, not user rollout

`ROADMAP.md` numbers phases by engineering deliverable, not by the order they reach users. Phase 2 (Fund Mode MVP) ships engineering before Phase 4 (Fundy), but Fund Mode does not reach users until *after* Fundy. The "GTM and product order" section at the top of `ROADMAP.md` is the source of truth for user-facing sequencing.

### Hackathon submission stays Split-led

The hackathon story leads with Split Mode + USDC mainnet settlement. Fund Mode is treated as future-direction evidence only, never as the headline. This avoids tying the submission narrative to a treasury flow that will be gated to invited cohorts at launch.

## Why this matters

- Prevents the team from accidentally launching Fund Mode publicly because its engineering scope happens to land first.
- Anchors the Visa Frontier pitch (ADR-0024) on Split Mode + USDC, where the consumer story is strongest.
- Makes Fundy a release gate for Fund Mode, not an optional add-on.

## Supersedes / amends

- Amends `ROADMAP.md` Phase 2: Fund Mode MVP is now framed as an invite-only closed beta, not an open phase 2 release.
