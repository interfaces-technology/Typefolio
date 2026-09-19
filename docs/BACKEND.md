# Typefolio backend architecture

Typefolio uses Neon as the backend control plane.

## Neon owns

- Postgres data and schema
- Managed Better Auth
- Typefolio API compute through Neon Functions
- branch-based development and preview environments

## External storage

Font binaries remain in Vercel Blob for now. The database stores the provider-neutral font storage URL/path so the storage layer can be migrated independently later.

## Runtime architecture

```
Browser / macOS / iPadOS
        |
        v
 typefolio.app
        |
        | /api/* (except /api/auth/*)
        v
 Neon Function: Typefolio API
        |
        +--> Neon Postgres
        +--> Neon Auth
        |
        +--> Vercel Blob (font binaries)
```

Vercel remains the frontend host. It is not the application backend.

## Deployment

The Neon backend is declared in `neon.ts`. Install the current Neon CLI and config package, link this repository to the Typefolio Neon project, then deploy the function.

The Neon backend is branch-aware, so production, staging and preview branches can keep database/auth/function state isolated.

## Migration rule

Do not move font binaries as part of this migration. The storage provider is deliberately kept behind `src/lib/storage.ts` so it can be replaced later without changing the Typefolio data model or clients.
