# Typefolio — deployment & environment

How we split **one Git repo** into **multiple Vercel projects**: marketing, product app, API, and (later) admin. Env vars are managed **per project** (or via **Shared Environment Variables** on the team), not per deployment.

Official references: [Monorepos on Vercel](https://vercel.com/docs/monorepos/turborepo), [Environment variables](https://vercel.com/docs/environment-variables), [Shared env vars](https://vercel.com/docs/rest-api/environment/create-one-or-more-shared-environment-variables).

## Target layout (Turborepo)

```
syncFont/
├── packages/core/          # db, entitlements, billing logic, storage helpers (no Next)
├── apps/
│   ├── marketing/          # typefolio.app — landing, pricing, legal
│   ├── app/                # app.typefolio.app — auth, library, specimen, billing UI
│   ├── api/                # api.typefolio.app — webhooks + native + JSON API
│   └── admin/              # admin.typefolio.app — founder console (later)
├── apps/SyncFont/            # Swift (unchanged)
└── turbo.json
```

Each folder is **one Vercel project** with **Root Directory** set to that path (e.g. `apps/marketing`).

| Vercel project | Domain (prod) | Builds when | Role |
|----------------|---------------|-------------|------|
| `typefolio-marketing` | `typefolio.app` | `turbo run build --filter=marketing` | Story, pricing, SEO; no DB |
| `typefolio-app` | `app.typefolio.app` | `filter=app` | Sign-in, library, uploads (UI → API) |
| `typefolio-api` | `api.typefolio.app` | `filter=api` | Stripe/Apple webhooks, `/api/*`, sync |
| `typefolio-admin` | `admin.typefolio.app` | `filter=admin` | Ops (later) |

**Ignored Build Step** (each project): `npx turbo-ignore --fallback=HEAD^1`  
**Build command** (each project): `cd ../.. && turbo run build --filter=<package-name>`

Optional: `gettypefolio.com` → 308 redirect to `https://typefolio.app`.

## Why marketing is separate

- **Different change cadence** — copy and landing experiments without redeploying auth, library, or webhooks.
- **Minimal secrets** — marketing should not receive `DATABASE_URL`, Stripe signing secrets, or Apple keys.
- **Smaller attack surface** — static/ISR pages only; CTAs link to `app.typefolio.app`.
- **Clear analytics** — marketing conversion vs product usage.

Today’s root `src/app/page.tsx` mixes **marketing hero** and **signed-in library**. After split:

| Today | After split |
|-------|-------------|
| `/` hero + upload UI | **Marketing** `/` hero, features, pricing |
| `/auth/*`, `/library/*` | **App** only |
| `/api/*` | **API** only |

Signed-in users open **app**, not marketing. Marketing CTAs: `https://app.typefolio.app/auth/sign-up` and `…/auth/sign-in`.

## Routing between projects

**Do not** use [Microfrontends](https://vercel.com/docs/microfrontends) for this — we use **different hostnames**, not path routing on one apex.

- Browser **product UI** calls **`https://api.typefolio.app`** (CORS + credentials) **or** app project rewrites (same-origin cookie option):

```json
{
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://api.typefolio.app/api/:path*"
    }
  ]
}
```

Prefer **direct API URL** in the app (`NEXT_PUBLIC_API_URL`) for clarity; rewrites are optional for cookie ergonomics.

**Webhooks** (Stripe, Apple) must target **`https://api.typefolio.app/api/webhooks/...`** only.

## Auth (Neon) across subdomains

Configure Neon Auth / trusted origins for:

- `https://typefolio.app` (marketing — usually no session)
- `https://app.typefolio.app` (session + OAuth callbacks)
- Preview URLs for both app and api projects

Use a **parent cookie domain** (`.typefolio.app`) only if you intentionally share sessions between marketing and app; typical pattern is **session only on `app`**, marketing stays anonymous.

## Environment variables

Each **deployment** inherits from its **project** env for Production / Preview / Development. You configure vars once per project (or once as **shared** linked to several projects).

### Shared (team → link to api + app)

| Variable | Marketing | App | API | Admin |
|----------|:---------:|:---:|:---:|:-----:|
| `DATABASE_URL` | — | ✓ | ✓ | ✓ (read) |
| Neon Auth server secrets | — | ✓ | ✓ | ✓ |
| Blob read/write keys | — | ✓ | ✓ | — |
| `STRIPE_SECRET_KEY` | — | — | ✓ | — |
| `STRIPE_WEBHOOK_SECRET` | — | — | ✓ | — |
| Apple App Store / webhook keys | — | — | ✓ | — |
| `ADMIN_USER_IDS` | — | — | — | ✓ |

### Per-project URLs (Production example)

| Variable | Marketing | App | API |
|----------|-----------|-----|-----|
| `NEXT_PUBLIC_APP_URL` | `https://app.typefolio.app` (CTA links) | `https://app.typefolio.app` | — |
| `NEXT_PUBLIC_MARKETING_URL` | `https://typefolio.app` | `https://typefolio.app` | — |
| `NEXT_PUBLIC_API_URL` | — | `https://api.typefolio.app` | — |
| `APP_URL` (server) | — | `https://app.typefolio.app` | — |
| Stripe **Price IDs** (public) | optional on `/pricing` | ✓ checkout UI | ✓ checkout API |

Marketing **Preview** needs only public URLs pointing at **Preview app** (or production app during early phase). App + API previews should share the same **Neon preview branch** via Preview-scoped `DATABASE_URL`.

### Local dev

```bash
cd apps/marketing && vercel link --project typefolio-marketing && vercel env pull .env.local
cd apps/app       && vercel link --project typefolio-app       && vercel env pull .env.local
cd apps/api       && vercel link --project typefolio-api       && vercel env pull .env.local
```

Repo root keeps **`.env.example`** as the checklist; secrets never committed.

## Migration order

1. **Ship billing E2E** on current single Next app (PR #6 path).
2. **Extract `packages/core`** — no behavior change.
3. **`apps/api`** + Vercel project + `api.typefolio.app`; move `src/app/api/**`.
4. **`apps/app`** + `app.typefolio.app`; move `src/app/auth/**`, `src/app/library/**`, product components.
5. **`apps/marketing`** + `typefolio.app`; new landing/pricing; strip DB from marketing build.
6. **`apps/admin`** when founder console exists.

Do not big-bang all apps in one PR. Keep `main` deployable after each step.

## CI

On PRs: `turbo run typecheck test build --affected`  
Optional: [Turborepo Remote Cache](https://vercel.com/docs/monorepos/remote-caching/external-ci-cd) on GitHub Actions.

## Related docs

- [`docs/BILLING-E2E.md`](BILLING-E2E.md) — webhooks live on **API** project only
- [`docs/PRODUCT.md`](PRODUCT.md) — domains and pricing
- [`docs/MAP.md`](MAP.md) — code areas (update as monorepo lands)
