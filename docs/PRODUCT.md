# Typefolio — product decisions

Decisions from product strategy planning (Sep 2026). This doc is the source of truth for naming, positioning, billing, and launch scope until implementation catches up.

## Product name

**Typefolio** — a blend of *type* (typefaces) and *folio* (collection/portfolio).

- Tagline: **Your fonts, on every device.**
- Alternative: **Buy, license, and sync fonts on every device.** (if marketplace returns later)

### Domain

| Domain | Status | Notes |
|--------|--------|-------|
| `typefolio.app` | Available (~$9.99/yr on Vercel) | **Primary** |
| `typefolio.com` | Taken | — |
| `gettypefolio.com` | Available (~$11.25/yr) | Optional marketing redirect |

Names considered and not chosen: Inkwell (strong brand, but bare domains taken), syncFont (too narrow for a real product brand).

## Scope

**Utility only** — not a marketplace platform at launch.

- Upload font files once (`.ttf`, `.otf`, `.woff`, `.woff2`)
- Sign in with the same account on web, Mac, and iPad
- Native apps auto-sync and install fonts
- No foundry portal, Stripe Connect marketplace, or font sales in v1

The `feat/font-marketplace` work is deferred. Marketplace can be revisited later without a rebrand if caps and billing are designed upfront.

## Positioning

Typefolio is a **personal cloud font library with sync**, not a font shop.

- **Web** — upload, manage library, account/billing
- **macOS** — direct download app; polls manifest and installs to `~/Library/Fonts`
- **iPad** — companion app (App Store later); same sync pipeline

One product, one brand, one account. No separate “utility vs platform” split.

## Pricing

Subscription-first. Polar was considered early; **RevenueCat + Stripe** is the chosen billing stack (see below).

### Plans

| Plan | Price (GBP) | Includes |
|------|-------------|----------|
| **Free** | £0 | ~50 MB storage, 1 device, manual download |
| **Pro Monthly** | £4.99/mo | ~500 MB, 2 devices, auto-sync + install |
| **Pro Annual** | £39.99/yr | Same as Pro (~£3.33/mo); default upsell |
| **Founding** (launch only) | £69 one-time | Same as Pro, capped; first ~200 users; then close |

### Launch discount

- Prefer **limited founding lifetime** (capped storage/devices) over open-ended cheap lifetime.
- Optional: 14-day Pro trial or 50% off first year for early signups.
- Close founding offer when seats are full → subscription only.

### Lifetime economics

Open-ended unlimited lifetime at low prices loses money over time (ongoing Blob storage + sync API costs). Founding tier is OK only with **caps** (500 MB, 2 devices) and a **seat limit**.

## Billing stack

**RevenueCat + Stripe** — single dashboard for web and mobile subscriptions.

| Layer | Tool | Role |
|-------|------|------|
| Reporting + entitlements | **RevenueCat** | MRR, subscribers, trials, churn; one customer record across platforms |
| Web + Mac checkout | **Stripe** (via RevenueCat Web) | Checkout, invoices, payment methods |
| iOS (when shipped) | **Apple IAP** (via RevenueCat SDK) | App Store compliance |
| Backend | Neon + RevenueCat webhooks | Mirror `pro` entitlement; gate sync in API |

### Why not Polar / build-your-own

- **Polar** — good MoR for web-only; no unified Apple IAP reporting.
- **Stripe alone** — web reporting only; App Store Connect stays separate.
- **Custom reporting** — not worth building pre-revenue.

### Cost

- RevenueCat: free until **$2,500/mo** tracked revenue, then **1%**
- Stripe: ~2.9% + 30p per web transaction
- Apple IAP: 15–30% on in-app purchases
- Tax: **Stripe Tax** for UK/VAT (not a full merchant-of-record like Polar)

## App Store & payments (UK, web-first)

Developer is UK-based. Billing is **web-first** (like Cursor’s model, but Cursor still offers IAP for monthly iOS plans).

### macOS

- Distribute **outside the Mac App Store** (direct download).
- Full web checkout via RevenueCat/Stripe; no Apple payment rules.

### iPad / iOS

- **Phase 1:** Web on iPad; Mac + web billing only.
- **Phase 2:** App Store app when ready.

UK App Store rules (unlike US post-Epic):

- Guideline **3.1.3(b)**: if the app unlocks a paid subscription bought on the web, the **same plan should also be available via IAP** for App Store distribution.
- **“Manage account on typefolio.app”** is fine for existing subscribers (billing portal, cancel, payment method).
- Avoid in-app copy like “Subscribe on web — cheaper”; no prices on iOS upgrade prompts.
- Neutral copy: *“Pro sync is managed on the web. Sign in at typefolio.app to upgrade, then return here.”*

### Recommended flows

| Platform | Payment |
|----------|---------|
| Web | RevenueCat Web Purchase Link / Stripe checkout |
| Mac (direct) | Link to `typefolio.app/pricing` |
| iPad App Store (later) | RevenueCat IAP mirror **or** account unlock for web subscribers + neutral account link |

## Hosting cost estimates (utility)

| Stage | Users | ~Monthly cost |
|-------|-------|----------------|
| Side project | &lt;50 | **£0** (Vercel Hobby + Neon Free) |
| Soft launch | 100–500 | **£20–40** (Vercel Pro + light Blob) |
| Traction | 1k–5k | **£50–150** (storage + Mac sync polling) |

Main variable: **active Mac users polling manifest** (currently every 30s while app is open). Increase interval or sync-on-wake at scale.

Plus: domain ~£10/yr; Apple Developer **£99/yr** if shipping on App Store.

## Implementation checklist (not done)

- [ ] Buy `typefolio.app`
- [ ] RevenueCat project + Stripe connection
- [ ] Products: Pro monthly, Pro annual, Founding (one-time)
- [ ] Webhook: RevenueCat → API → entitlement in DB
- [ ] Gate `/api/.../manifest` and downloads on `pro` (or free-tier limits)
- [ ] Pricing + account pages on web
- [ ] Rebrand UI/copy from syncFont → Typefolio
- [ ] Mac app: upgrade opens web checkout
- [ ] iPad App Store: defer or add RevenueCat IAP when shipping

## Related code (current repo)

Rebrand and billing are **not implemented** yet. Existing app name in code is still `syncFont`. Marketplace code on `feat/font-marketplace` is out of scope for v1.
