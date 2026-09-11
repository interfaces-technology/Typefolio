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
| **Free** | £0 | ~50 MB storage, 1 device, manual download (web only) |
| **Pro Annual** | **£40/yr** | ~500 MB, 2 devices, auto-sync + install; default upsell (~£3.33/mo) |
| **Pro Monthly** | £4.99/mo | Same as Pro annual; for users who prefer monthly billing |
| **Pro Launch** | **£20/yr** | Same as Pro; **50% off** regular annual price for early adopters |

### Launch pricing

- **Anchor:** £40/year is the regular Pro annual price.
- **Launch offer:** **50% off → £20/year** for early adopters.
- **Grandfathering:** launch subscribers keep **£20/year** locked in (loyalty, simple story).
- **Messaging:** *“Launch pricing: £20/year — locked in for early users.”*
- Close launch pricing when ready (seat cap or date) → new signups pay **£40/year**.

### Free tier as acquisition

The free plan is intentionally useful but limited — it builds the email list and lets people try before buying.

- Free users cost ~**£0.02/month** each in infra (see [Unit economics](#unit-economics) below).
- Typical free → paid conversion for a niche utility: **2–10%**.
- **Newsletter / email list** is a bonus channel (launch promos, feature updates, occasional partners) — **not** the primary revenue model. Product subscriptions carry the business.

### Why £40/year (not £15 or £25)

| Price | Net after Stripe (approx.) | Profit per active user/year (approx.) |
|-------|---------------------------|---------------------------------------|
| £15/year | ~£14.26 | ~£12.75 |
| £20/year (launch) | ~£19.00 | ~£17–18 |
| £24.99/year | ~£24.00 | ~£22 |
| **£40/year** | ~£38.50 | **~£37** |

- **£15/year** works per user but leaves little room for free-tier subsidy, support, or future App Store fees.
- **£24.99/year permanent** reads as “budget utility” and is hard to raise later.
- **£40/year with £20 launch** gives premium positioning, launch urgency, and ~3× the margin of £15/year at the same infra cost.

### Lifetime / founding (optional)

A separate **£69 one-time founding** tier was considered earlier. If offered:

- Same Pro caps: **500 MB, 2 devices**.
- **Seat limit** (~200 users), then close.
- Do **not** offer open-ended unlimited lifetime at low prices — ongoing Blob + sync costs erode margin over time.

### Unit economics

#### User personas

| Persona | Plan | Usage | Your infra cost/month |
|---------|------|-------|----------------------|
| **Hannah** | Free | Web only, ~20 MB, manual download | ~£0.02 |
| **Sofia** | Free | Signed up, barely uses it (~5 MB) | ~£0.002 |
| **Marcus** | Pro | Mac sync ~8 hrs/day, ~200 MB, 2 devices | ~£0.07 |
| **Alex** | Pro | Maxed storage (~500 MB), app often open | ~£0.12 |

#### Per paying subscriber (annual)

| | Launch (£20/yr) | Regular (£40/yr) |
|--|-----------------|------------------|
| They pay | £20.00 | £40.00 |
| Stripe (~2.9% + 30p) | ~£0.88 | ~£1.46 |
| Infra (active Pro user) | ~£0.07–0.12/mo (~£1/yr) | ~£1/yr |
| **Profit per user/year** | **~£17–18** | **~£37** |

#### Break-even (fixed hosting)

Fixed platform cost at soft launch: ~**£30–35/month** (~£360–420/year) on Vercel Pro + Neon paid tiers.

- At **£20/year** launch (~£18 profit/user): ~**20–24 paying users/year** covers fixed hosting.
- At **£40/year** (~£37 profit/user): ~**10–12 paying users/year** covers fixed hosting.

Below those counts, stay on free hosting tiers or subsidise until traction.

#### Example launch month (illustrative)

- 300 free (web) → ~£6/mo variable
- 40 Pro launch (£20/yr) → ~£2.80/mo variable + ~£67/mo revenue (annualised cash)
- Fixed hosting ~£35/mo

Revenue scales with conversion; free users are cheap list-building if conversion stays above ~5%.

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
- [ ] Products: Pro annual (£40), Pro launch (£20, grandfathered), Pro monthly (£4.99)
- [ ] Webhook: RevenueCat → API → entitlement in DB
- [ ] Gate `/api/.../manifest` and downloads on `pro` (or free-tier limits)
- [ ] Pricing page: show £40 anchor + £20 launch offer; explain grandfathering
- [ ] Rebrand UI/copy from syncFont → Typefolio
- [ ] Mac app: upgrade opens web checkout
- [ ] iPad App Store: defer or add RevenueCat IAP when shipping
- [ ] Email capture on free signup (for launch promos and product updates)

## Repo

- **GitHub org:** [interfaces-technology](https://github.com/interfaces-technology)
- **Repository:** [interfaces-technology/Typefolio](https://github.com/interfaces-technology/Typefolio)
- **Primary domain (planned):** `typefolio.app`

## Related code (current repo)

Rebrand and billing are **not implemented** yet. Existing app name in code is still `syncFont`. Marketplace work is out of scope for v1.
