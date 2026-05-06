# How I Vibe-Coded a Honeymoon Registry in a Weekend

We're getting married. Carly and I already have plates and a toaster, so a traditional registry felt off. What we actually wanted help with was the *honeymoon* — the long lunch in Provence, the sunset boat in Cassis, the train to Nice. So I built a site where guests pick an experience and gift it.

I didn't write much of the code. I vibe-coded the whole thing with Claude Code over a weekend. This post is a practical walkthrough so you can do the same — for a honeymoon, a baby fund, a kickstarter for your goat farm, whatever.

## The stack

I deliberately kept this boring:

- **Next.js 16** (App Router) — one repo, API routes and pages in the same place
- **React 19** + **Tailwind 4** — Tailwind 4's zero-config setup is great for vibe coding
- **Supabase** — Postgres + storage + RLS, free tier covers a wedding easily
- **Stripe Checkout** — hosted checkout, no PCI scope, webhooks for fulfillment
- **Vercel** — push to deploy, done

Two tables: `experiences` and `sponsors`. That's the whole data model. An experience has a price; sponsors gift toward it; when `funded_cents >= price_cents` it's "fully funded."

## The vibe-coding loop that actually worked

The naive approach is to open Claude Code and say "build me a honeymoon registry." You'll get something. It probably won't be what you want. Here's the loop that worked for me:

### 1. Write a PRD first, even a sloppy one

Before any code, I asked Claude to draft a PRD: who the users are (guests, the couple, an admin), the core flows (browse → pick → pay → see your name on it), the constraints (no accounts, mobile-first, splittable gifts). I edited it for an hour. That document became the source of truth for every later prompt — when Claude drifted, I pasted the relevant section back in.

The PRD is still in the repo (`PRD-experience-registry-saas.md`) because I ended up extending it into a SaaS-shaped thing. You don't need that. A one-pager is enough.

### 2. Build the schema and types before the UI

I had Claude write the SQL migration and the TypeScript types in the same pass, so they couldn't drift. Two files, ~80 lines of SQL, ~40 lines of TS. Everything downstream — API routes, components, the admin dashboard — leaned on those types. When something broke later, the type error pointed straight at the bug.

If you skip this step and let the model invent shapes inline, you'll spend the rest of the weekend reconciling four slightly-different versions of "Experience."

### 3. One feature per branch, one branch per chat

I stopped trying to hold the whole app in one conversation. Each feature got its own branch and its own Claude Code session: "add image uploads to the admin dashboard," "let guests split a gift," "duplicate an experience from admin." Short context, focused diffs, easy to review.

The git log tells the story: `Add duplicate button for experiences`, `Fix experience creation failing on empty table`, `South of France theme overhaul`. Tiny PRs. Most merged in under ten minutes.

### 4. Let Claude run the server and click around

The biggest single upgrade was telling Claude to actually run `npm run dev` and use the feature in a browser before declaring it done. Before that, I'd get "looks good!" on code that errored at runtime. After that, I'd get "the upload works but the image is 401-ing on the public URL — fixing the bucket policy now."

If you're on Claude Code, the dev-loop tools make this trivial. Use them.

### 5. Stripe last

I wired Stripe last, on purpose. Until then I just had a fake "Mark as funded" button on the admin page so I could test the success states. When the rest of the app worked, I swapped the button for a real `/api/checkout` route that creates a Stripe Checkout Session, plus a `/api/webhooks/stripe` route that inserts the sponsor row when the `checkout.session.completed` event arrives.

Two gotchas Claude handled well once I was specific:

- **Idempotency.** Webhooks retry. The `sponsors` table has a unique constraint on `stripe_session_id`, so a duplicate event becomes a no-op insert instead of a double-counted gift.
- **Verifying the session on the thank-you page.** Don't trust query params from the redirect — call Stripe with the session id and only show the celebration if it actually paid.

## Things that bit me

- **Empty-state crashes.** The first deploy threw because the home page assumed the experiences API returned an array. With zero experiences seeded, it returned an error object and `.map` blew up. Fix: make the API return `[]` on error, and have the client coerce. Boring, ten-line PR, but worth doing early.
- **RLS, twice.** I let Claude generate the Supabase Row Level Security policies and then wrote the API routes against the service-role key. Both worked. Together they were confusing — was a 401 a bug, an RLS policy, or a missing env var? Pick a side: either go full RLS with the anon key, or use the service key and lock writes behind your own auth.
- **Theme drift.** I told Claude "make it feel like the South of France" and got a beautiful design, but every subsequent prompt nudged the palette. Pin your colors in `globals.css` as CSS variables and reference them. Vibe coding without design tokens is a slow trip back to Bootstrap.

## What I'd tell you if you're starting tomorrow

1. **Do the PRD.** Even badly. It's the cheapest thing you'll do all weekend and it pays for itself by Sunday morning.
2. **Lock the schema and types early.** Everything else is downstream of that.
3. **One branch, one feature, one chat.** Resist the urge to keep going in a conversation that's already drifted.
4. **Make Claude actually run the thing.** A passing typecheck is not a working feature.
5. **Wire payments last.** They're fiddly and fun to debug *after* the rest of the site works, not before.

Total cost: a Vercel hobby account, a Supabase free tier, Stripe's percentage on real gifts, and a weekend. Total stress: low. Total guests confused by the registry: zero so far.

If you build one of these for your own thing, send me a link. I'd love to see what you make.

— Trevor
