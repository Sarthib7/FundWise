# Dependency Audit Notes

**Last updated:** 2026-05-11
**Command:** `pnpm audit --audit-level moderate`
**Current result:** 23 advisories remain (`3 low`, `9 moderate`, `11 high`) after safe lockfile overrides.
**Verification:** `pnpm test`, `pnpm build`, and `pnpm build:pages` pass.

This note tracks FW-017 for the Split Mode mainnet checklist. It is not a general security audit; it only explains known package advisories and why the remaining ones are accepted or deferred.

## Safe mitigations applied

`package.json` now uses pnpm overrides for patched transitive versions that are compatible with the existing dependency graph:

- `next>postcss` → `8.5.10` for GHSA-qx2v-qp2m-jg93.
- `rpc-websockets>uuid` → `11.1.1` for GHSA-w5hq-g745-h8pq.
- `@vercel/static-config>ajv` → `8.18.0` for GHSA-2g4f-4pwh-qvx6.

These reduced the audit count from 26 to 23 without changing runtime product dependencies or the Cloudflare Pages adapter.

## Remaining accepted advisories

| Package | Path | Audit severity | Status / rationale |
| --- | --- | --- | --- |
| `bigint-buffer@1.1.5` | `@solana/spl-token` → `@solana/buffer-layout-utils` | High | No patched version is published (`Patched versions: <0.0.0`). This is a Solana ecosystem transitive used by SPL token helpers. Accept until upstream publishes a replacement path; do not use untrusted arbitrary buffers with `toBigIntLE()`. |
| `tar@6.2.1` | `vercel@47.0.4` → `@vercel/fun` | High | Patched `tar` is available only in `7.x`, but `@cloudflare/next-on-pages@1.13.16` peer-pins `vercel <=47.0.4`. Newer Vercel releases move closer to patched build tooling but break the current Cloudflare Pages adapter peer contract. Accept as build/deploy tooling risk until the Cloudflare adapter migration is planned. |
| `undici@5.x` | `@cloudflare/next-on-pages` → `miniflare`; `vercel` → `@vercel/node` | Moderate / High | Advisories are in local/build/deploy tooling paths, not browser runtime app code. Patched versions require upstream dependency movement to `undici >=6.24.0` or newer Vercel/Cloudflare tooling. Accept until adapter upgrade/migration. |
| `esbuild@0.14.x / 0.15.x` | `@cloudflare/next-on-pages`; `vercel` → `@vercel/node` | Moderate | Advisory concerns the esbuild development server. FundWise does not expose esbuild's dev server publicly; production build artifacts are served by Cloudflare Pages. Avoid running dev/build servers on public interfaces. Accept until upstream Cloudflare/Vercel tooling can be upgraded safely. |

## Deferred remediation path

1. Plan a Cloudflare adapter migration from deprecated `@cloudflare/next-on-pages` to the OpenNext Cloudflare adapter.
2. After adapter migration, upgrade Vercel/Cloudflare build tooling and rerun `pnpm audit --audit-level moderate`.
3. Track Solana ecosystem remediation for `bigint-buffer`; upgrade `@solana/spl-token` / related packages when an upstream path exists.
4. Keep `pnpm audit --audit-level moderate` in the mainnet checklist before launch and update this file if advisory counts change.
