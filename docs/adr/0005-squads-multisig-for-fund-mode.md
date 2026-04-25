# Squads multisig for Fund Mode treasury

Status: tentative — revisit before Fund Mode implementation.

Fund Mode needs a shared treasury with threshold approvals. Two options: (a) Squads Protocol multisig, (b) custom Anchor vault program. Starting with Squads — the @sqds/multisig integration is already wired. If UX friction for non-technical users is too high, build a thin custom Anchor program later.

**Consequences:** Phase 2 ships faster. Squads UX may need to be abstracted behind our own UI for casual users.