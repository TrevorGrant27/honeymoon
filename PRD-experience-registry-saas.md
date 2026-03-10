# Product Requirements Document: Experience Registry SaaS Platform

**Working Name:** Experience Registry (TBD)
**Date:** March 10, 2026
**Status:** Ready for development
**Reference Implementation:** https://github.com/TrevorGrant27/honeymoon (single-tenant version, currently live and processing real payments)

---

## 1. Overview

### What is this?
A SaaS platform where couples can create beautiful, shareable "experience registries" — instead of asking for physical gifts, guests sponsor specific experiences (dinners, hotels, activities, etc.) for the couple's honeymoon, wedding, or any celebration.

### Why build it?
We built a single-tenant version for one couple (Trevor & Carly's honeymoon registry) and it works. People are actually paying. The UX is proven. Now we want to let anyone create their own registry in minutes.

### How does it make money?
Free to create. **5% platform fee** automatically deducted from each gift via Stripe Connect. Couples pay nothing upfront. Revenue scales directly with usage.

**Revenue math:** Average registry raises ~$3,000 × 5% = $150/registry. At 100 registries/month = $15k MRR.

---

## 2. Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| Framework | **Next.js 16** (App Router, Server Components) | Reference app uses this, proven |
| Language | **TypeScript** (strict mode) | Type safety across full stack |
| Database | **Supabase** (PostgreSQL + Auth + Storage) | Already in stack, RLS for multi-tenancy, built-in auth |
| Payments | **Stripe + Stripe Connect Express** | Per-couple payouts with platform fee |
| Styling | **Tailwind CSS 4** | CSS custom properties enable dynamic theming |
| Hosting | **Vercel** | Zero-config Next.js deployment |

---

## 3. User Roles

### Couple (Registry Owner)
- Signs up with email + password (Supabase Auth)
- Creates and manages ONE registry (v1)
- Adds/edits/removes experiences
- Customizes theme and branding
- Connects Stripe account to receive payouts
- Views gifts and stats in dashboard

### Guest (Sponsor)
- No account required
- Visits a registry via shared link
- Browses experiences, picks one to sponsor
- Pays any amount (if splitting allowed) or full price
- Enters their name and optional note
- Redirected to Stripe Checkout → thank you page

### Platform Admin
- Not needed for v1 (monitor via Stripe Dashboard + Supabase Dashboard)

---

## 4. URL Structure

```
/                                  → Marketing landing page
/login                             → Login page
/signup                            → Signup page
/create                            → Registry creation wizard (auth required)
/dashboard                         → Couple's admin dashboard (auth required)
/dashboard/settings                → Registry settings, theme, Stripe Connect
/r/[slug]                          → Public registry page (e.g., /r/trevor-carly)
/r/[slug]/checkout/[experienceId]  → Checkout page for a specific experience
/r/[slug]/thank-you/[sessionId]    → Post-payment confirmation page
```

---

## 5. Database Schema

### `registries` table (NEW)
```sql
create table registries (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references auth.users(id) on delete cascade,
  slug                       text unique not null,          -- URL-safe: "trevor-carly"
  partner1_name              text not null,
  partner2_name              text not null,
  headline                   text default 'Help us create unforgettable memories',
  description                text,                          -- optional longer description
  event_type                 text default 'honeymoon',      -- honeymoon, wedding, anniversary, etc.
  event_date                 date,
  hero_image_url             text,
  theme                      text not null default 'provence',  -- preset key
  custom_colors              jsonb,                         -- optional overrides: {primary, accent, bg}
  stripe_account_id          text,                          -- Stripe Connect Express account
  stripe_onboarding_complete boolean default false,
  is_published               boolean default false,
  created_at                 timestamptz default now(),
  updated_at                 timestamptz default now()
);
```

### `experiences` table
```sql
create table experiences (
  id               uuid primary key default gen_random_uuid(),
  registry_id      uuid not null references registries(id) on delete cascade,
  title            text not null,
  description      text not null,
  category         text not null default 'extras',
  price_cents      integer not null check (price_cents > 0),
  image_url        text,
  emoji            text not null default '✨',
  allow_splitting  boolean not null default true,
  min_split_cents  integer not null default 2500,    -- $25 minimum split
  display_order    integer not null default 0,
  is_active        boolean not null default true,
  funded_cents     integer not null default 0,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
```

### `sponsors` table
```sql
create table sponsors (
  id                uuid primary key default gen_random_uuid(),
  registry_id       uuid not null references registries(id) on delete cascade,
  experience_id     uuid not null references experiences(id) on delete cascade,
  display_name      text not null,
  email             text not null default '',
  photo_url         text,
  note              text,
  amount_cents      integer not null check (amount_cents > 0),
  stripe_session_id text not null unique,
  created_at        timestamptz not null default now()
);
```

### Indexes
```sql
create index idx_registries_slug on registries(slug);
create index idx_registries_user_id on registries(user_id);
create index idx_experiences_registry_id on experiences(registry_id);
create index idx_experiences_active on experiences(is_active);
create index idx_sponsors_registry_id on sponsors(registry_id);
create index idx_sponsors_experience_id on sponsors(experience_id);
create index idx_sponsors_stripe_session on sponsors(stripe_session_id);
```

### Row-Level Security Policies

**registries:**
- Public can SELECT where `is_published = true`
- Authenticated users can SELECT/INSERT/UPDATE/DELETE where `user_id = auth.uid()`

**experiences:**
- Public can SELECT where `is_active = true` AND parent registry `is_published = true`
- Authenticated users can full CRUD where experience's registry `user_id = auth.uid()`

**sponsors:**
- Public can SELECT where parent registry `is_published = true`
- Public can INSERT (via service role in webhook — sponsors are created server-side)
- Authenticated users can SELECT their own registry's sponsors

**Storage:**
- Files stored under path `{registry_id}/filename`
- Public read access
- Authenticated upload scoped to own registry path

---

## 6. Theme System

### 4 Presets (v1)

Each preset defines: primary color, accent color, background color, display font, body font.

```typescript
const THEME_PRESETS = {
  provence: {
    name: 'Provence',
    primary: '#C17B5A',      // warm rose
    accent: '#D4A24E',       // champagne gold
    background: '#FAF7F2',   // cream
    muted: '#5C4D3C',        // warm brown
    fontDisplay: 'Playfair Display',
    fontBody: 'Lora',
  },
  tropical: {
    name: 'Tropical',
    primary: '#2D9B83',      // teal
    accent: '#F4A261',       // coral/sand
    background: '#FEFCF8',   // warm white
    muted: '#4A6B5D',        // dark teal
    fontDisplay: 'Montserrat',
    fontBody: 'Open Sans',
  },
  modern: {
    name: 'Modern',
    primary: '#1A1A2E',      // deep navy
    accent: '#E94560',       // crimson
    background: '#FFFFFF',   // white
    muted: '#6B7280',        // gray
    fontDisplay: 'Inter',
    fontBody: 'DM Sans',
  },
  classic: {
    name: 'Classic',
    primary: '#2C3E50',      // navy
    accent: '#B7791F',       // gold
    background: '#FFFEF7',   // ivory
    muted: '#6B7280',        // gray
    fontDisplay: 'Cormorant Garamond',
    fontBody: 'EB Garamond',
  },
};
```

### How theming works
- Registry layout at `/r/[slug]/layout.tsx` fetches the registry's theme config
- Injects CSS custom properties via a `<style>` tag overriding `:root` variables
- All components use Tailwind classes that reference these CSS variables (e.g., `text-rose` maps to `--color-rose`)
- Google Fonts loaded dynamically based on selected font pair
- Optional `custom_colors` JSONB on registry overrides specific preset values

---

## 7. Features — Page by Page

### 7a. Marketing Landing Page (`/`)

**Purpose:** Convert visitors into signups.

**Content:**
- Hero: "Create your dream experience registry in minutes"
- Subhead: "Instead of a gift list, let your guests sponsor the experiences that matter to you"
- How It Works section (3 steps):
  1. "Create your registry" — pick a theme, add experiences
  2. "Share with guests" — send your unique link
  3. "Receive gifts" — money goes directly to your bank
- Social proof / example registry preview
- Pricing: "Free to create. We only take 5% when you receive a gift."
- CTA button → `/signup`
- Footer with links

### 7b. Signup (`/signup`) + Login (`/login`)

**Auth via Supabase Auth.**

- Email + password signup
- Email verification (Supabase handles this)
- Login with email + password
- "Forgot password" flow (Supabase built-in)
- After signup → redirect to `/create`
- After login → redirect to `/dashboard`

### 7c. Registry Creation Wizard (`/create`)

**Auth required.** Multi-step form.

**Step 1 — Names & Details:**
- Partner 1 name (required)
- Partner 2 name (required)
- Event type dropdown: Honeymoon, Wedding, Anniversary, Baby Shower, Other
- Event date (optional date picker)
- Registry slug — auto-generated from names (e.g., "trevor-carly"), editable
  - Real-time uniqueness validation
  - Restricted slugs: create, dashboard, login, signup, admin, api, r, etc.

**Step 2 — Choose Theme:**
- Show 4 theme presets as visual cards with preview
- Clicking a preset shows a live preview of how the registry will look
- Optional: primary color override picker
- Optional: hero image upload

**Step 3 — Add Experiences:**
- Option A: Choose a template pack
  - "Honeymoon in Paris" (12 pre-filled experiences — use the existing seed data from reference app)
  - "Beach Getaway" (template)
  - "Road Trip" (template)
  - "Start from scratch"
- Option B: Add individual experiences via form:
  - Emoji picker (30+ options)
  - Title (required)
  - Description (required)
  - Category dropdown: Dining, Hotels, Activities, Transport, Extras
  - Price in dollars (required, converts to cents)
  - Allow splitting toggle (default: on)
  - Minimum split amount (default: $25)
  - Image URL (optional)
- Can add multiple experiences, reorder via drag or arrows
- Can skip this step and add later from dashboard

**Step 4 — Review & Publish:**
- Full preview of the registry as guests will see it
- "Publish" button
- Note: "To receive payouts, you'll need to connect your bank account in Settings"
- After publish → redirect to `/dashboard` with success message

### 7d. Dashboard (`/dashboard`)

**Auth required.** The couple's control center. Based heavily on the reference app's admin dashboard (which is already well-built with stats, experience CRUD, and sponsor list).

**Overview Tab:**
- Total raised (sum of all sponsor amounts)
- Number of gifts
- Number of fully funded experiences
- Average gift amount
- Overall progress bar
- Stripe Connect status banner:
  - If not connected: "Connect your bank account to receive payouts" with CTA
  - If connected: "Payouts active ✓"

**Experiences Tab:**
- List of all experiences (active and inactive)
- Each row shows: emoji, title, category, price, funded amount, progress bar, status
- "Add Experience" button → opens modal form (same as wizard step 3)
- Edit button → same modal, pre-populated
- Delete button → confirmation dialog, cascade deletes sponsors
- Reorder via display_order (up/down arrows or drag)
- Toggle active/inactive

**Gifts Tab:**
- List of all sponsors across all experiences
- Columns: date, sponsor name, experience title, amount, note
- Filter by experience
- Search by sponsor name
- Sort by date (newest first default)

**Settings Tab (`/dashboard/settings`):**
- Edit partner names
- Edit slug (with uniqueness check)
- Edit headline and description
- Change theme preset
- Override colors
- Upload/change hero image
- Event type and date
- **Stripe Connect section:**
  - If not connected: "Connect with Stripe" button → initiates Express onboarding
  - If connected: shows account status, link to Stripe Express dashboard
- Publish/unpublish toggle
- **Danger zone:** Delete registry (confirmation required, cascades everything)

### 7e. Public Registry Page (`/r/[slug]`)

**No auth required.** This is what guests see when they receive a shared link.

**Layout:**
- Theme applied from registry config (colors, fonts via CSS variables)
- Dynamic names throughout (NOT hardcoded)

**Sections (matching reference app UX):**
1. **Hero section:**
   - "The [Event Type] of"
   - "{Partner 1} & {Partner 2}" (large display font)
   - Decorative ornament
   - Headline text (from registry config)
   - Hero image background if set

2. **Stats bar** (only shown if at least 1 gift exists):
   - Total raised
   - Number of gifts
   - Overall % funded
   - Progress bar

3. **Experience grid:**
   - Category filter bar (horizontal scrollable pills)
   - Grid of experience cards (1 col mobile, 2 col tablet, 3 col desktop)
   - Each card shows: emoji, title, category badge, price, progress bar, sponsor avatars
   - Fully funded experiences shown at bottom with "Fully Gifted" badge
   - Click card → modal with full details + sponsor list + "Gift This" CTA

4. **Footer:**
   - "Made with [Platform Name]" + link to marketing page
   - Subtle admin link (for the couple)

### 7f. Experience Detail Modal

**Triggered by clicking an experience card on the public registry.**

- Large emoji
- Title and description
- Price and funding progress bar
- List of sponsors (avatar + name + note)
- If not fully funded:
  - "Gift This Experience" button → navigates to checkout
  - If splitting allowed: quick-select amount buttons (25%, 50%, 75%, full)

### 7g. Checkout Page (`/r/[slug]/checkout/[experienceId]`)

**No auth required.**

**Two-step form:**

1. **Amount selection:**
   - If `allow_splitting = false`: shows full remaining price, no choice
   - If `allow_splitting = true`:
     - Preset buttons: 25%, 50%, 75% of remaining
     - Custom amount input (min: `min_split_cents`, max: remaining)
     - Shows what percentage of the experience this covers
   - If amount passed via URL query param (`?amount=5000`), pre-select it

2. **Sponsor info:**
   - Display name (required)
   - Email (required — for receipt)
   - Note / message to the couple (optional, placeholder: "A note for {Partner 1} & {Partner 2}...")

3. **Submit → creates Stripe Checkout Session → redirects to Stripe**

**API: `POST /api/checkout`**
- Validates: experience exists, is active, registry is published, amount within bounds
- Creates Stripe Checkout session with:
  - `line_items`: experience title + amount
  - `payment_intent_data.application_fee_amount`: 5% of charge amount
  - `payment_intent_data.transfer_data.destination`: registry's `stripe_account_id`
  - `metadata`: registry_id, experience_id, display_name, email, note, amount_cents
  - `success_url`: `/r/[slug]/thank-you/{CHECKOUT_SESSION_ID}`
  - `cancel_url`: `/r/[slug]?cancelled=true`

**Edge case — Stripe not connected:**
- If the registry's couple hasn't completed Stripe Connect onboarding, the checkout should still work
- Payments go to the platform's Stripe account with metadata flagging them as "pending_transfer"
- Once the couple connects, accumulated funds are transferred
- Show a note in the couple's dashboard: "You have $X in pending payouts — connect your bank to receive them"

### 7h. Thank You Page (`/r/[slug]/thank-you/[sessionId]`)

**No auth required.**

- Confetti animation (port from reference app)
- "Thank You!" heading
- "Your gift means the world to {Partner 1} & {Partner 2}."
- Shows: experience title, amount gifted, sponsor name
- Share button: "I just gifted an experience on {Partner 1} & {Partner 2}'s registry!" with registry URL
- "Back to registry" link
- Calls `/api/verify-payment/[sessionId]` on load as webhook fallback

---

## 8. Stripe Connect Integration Detail

### Onboarding Flow

1. Couple clicks "Connect your bank account" in dashboard settings
2. Frontend calls `POST /api/connect/create`
3. Backend:
   ```
   const account = await stripe.accounts.create({
     type: 'express',
     email: user.email,
     metadata: { registry_id: registry.id }
   });

   // Save account ID
   UPDATE registries SET stripe_account_id = account.id WHERE id = registry.id

   // Create onboarding link
   const link = await stripe.accountLinks.create({
     account: account.id,
     refresh_url: `${BASE_URL}/dashboard/settings?stripe=refresh`,
     return_url: `${BASE_URL}/dashboard/settings?stripe=complete`,
     type: 'account_onboarding',
   });

   return { url: link.url };
   ```
4. Frontend redirects to `link.url` (Stripe-hosted onboarding)
5. Couple completes identity verification + bank account on Stripe
6. Stripe redirects back to `/dashboard/settings?stripe=complete`
7. Backend verifies account status and sets `stripe_onboarding_complete = true`

### Webhook Events to Handle
- `checkout.session.completed` — record sponsor, update funded_cents (same as current app, but with registry_id)
- `account.updated` — check if connected account onboarding is complete

### Platform Fee
- 5% of each gift amount
- Set via `application_fee_amount` on checkout session creation
- Platform receives fees in its own Stripe account
- Couples receive the rest directly in their connected account
- Stripe's own processing fees (~2.9% + 30¢) are deducted from the couple's portion

---

## 9. API Routes

### Public (no auth)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/registries/[slug]` | Fetch published registry with experiences + sponsors |
| GET | `/api/experiences/[id]` | Fetch single experience with sponsors (validates registry is published) |
| POST | `/api/checkout` | Create Stripe Checkout session |
| GET | `/api/verify-payment/[sessionId]` | Verify and record payment (webhook fallback) |
| POST | `/api/webhooks/stripe` | Handle Stripe webhook events |

### Authenticated (Supabase Auth session required)
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/dashboard/stats` | Get stats for authenticated user's registry |
| GET | `/api/dashboard/experiences` | List all experiences for user's registry |
| POST | `/api/dashboard/experiences` | Create new experience |
| PUT | `/api/dashboard/experiences/[id]` | Update experience (validates ownership) |
| DELETE | `/api/dashboard/experiences/[id]` | Delete experience (validates ownership) |
| GET | `/api/dashboard/sponsors` | List sponsors for user's registry |
| GET | `/api/dashboard/registry` | Get registry details |
| PUT | `/api/dashboard/registry` | Update registry settings |
| POST | `/api/dashboard/registry` | Create registry (from wizard) |
| DELETE | `/api/dashboard/registry` | Delete registry |
| POST | `/api/connect/create` | Create Stripe Connect account + onboarding link |
| GET | `/api/connect/status` | Check Stripe Connect onboarding status |
| POST | `/api/upload` | Upload image to Supabase Storage |

### Slug Validation
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/check-slug/[slug]` | Check if slug is available (used during creation) |

---

## 10. Project Structure

```
src/
├── app/
│   ├── (marketing)/
│   │   ├── page.tsx                          # Landing page
│   │   └── layout.tsx                        # Marketing layout (nav + footer)
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   └── layout.tsx                        # Auth layout (centered card)
│   ├── create/
│   │   └── page.tsx                          # Multi-step creation wizard
│   ├── dashboard/
│   │   ├── page.tsx                          # Dashboard overview + experiences + gifts
│   │   ├── settings/page.tsx                 # Registry settings + Stripe Connect
│   │   └── layout.tsx                        # Dashboard layout (sidebar nav)
│   ├── r/[slug]/
│   │   ├── page.tsx                          # Public registry
│   │   ├── checkout/[id]/page.tsx            # Checkout
│   │   ├── thank-you/[sessionId]/page.tsx    # Thank you
│   │   └── layout.tsx                        # Registry layout (loads theme)
│   ├── api/
│   │   ├── registries/[slug]/route.ts
│   │   ├── experiences/[id]/route.ts
│   │   ├── checkout/route.ts
│   │   ├── verify-payment/[sessionId]/route.ts
│   │   ├── webhooks/stripe/route.ts
│   │   ├── connect/
│   │   │   ├── create/route.ts
│   │   │   └── status/route.ts
│   │   ├── check-slug/[slug]/route.ts
│   │   ├── upload/route.ts
│   │   └── dashboard/
│   │       ├── stats/route.ts
│   │       ├── registry/route.ts
│   │       ├── experiences/route.ts
│   │       ├── experiences/[id]/route.ts
│   │       └── sponsors/route.ts
│   ├── layout.tsx                            # Root layout
│   └── globals.css                           # Base styles + CSS variables + theme system
├── components/
│   ├── registry/
│   │   ├── ExperienceCard.tsx
│   │   ├── ExperienceDetail.tsx
│   │   ├── CheckoutForm.tsx
│   │   ├── CategoryFilter.tsx
│   │   ├── RegistryHero.tsx
│   │   ├── StatsBar.tsx
│   │   └── SponsorList.tsx
│   ├── dashboard/
│   │   ├── ExperienceForm.tsx                # Modal form for add/edit experience
│   │   ├── StatsOverview.tsx
│   │   ├── ExperienceTable.tsx
│   │   ├── SponsorTable.tsx
│   │   └── StripeConnectCard.tsx
│   ├── create/
│   │   ├── NamesStep.tsx
│   │   ├── ThemeStep.tsx
│   │   ├── ExperiencesStep.tsx
│   │   └── ReviewStep.tsx
│   └── ui/
│       ├── Modal.tsx
│       ├── ProgressBar.tsx
│       ├── Avatar.tsx
│       ├── AvatarStack.tsx
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Confetti.tsx
│       └── EmojiPicker.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts                         # Browser client
│   │   ├── server.ts                         # Server component client
│   │   └── service.ts                        # Service role client (for webhooks)
│   ├── stripe.ts                             # Stripe + Connect helpers
│   ├── auth.ts                               # Session helpers, middleware utils
│   ├── themes.ts                             # Theme preset definitions
│   └── utils.ts                              # formatCents, getProgressPercentage, etc.
├── types/
│   └── database.ts                           # TypeScript types for all tables
└── middleware.ts                              # Protect /dashboard, /create routes
```

---

## 11. Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Stripe
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# App
NEXT_PUBLIC_BASE_URL=https://yourdomain.com
PLATFORM_FEE_PERCENT=5
```

---

## 12. Reference Implementation Notes

The existing single-tenant app at `/home/user/honeymoon` has these battle-tested patterns worth porting:

### Components to adapt (not copy verbatim — rebuild for multi-tenant):
- **ExperienceCard** (`src/components/ExperienceCard.tsx`) — card layout with emoji, progress bar, avatar stack
- **ExperienceDetail** (`src/components/ExperienceDetail.tsx`) — modal with sponsor list and gift CTA
- **CheckoutForm** (`src/components/CheckoutForm.tsx`) — two-step amount + info form with contextual presets
- **Admin Dashboard** (`src/app/admin/dashboard/page.tsx`) — 706 lines, full CRUD with stats, experience form with emoji picker, sponsor list with filtering. This is the most complex component and should be broken into smaller pieces for the SaaS version.
- **ProgressBar, Avatar, AvatarStack, Modal, CategoryFilter, Confetti** — all reusable, just need theme-awareness

### Business logic to port:
- **Checkout validation** (`src/app/api/checkout/route.ts`): remaining balance cap, min split enforcement, Stripe session creation with metadata
- **Webhook idempotency** (`src/app/api/webhooks/stripe/route.ts`): check for existing sponsor by `stripe_session_id` before inserting
- **Payment verification fallback** (`src/app/api/verify-payment/[sessionId]/route.ts`): handles cases where webhook hasn't fired yet when thank-you page loads
- **Contextual presets** (in CheckoutForm + ExperienceDetail): 25%/50%/75% of remaining amount

### Patterns to keep:
- `funded_cents` on experiences (denormalized for fast reads, updated via webhook)
- `display_order` for manual sorting
- `allow_splitting` + `min_split_cents` per experience
- Emoji as text column (simple, works great)
- CSS custom properties for all colors (already theme-ready)

### Patterns to change:
- Replace `ADMIN_PASSWORD` env var → Supabase Auth
- Replace cookie value `"authenticated"` → proper JWT sessions
- Replace hardcoded "Trevor & Carly" (8 places) → dynamic from registry config
- Replace global photo bucket → `{registry_id}/` path prefix
- Replace single Stripe account → Stripe Connect with `application_fee_amount`
- Add `registry_id` to all queries

---

## 13. Experience Template Packs

Pre-built experience sets couples can add with one click during onboarding:

### "Honeymoon in Paris" (from reference app)
| Title | Category | Price | Emoji |
|-------|----------|-------|-------|
| Dinner at Le Jules Verne | dining | $350 | 🗼 |
| Seine River Sunset Cruise | activities | $150 | 🚢 |
| One Night at Hôtel Plaza Athénée | hotels | $800 | 🏨 |
| Montmartre Wine & Cheese Tour | dining | $120 | 🧀 |
| Private Louvre Tour | activities | $250 | 🎨 |
| Train to Provence | transport | $200 | 🚂 |
| Hot Air Balloon over Burgundy | activities | $300 | 🎈 |
| Couples Spa Day | extras | $220 | 💆 |
| Café Hopping Fund | dining | $80 | ☕ |
| Versailles Day Trip | activities | $150 | 🏰 |
| Airport Transfer | transport | $100 | 🚗 |
| Souvenir & Gift Fund | extras | $100 | 🎁 |

### "Beach Getaway" (new)
| Title | Category | Price | Emoji |
|-------|----------|-------|-------|
| Beachfront Suite | hotels | $600 | 🏖️ |
| Sunset Sailing Trip | activities | $200 | ⛵ |
| Snorkeling Adventure | activities | $150 | 🤿 |
| Seafood Dinner on the Water | dining | $180 | 🦞 |
| Couples Massage on the Beach | extras | $200 | 💆 |
| Island Hopping Day Trip | activities | $250 | 🏝️ |
| Airport Transfers | transport | $100 | 🚗 |
| Beach Bar Fund | dining | $80 | 🍹 |

### "Start from Scratch"
- Empty registry, couple adds their own experiences

---

## 14. Categories (v1 — hardcoded, same as reference app)

```typescript
const CATEGORIES = {
  dining:     { label: 'Dining',      emoji: '🍽️' },
  hotels:     { label: 'Hotels',      emoji: '🏨' },
  activities: { label: 'Activities',  emoji: '🎯' },
  transport:  { label: 'Transport',   emoji: '🚗' },
  extras:     { label: 'Extras',      emoji: '✨' },
};
```

---

## 15. Non-Goals for V1

Do NOT build these yet:
- Custom domains / subdomains
- Multiple registries per account
- Guest accounts or wishlists
- Native mobile app
- Template marketplace
- Advanced analytics / exportable reports
- Email marketing / guest reminders
- Photo gallery feature
- RSVP / event management
- Custom categories per registry
- Internationalization / multi-currency
- Social login (Google, Apple) — add in v1.1

---

## 16. Security Requirements

- All dashboard/create routes protected by Supabase Auth middleware
- RLS policies enforce data isolation — no cross-tenant data leakage
- Service role key used ONLY in server-side API routes (webhooks, checkout)
- Stripe webhook signature verification on all webhook requests
- Slug validation: alphanumeric + hyphens only, 3-60 chars, no reserved words
- File uploads: validate file type (images only), max 5MB, path-isolated by registry
- No secrets in client-side code (all `NEXT_PUBLIC_` vars are safe to expose)
- Rate limiting on checkout and signup endpoints

---

## 17. Development Phases

### Phase 1: Foundation (Week 1-2)
- Project scaffolding (Next.js + Supabase + Stripe + Tailwind)
- Database schema + migrations + RLS policies
- Supabase Auth integration (signup, login, session middleware)
- Basic project structure and shared components (Button, Input, Modal, etc.)
- Theme system (CSS variables + presets + dynamic loading)
- Types for all database tables

### Phase 2: Registry CRUD (Week 2-3)
- Creation wizard (all 4 steps)
- Dashboard with full experience CRUD
- Dashboard gifts/sponsors view
- Dashboard settings page
- Registry slug validation
- Image upload with registry isolation

### Phase 3: Public Registry + Payments (Week 3-4)
- Public registry page (`/r/[slug]`) with theme application
- Experience cards, detail modal, category filter, progress bars
- Checkout flow with Stripe Connect
- Stripe Connect onboarding in dashboard settings
- Webhook handling with registry_id awareness
- Thank you page with confetti
- Payment verification fallback

### Phase 4: Landing Page + Polish (Week 4-5)
- Marketing landing page
- Template experience packs
- Email receipts (optional, via Resend or Supabase Edge Functions)
- SEO: dynamic OpenGraph tags per registry
- Error pages (404, registry not found)
- Mobile responsiveness pass
- End-to-end testing of full flow

---

## 18. Success Metrics

- **Activation:** % of signups that publish a registry
- **Conversion:** % of registry visitors that complete a gift
- **Revenue:** Total platform fees collected
- **Retention:** N/A (registries are time-bounded by nature)
- **Growth:** New registries per week, organic vs. referred
