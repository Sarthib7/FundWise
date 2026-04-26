# Store global profile display names separately from group memberships

FundWise uses one wallet-native identity across many Groups, so a profile display name must belong to the wallet rather than to any single Group membership row. We store the global name in a `profiles` table keyed by wallet and sync it into `members.display_name` for current UI compatibility, because this preserves the product invariant that one profile display name is reused across Groups without forcing an immediate broader data-model rewrite.
