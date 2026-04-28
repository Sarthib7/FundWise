# Wallet-signed session cookies for server mutations

FundWise now protects write routes with a short-lived, wallet-signed session cookie before using the Supabase service role on the server. We chose this because the MVP identity is still the Solana wallet, but mainnet-bound ledger writes need prior authorization that is stronger than open client-side RLS and does not force a full migration into Supabase Auth before the demo path is hardened.
