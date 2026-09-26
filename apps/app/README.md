# Typefolio web app (`@typefolio/app`)

This is the **signed-in product** — auth, library, uploads, specimen studio, and billing UI.

After the monorepo split:

| App | Port (local) | Role |
|-----|----------------|------|
| `@typefolio/marketing` | 43125 | Landing, pricing, legal (no DB) |
| `@typefolio/app` | 43124 | **Design the product here** |
| `@typefolio/api` | 43123 | JSON API, webhooks, Better Auth |

Shared server logic lives in [`packages/core`](../../packages/core).

## Local dev

From repo root (with `.env.local`):

```bash
npm run dev:api        # API + auth
npm run dev:app        # product UI (rewrites /api → API when NEXT_PUBLIC_API_URL is set)
npm run dev:marketing  # marketing shell
npm run dev            # all three via Turborepo
```

Set in `.env.local`:

- `BETTER_AUTH_URL` / `NEXT_PUBLIC_API_URL` → `http://127.0.0.1:43123`
- `NEXT_PUBLIC_APP_URL` → `http://127.0.0.1:43124`
- `NEXT_PUBLIC_MARKETING_URL` → `http://127.0.0.1:43125`

## Where to add UI

- Pages → `src/app/`
- Components → `src/components/`
- Server/data → import from `@typefolio/core/...`
