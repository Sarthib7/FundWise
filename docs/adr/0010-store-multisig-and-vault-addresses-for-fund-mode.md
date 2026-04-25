# Store both Squads multisig and vault addresses for Fund Mode

Fund Mode needs two distinct on-chain identities: the Squads multisig PDA for proposal/approval flows and the vault PDA that actually receives treasury assets. A single `treasury_address` field is not enough without losing future proposal capability, so FundWise stores both `multisig_address` and `treasury_address`.
