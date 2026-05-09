# Fund Mode Beta Rehearsal

FW-032 requires a live devnet run with wallet signatures before Fund Mode claims change from beta/planned to complete. The repeatable path is scripted in `scripts/fund-mode-beta-rehearsal.mjs`.

## Setup

1. Pick a devnet creator wallet keypair and get its address.
2. Start the app with that wallet enabled for invite-only Fund Mode:

   ```sh
   FUNDWISE_FUND_MODE_INVITE_WALLETS=<creator-wallet> pnpm dev
   ```

3. In another shell, run:

   ```sh
   FUNDWISE_REHEARSAL_CREATOR_KEYPAIR=/path/to/creator.json pnpm fund:rehearsal
   ```

The script refuses non-devnet RPC URLs. If public devnet airdrops are rate-limited, set `FUNDWISE_REHEARSAL_FUNDER_KEYPAIR` to a funded devnet keypair.

Before spending devnet SOL, the script checks that the remote Supabase schema has the Fund Mode Proposal columns from:

- `supabase/migrations/20260509120000_anchor_proposals_to_squads_governance.sql`
- `supabase/migrations/20260509123000_add_proposal_audit_trail.sql`

If this preflight fails, apply the pending migrations to the Supabase project and rerun. The checked-in schema already contains the required columns; the failure means the remote project is behind the repository.

## Latest Run

On 2026-05-09, the rehearsal confirmed:

- invite-only Fund Mode Group creation
- second Member invite join
- Squads v4 Treasury initialization with `multisigCreateV2`
- stablecoin Contribution into the Squads vault token account

The run stopped before Proposal creation because the remote Supabase project was missing checked-in Fund Mode Proposal migrations. The Supabase CLI could not apply them from this environment because the active account lacks project-level privileges.

## Coverage

The rehearsal creates an invite-only Fund Mode Group, joins a second Member through the invite path, initializes a Squads Treasury, records a stablecoin Contribution, creates a reimbursement Proposal, records a Squads approval, executes the Squads vault transaction, and prints LI.FI/Zerion support checks.

LI.FI routing is checked as a support path only. On devnet, LI.FI is expected to be disabled because routes target Solana mainnet. Zerion remains read-only and is checked through the documented `pnpm zerion:readiness` modes.
