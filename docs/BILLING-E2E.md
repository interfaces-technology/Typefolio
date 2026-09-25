# Personal billing — end-to-end verification

## Stripe (local)

1. Set env from [`.env.example`](../.env.example).
2. Forward webhooks: `stripe listen --forward-to localhost:43123/api/webhooks/stripe`
3. Sign in, `POST /api/billing/checkout` with `{ "priceId": "pro_launch" }`, complete Checkout.
4. Confirm `GET /api/me` → `entitlement.plan` is `pro` and `features.sync` is true.
5. `GET /api/libraries/:id/manifest` with bearer token → 200 (was 403 on Free).
6. Cancel in Stripe Portal → webhook → `plan` returns to `free` unless Apple still active.

## Apple (sandbox)

1. Configure App Store Server Notifications URL → `https://<host>/api/webhooks/apple`.
2. Set `APPLE_BUNDLE_ID`, `APPLE_APP_ID`, `APPLE_ENVIRONMENT=sandbox`.
3. iOS purchase must set **appAccountToken** to the signed-in Neon Auth `userId` (UUID).
4. Sandbox notification → same `GET /api/me` checks as Stripe.

## Dual provider

- User with active Apple + expired Stripe remains Pro until Apple expires.
- User with active Stripe + no Apple uses Stripe launch flag on `isLaunchPricing` when applicable.

## Deprecated

- `POST /api/webhooks/revenuecat` returns **410**.
