# Monitoring Runbook (GlitchTip + @sentry/cloudflare)

**Owner:** sarthib7
**Status:** Live runbook — depends on `lib/server/monitoring.ts`
**Last updated:** 2026-05-14

`@sentry/nextjs` does not play with `@cloudflare/next-on-pages`, so the public path on FundWise has been a console-only monitoring story. This runbook closes that gap with an open-source stack:

- **Backend (free / open source):** [GlitchTip](https://glitchtip.com) — MIT-licensed, Sentry-API-compatible. Hosted free tier covers 1k events/month; self-hosting is one Docker compose file.
- **SDK:** [`@sentry/cloudflare`](https://docs.sentry.io/platforms/javascript/guides/cloudflare/) — Cloudflare-native, MIT-licensed, designed for Workers/Pages. Works against the GlitchTip DSN unchanged because the wire protocol is the same.

Until both pieces are in place, the shim at `lib/server/monitoring.ts` is a no-op and every error falls back to `console.error`. The Next/Cloudflare build remains green either way.

---

## 1. Provision GlitchTip

### Hosted (recommended for first launch)

1. Sign in to `https://app.glitchtip.com` (Google / GitHub OAuth) with the FundLabs ops account.
2. Create an organization called `fundlabs`. Inside it create a project called `fundwise-prod`. Pick `Browser JavaScript / Sentry SDK` as the platform; it works for Cloudflare too because the SDK is the same wire format.
3. Project Settings → Client Keys (DSN). Copy the value. It looks like `https://<public-key>@app.glitchtip.com/<project-id>`.
4. Project Settings → Alerts. Add an email or Telegram alert for: **New issue** + **Issue is regressed**. Optional but useful.

### Self-hosted (recommended once we have >1k events/month)

```bash
# One-machine deploy on any small VPS:
git clone https://gitlab.com/glitchtip/glitchtip.git
cd glitchtip
docker compose up -d
# Web UI: http://<server>:8000
```

Initial admin: follow the prompts in the web UI. Pick a strong password and store it in 1Password. Everything from "create org → create project → copy DSN" is identical to the hosted flow.

If we self-host on a Cloudflare Tunnel'd VPS, the DSN looks like `https://<public-key>@glitchtip.fundlabs.internal/<project-id>` and stays on our infrastructure.

---

## 2. Wire the SDK

```bash
pnpm add @sentry/cloudflare
```

That single install switches the `lib/server/monitoring.ts` shim from no-op to live. The module dynamically imports `@sentry/cloudflare` only when it's installed AND `SENTRY_DSN` (or `GLITCHTIP_DSN`) is set, so the build does not break on machines that haven't run the install yet.

---

## 3. Configure the env vars

Paste into Cloudflare Pages > FundWise > Settings > Environment Variables > Production:

```bash
SENTRY_DSN=https://<public-key>@app.glitchtip.com/<project-id>
# Or alias if you prefer the backend's name:
# GLITCHTIP_DSN=https://<public-key>@app.glitchtip.com/<project-id>

FUNDWISE_ENV=production
```

Preview env: either skip monitoring entirely (recommended for noisy preview deploys) or point at a separate `fundwise-preview` project so preview noise doesn't drown the prod inbox.

For the Fund Mode devnet beta, use a third project `fundwise-fund-mode-devnet` so devnet test groups stay scoped — Fund Mode pre-mainnet errors are expected to be louder than Split Mode prod errors.

---

## 4. Initialize the SDK from the edge runtime

The Sentry Cloudflare SDK wants to be initialized once per Worker. In Next on Cloudflare Pages, the bootstrap point is the Edge runtime handler. Add this once to `app/layout.tsx` or whatever runs on every protected route:

```ts
import { initMonitoring } from "@/lib/server/monitoring"

// Top of the module so it runs once per isolate.
void initMonitoring()
```

After that, every `reportError(...)` call inside a route handler captures into GlitchTip when the env is wired, and falls back to `console.error` when it isn't. `getErrorDetails` in `lib/server/fundwise-error.ts` already forwards every 5xx (and every unexpected `Error`) into `reportError`, so the API surface gets coverage automatically.

---

## 5. Verify

After enabling monitoring on prod:

1. Visit `https://fundwise.fun/api/health` in a browser — should be silent (200 / `{ "ok": true }`).
2. Visit `https://fundwise.fun/api/expenses?groupId=not-a-uuid` without auth — should return 401 (silent because 4xx are not forwarded).
3. Visit `https://fundwise.fun/api/groups/00000000-0000-4000-8000-deadbeefffff/treasury` with an invalid payload — eventually surfaces a 5xx that lands in GlitchTip.
4. Confirm the issue appears in the GlitchTip dashboard within ~30 seconds.

If nothing shows up after 5 minutes, sanity-check:

- `wrangler tail` shows no `@sentry/cloudflare not installed` warning.
- The DSN host is reachable from Cloudflare egress (some self-hosted setups need an allowlist).
- The Production env vars are scoped to **Production**, not Preview, and the new deployment carries them.

---

## 6. Sampling and noise control

For a small app, leave `tracesSampleRate: 0` (set by the shim) and let GlitchTip ingest 100% of errors. If error volume spikes past ~1k/day:

- Adjust the shim's init to `tracesSampleRate: 0.1` and add a release tag from `process.env.CF_PAGES_COMMIT_SHA`.
- Add a Cloudflare WAF rule to drop bots that hit `/api/*` without an Origin header — most "noise" is automated scanning, not real users.
- For known-noisy endpoints (e.g. expired wallet-challenge cookies returning 401 a thousand times a day), the shim already filters 4xx so they shouldn't reach GlitchTip in the first place.

---

## 7. Decommission path

If we ever want to remove monitoring entirely:

```bash
pnpm remove @sentry/cloudflare
# Then unset SENTRY_DSN / GLITCHTIP_DSN in Cloudflare Pages env.
```

The shim becomes a no-op again. No code changes required. The fallback `console.error` path keeps every error visible in `wrangler tail` and Cloudflare Workers Analytics.
