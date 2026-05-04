# Better_LSAT_QBANK

LSAT prep platform (7Sage-style) using **React** (Vite), **Supabase** (Auth, Postgres, Edge Functions), **shadcn/ui**, and **LawHub Provider / LSAC** APIs (server-side only).

## Prerequisites

- **Node** + **pnpm** (`corepack enable` then `corepack prepare pnpm@9.15.9 --activate`, or install pnpm per [pnpm.io](https://pnpm.io/installation))
- **Docker Desktop** (for local Supabase: `supabase start`)
- **Deno** on your PATH (for Edge Function unit tests: `pnpm run test:edge` at repo root). The first run may create a root `node_modules/` cache for Deno npm resolution—keep it gitignored.

## Local setup

1. **Supabase (local)**  
   From the repo root, with Docker running:

   ```bash
   supabase start
   ```

   Copy the printed **API URL** and **anon key** into `web/.env.local` (see `web/.env.example`).

2. **Web app**

   ```bash
   pnpm install
   pnpm run dev
   ```

   - `pnpm run dev` uses `web/.env.emulator` and points the app to local Supabase (`127.0.0.1:54321`).
   - For production-backed local UI testing, create `web/.env.production.local` from `web/.env.production.example`, then run:

   ```bash
   pnpm run dev:prod
   ```

3. **Tests**

   ```bash
   pnpm --filter web test
   pnpm run test:edge   # from repo root; requires Deno on PATH
   ```

4. **Edge Functions locally** (after `supabase start`)

   ```bash
   cp supabase/functions/.env.example supabase/functions/.env
   # Fill LSAC_* and redeploy secrets in production via `supabase secrets set`
   supabase functions serve
   ```

   Optional: run a single function while iterating:

   ```bash
   supabase functions serve users --env-file supabase/functions/.env
   supabase functions serve lsac-deeplink --env-file supabase/functions/.env
   supabase functions serve lsac-content-import --env-file supabase/functions/.env
   supabase functions serve lsac-sync --env-file supabase/functions/.env
   ```

## LawHub / LSAC (LawHub Provider API)

OAuth uses **client credentials** against Azure AD, then `Authorization: Bearer` on `{{LSAC_BASE_URL}}/api/vendor/{vendorId}/...`.

Quick reference:
- `docs/lsac-provider-api-digest.md` (entities, ID glossary, relationship model, endpoint map, lifecycle)

| Variable | Purpose |
|----------|---------|
| `LSAC_BASE_URL` | Sandbox: `https://providers-api-sandbox.lawhub.org` — production: `https://providers-api.lawhub.org` |
| `LSAC_VENDOR_ID` | Your vendor UUID from LSAC |
| `LSAC_TENANT_ID` | Azure tenant (see LSAC doc; same value listed for integration and production in the draft doc) |
| `LSAC_CLIENT_ID` / `LSAC_CLIENT_SECRET` | App registration secrets from LSAC |
| `LSAC_SCOPE` | Environment-specific `.default` scope URI from LSAC documentation |
| `LSAC_VENDOR_SYSTEM` | Optional label for the required **logging** API |
| `LSAC_DEEPLINK_BASE_URL` | Optional override for deep link host (default: `https://lawhub.org`) |
| `LSAC_SYNC_KEY` | Required shared secret header (`x-lsac-sync-key`) for `lsac-sync` |

**Hosted:** `supabase secrets set LSAC_BASE_URL=...` (repeat for each key). **Local:** `supabase/functions/.env` (gitignored).

The `users` Edge Function exposes actions such as `lawhub-token-check`, `lawhub-lookup-email` (session email only), `lawhub-invite` (session email only), `lawhub-refresh`, `lawhub-upgrade-self`, `lawhub-test-instances`, and `lawhub-log-login`. See `web/src/lib/api/users.ts` for the typed client.

Additional LSAC backend functions:
- `lsac-deeplink` (POST, auth required): returns canonical LawHub deep-link URLs bound to the authenticated profile's `student_coaching_id`.
- `lsac-content-import` (POST, auth required): ingests one module payload or `{ modules: [...] }` bulk payload into content tables.
- `lsac-sync` (POST, sync key required): reconciles vendor roster snapshots and optional test instances.

Example payloads:

```json
// lsac-deeplink
{ "testId": "LSAT-PT-93", "sectionId": "AR:116" }
```

```json
// lsac-content-import (single module)
{ "moduleId": "LogicalReasoning-DrillSet1", "sections": [] }
```

```json
// lsac-content-import (bulk)
{ "modules": [{ "moduleId": "M1", "sections": [] }, { "moduleId": "M2", "sections": [] }] }
```

```json
// lsac-sync
{ "includeInstances": true }
```

Emulator verification checklist:
- `users` action `lawhub-token-check` succeeds with configured LSAC credentials.
- `users` action `lawhub-lookup-email` writes profile and `lsac_student_snapshots`.
- `users` action `lawhub-test-instances` writes/upserts `lsac_test_instances`.
- `users` action `lawhub-log-login` writes `lsac_log_events`.
- `lsac-deeplink` returns a URL containing server-side `vendorId` and profile-linked `studentCoachingId`.
- `lsac-content-import` reports imported module count and sections/items counts.
- `lsac-sync` returns roster/match counters and persists snapshots.

**Secrets hygiene:** Never commit client secrets, never put them in `VITE_*`. If a client secret was shared in chat or committed, **rotate it with LSAC** and treat the old value as compromised.

## Security / RLS (dev vs prod)

- **Dev**: Migrations use **broad** owner-based RLS on `profiles` (`auth.uid() = id`). Service role used in Edge Functions bypasses RLS for server orchestration.
- **Prod**: Tighten policies and secrets before launch; never expose LSAC client credentials to the client or `VITE_*` variables.

## RBAC (student/admin)

- `public.profiles.role` is the source of truth for app authorization.
- Allowed values: `student` (default) and `admin`.
- Student users keep owner-scoped reads; admins can read cross-user rows for:
  - `profiles`
  - `lsac_student_snapshots`
  - `lsac_test_instances`
  - `lsac_log_events`

Admin bootstrap:

1. Migration `supabase/migrations/20260415130500_rbac_admin.sql` seeds the first admin by email (`admin@example.com` placeholder).
2. Before deploying to shared environments, update that email in the migration (or promote after signup with SQL).
3. Manual promote/demote examples:

```sql
-- Promote an existing user by email
update public.profiles
set role = 'admin', updated_at = now()
where id = (
  select id from auth.users where lower(email) = lower('your-admin@email.com')
  limit 1
);

-- Demote
update public.profiles
set role = 'student', updated_at = now()
where id = (
  select id from auth.users where lower(email) = lower('your-admin@email.com')
  limit 1
);
```

## Project layout

- `web/` — Vite React app (thin client); UI talks to backend via `web/src/lib/api/*` and `functions.invoke`. **Business logic** lives in Edge Functions, not in components.
- `supabase/migrations/` — SQL migrations.
- `supabase/functions/users/` — Example layered function (controller, service, repository, mapper).
- `.cursor/rules/` — Cursor agent conventions for this repo.

## Figma sizing rules (desktop-first)

Use the desktop canvas `1920x924` as the baseline for UI implementation:

- Convert Figma widths to viewport ratios, then cap with `clamp(...)` and container bounds.
- Convert Figma heights similarly, but allow page-level vertical scrolling instead of scaling the whole canvas down.
- Keep main desktop content inside a centered container with max width `1920px` (`width: min(100vw, 1920px)`).
- Use shared `figma-*` utility classes in `web/src/index.css` for spacing, sizing, and typography (`figma-w-*`, `figma-h-*`, `figma-gap-*`, `figma-text-*`, tracking helpers).
- Do not copy raw pixel values blindly from Figma; prefer proportional sizing + clamp bounds.
- At tablet/mobile breakpoints, switch to explicit breakpoint overrides rather than relying only on desktop ratio scaling.
