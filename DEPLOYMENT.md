# Edge Functions Deployment Guide

**Target:** Supabase project (URL from `NEXT_PUBLIC_SUPABASE_URL`)
**Prereqs:**
- Supabase CLI installed: `npm install -g supabase`
- Logged in: `supabase login`
- Local project linked: `supabase link --project-ref <PROJECT_REF>`
- Service role key: `SUPABASE_SERVICE_ROLE_KEY` (from Supabase Dashboard → Settings → API)

---

## 1. Edge Functions to Deploy

All functions live under `supabase/functions/` (create if missing).

| Function | Route | Purpose |
|---|---|---|
| `expense` | `POST /api/functions/v1/expense` | Create expense + splits + update group balance |
| `expense-update` | `POST /api/functions/v1/expense/update` | Update expense (owner-only) |
| `expense-delete` | `POST /api/functions/v1/expense/delete` | Delete expense (owner-only, pre-settlement) |
| `settlement` | `POST /api/functions/v1/settlement` | Create settlement row + lock balances |
| `contribution` | `POST /api/functions/v1/contribution` | Fund Mode contribution to Treasury |
| `profile-name` | `POST /api/functions/v1/profile/name` | Update member display name |
| `zerion-portfolio` | `GET /api/functions/v1/zerion/portfolio` | Proxy to Zerion portfolio API |
| `zerion-transactions` | `GET /api/functions/v1/zerion/transactions` | Proxy to Zerion transactions API |

---

## 2. Deploy All Functions (one-shot)

```bash
# Create supabase/functions/ directory structure if not present
mkdir -p supabase/functions

# Deploy all .ts files in supabase/functions/
for fn in supabase/functions/*.ts; do
  name=$(basename "$fn" .ts)
  echo "Deploying $name..."
  supabase functions deploy "$name" --no-verify-jwt
done

# Alternatively, deploy individually:
# supabase functions deploy expense --no-verify-jwt
# supabase functions deploy expense-update --no-verify-jwt
# supabase functions deploy expense-delete --no-verify-jwt
# supabase functions deploy settlement --no-verify-jwt
# supabase functions deploy contribution --no-verify-jwt
# supabase functions deploy profile-name --no-verify-jwt
# supabase functions deploy zerion-portfolio --no-verify-jwt
# supabase functions deploy zerion-transactions --no-verify-jwt
```

**Notes:**
- `--no-verify-jwt` is used because the functions verify JWT themselves via `request.jwt`. The `verifyJwt` flag on the Supabase gateway would reject unsigned requests; we handle auth inside.
- Each function runs with the service role key (elevated privileges). Ensure RLS policies are enforced within the function's SQL queries or via explicit ownership checks.

---

## 3. Environment Variables (set per-function)

In Supabase Dashboard → Functions → `<function-name>` → **Configuration**:

```
ZERION_API_TOKEN=zk_dev_XXXXXXXXXXXXXXXXXXXX
SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
# Optional: Jupiter/LiFi keys for swap provider (if not embedded in Next.js server-side)
JUPITER_API_KEY=...
LIFI_API_KEY=...
```

For local development, use `supabase secrets set`:

```bash
supabase secrets set ZERION_API_TOKEN=zk_dev_XXX --project-ref <PROJECT_REF>
```

---

## 4. Database Migrations (audit_log + RLS)

Deploy SQL migrations from `supabase/migrations/`:

```bash
supabase db push
```

Key migrations:
- `20260426_audit_log.sql`: creates `audit_log` table, indexes, triggers
- `20260426_rls_policies.sql`: member-scoped RLS on `expenses`, `settlements`, etc.
- `20260426_unique_constraints.sql`: unique indexes on `(group_id, settlement_id)`

---

## 5. Verify Deployment

```bash
# List functions
supabase functions list

# Test one function (dry-run)
curl -X POST https://<project-ref>.supabase.co/functions/v1/expense \
  -H "Authorization: Bearer <user-jwt>" \
  -H "Content-Type: application/json" \
  -d '{"groupId":"test","amount":1000,"description":"test","splits":[...],"payerId":"..."}'
```

Expected response: `400` with structured error `{code: 'ERROR_CODE', message: '...'}` if auth/validation fails — function is live.

---

## 6. Next: client migration

After functions are live, update Next.js client code to use:

```ts
// From:
await supabase.from('expenses').insert({...});

// To:
await supabase.functions.invoke('expense', {
  body: { groupId, amount, description, splits, payerId }
});
```

See ADR-013 for full migration plan.

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| 401 Unauthorized | JWTs expired; call `supabase.auth.getSession()` again |
| Cold start >1s | Warm function by invoking once after deploy |
| Timeouts (>10s) | Move heavy logic to Postgres (PL/pgSQL) or reduce payload size |
| Missing env vars | Set in Dashboard → Functions → Configuration and restart function |

