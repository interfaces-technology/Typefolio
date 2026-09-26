# Typefolio — deployment & environment

How we split **one Git repo** into **multiple Vercel projects**: marketing, product app, API, and (later) admin. Env vars are managed **per project** (or via **Shared Environment Variables** on the team), not per deployment.

Official references: [Monorepos on Vercel](https://vercel.com/docs/monorepos/turborepo), [Environment variables](https://vercel.com/docs/environment-variables), [Shared env vars](https://vercel.com/docs/rest-api/environment/create-one-or-more-shared-environment-variables).

## Target layout (Turborepo)

```
typefolio/
├── packages/core/          # @typefolio/core — db, entitlements, billing, storage
├── apps/
│   ├── marketing/          # @typefolio/marketing — landing, pricing, legal
│   ├── api/                # @typefolio/api — webhooks, JSON API, Better Auth, /auth/desktop
│   └── admin/              # (later) founder console
├── apps/typefolio-native/  # Swift macOS + iPad
├── apps/typefolio-desktop/ # Electron (optional)
└── turbo.json
```

Each folder is **one Vercel project** with **Root Directory** set to that path (e.g. `apps/marketing`).

| Vercel project | Domain (prod) | Builds when | Role |
|----------------|---------------|-------------|------|
| `typefolio-marketing` | `typefolio.app` | `turbo run build --filter=marketing` | Story, pricing, SEO; no DB |
| `typefolio-api` | `api.typefolio.app` | `filter=api` | Webhooks, `/api/*`, native browser sign-in |
| `typefolio-app` | `app.typefolio.app` | `filter=app` | Signed-in product web UI |
| `typefolio-admin` | `admin.typefolio.app` | `filter=admin` | Ops (later) |

Native browser sign-in stays on the **API** host (`/auth/desktop`). The product app signs in through same-origin `/api` rewrites to the API. In production, set cookie domain to `.typefolio.app` so `app.typefolio.app` and `api.typefolio.app` share the Better Auth session.

**Ignored Build Step** (each project): `npx turbo-ignore --fallback=HEAD^1`  
**Build command** (each project): `cd ../.. && turbo run build --filter=<package-name>`

Optional: `gettypefolio.com` → 308 redirect to `https://typefolio.app`.

## Why marketing is separate

- **Different change cadence** — copy and landing experiments without redeploying auth, library, or webhooks.
- **Minimal secrets** — marketing should not receive `DATABASE_URL`, Stripe signing secrets, or Apple keys.
- **Smaller attack surface** — static/ISR pages only; CTAs link to `api.typefolio.app` for auth.
- **Clear analytics** — marketing conversion vs product usage.

Today’s root `src/app/page.tsx` mixes **marketing hero** and **signed-in library**. After split:

| Today | After split |
|-------|-------------|
| `/` hero + upload UI | **Marketing** `/` hero, features, pricing |
| `/auth/desktop`, `/auth/sign-up` (native + accounts) | **API** |
| `/api/*` | **API** only |

Marketing CTAs: `https://api.typefolio.app/auth/sign-up` (or marketing-only waitlist until the new web app exists).

## Routing between projects

**Do not** use [Microfrontends](https://vercel.com/docs/microfrontends) for this — we use **different hostnames**, not path routing on one apex.

- Browser clients call **`https://api.typefolio.app`** directly (CORS + credentials where needed).

**Webhooks** (Stripe, Apple, Polar) must target **`https://api.typefolio.app/api/webhooks/...`** only.

## Auth (Neon) across subdomains

Configure Neon Auth / trusted origins for:

- `https://typefolio.app` (marketing)
- `https://app.typefolio.app` (product web UI)
- `https://api.typefolio.app` (Better Auth + OAuth callbacks + `/auth/desktop`)
- Preview URLs for marketing, app, and api projects

## Environment variables

Each **deployment** inherits from its **project** env for Production / Preview / Development. You configure vars once per project (or once as **shared** linked to several projects).

### Shared (team → link to api)

| Variable | Marketing | API | Admin |
|----------|:---------:|:---:|:-----:|
| `DATABASE_URL` | — | ✓ | ✓ (read) |
| Neon Auth server secrets | — | ✓ | ✓ |
| Blob read/write keys | — | ✓ | — |
| `STRIPE_SECRET_KEY` | — | ✓ | — |
| `STRIPE_WEBHOOK_SECRET` | — | ✓ | — |
| Apple App Store / webhook keys | — | ✓ | — |
| `ADMIN_USER_IDS` | — | — | ✓ |

### Per-project URLs (Production example)

| Variable | Marketing | App | API |
|----------|-----------|-----|-----|
| `NEXT_PUBLIC_MARKETING_URL` | `https://typefolio.app` | `https://typefolio.app` | `https://typefolio.app` |
| `NEXT_PUBLIC_APP_URL` | — | `https://app.typefolio.app` | `https://app.typefolio.app` |
| `NEXT_PUBLIC_API_URL` | `https://api.typefolio.app` (CTA links) | `https://api.typefolio.app` | — |
| `BETTER_AUTH_URL` | — | — | `https://api.typefolio.app` |

### Local dev

```bash
cd apps/marketing && vercel link --project typefolio-marketing && vercel env pull .env.local
cd apps/api       && vercel link --project typefolio-api       && vercel env pull .env.local
```

Repo root keeps **`.env.example`** as the checklist; secrets never committed.

## Migration order

1. ~~Ship billing E2E on single Next app (PR #6).~~
2. ~~Scaffold Turborepo: `packages/core`, `apps/api`, `apps/app`, `apps/marketing`.~~
3. Wire Vercel projects + `api.typefolio.app`; tune CORS/cookies for split hosts.
4. Flesh out marketing (`apps/marketing`); ship redesigned product web app from Figma (new Vercel project when ready).
5. **`apps/admin`** when founder console exists.

Do not big-bang all apps in one PR. Keep `main` deployable after each step.

## CI

On PRs: `turbo run typecheck test build --affected`  
Optional: [Turborepo Remote Cache](https://vercel.com/docs/monorepos/remote-caching/external-ci-cd) on GitHub Actions.

## Related docs

- [`docs/BILLING-E2E.md`](BILLING-E2E.md) — webhooks live on **API** project only
- [`docs/PRODUCT.md`](PRODUCT.md) — domains and pricing
- [`docs/MAP.md`](MAP.md) — code areas (update as monorepo lands)
