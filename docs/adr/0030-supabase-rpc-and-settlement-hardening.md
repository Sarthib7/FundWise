# Supabase RPC and Settlement hardening

Before the mainnet cutover, sensitive Supabase RPCs must be executable only by `postgres` and `service_role`, and Settlement idempotency must be enforced with a database-level unique index on `settlements.tx_sig`. We verified this live through the Supabase SQL Editor on 2026-05-14 and captured the same requirements in a migration so future databases do not rely on app-level checks or manual SQL memory.
