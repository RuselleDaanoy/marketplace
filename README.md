## SUpost Mini-Marketplace

A full-stack campus marketplace web application built with Next.js, React, Tailwind CSS, and Supabase. Created as part of the SUpost Junior React / Next.js Developer technical challenge.

### Features

Create Listings: Upload item photos via Supabase Storage and publish listings with title, description, price, seller email, and category.

Browse & Search: Responsive grid view with category filter tabs (Electronics, Vehicles, Books, Clothing, Home) and real-time keyword search.

Listing Detail Pages: Dedicated dynamic routes (/listings/[id]) displaying full item photos, seller info, and item descriptions.

Message Seller: Built-in inquiry form that saves buyer messages directly to Supabase PostgreSQL.

### Tech Stack

Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS, Lucide Icons

Backend & Database: Supabase (PostgreSQL, Storage)

Payments: Stripe Connect (Express accounts, direct charges, 10% platform fee)

Deployment: Vercel

## Payments (Stripe Connect, test mode)

Sellers connect a Stripe Express account with the email they use on their
listings. Once Stripe reports `charges_enabled`, their listings get a
**Buy Now** button that opens Stripe Checkout as a **direct charge** on the
connected account, with a 10% application fee kept by the marketplace.

The shared sandbox uses Stripe **Managed Risk** (Stripe collects losses), which
requires **Accounts v2** and, for the Express dashboard, a preview API version.
`lib/stripe-connect.ts` creates accounts accordingly
(`fees_collector`/`losses_collector` = `stripe`, dashboard `express`, preview
version `2026-10-28.preview`) and reads capability status from
`configuration.merchant.capabilities.card_payments`.

Flow:

1. `/sell` — seller enters their email, clicks **Connect with Stripe**, finishes
   Stripe's hosted onboarding. The connected account ID and payout flags are
   stored in `public.sellers`.
2. `/listings/[id]` — **Buy Now** is shown only for listings whose seller has
   `charges_enabled` and that are not sold. `POST /api/stripe/checkout` creates
   the session on the connected account and writes a `pending` order.
3. `/success?session_id=...` — confirmation page. The webhook flips the order to
   `paid` and marks the listing sold; the page refreshes itself while pending.
4. `POST /api/stripe/webhook` — verifies the signature and handles
   `checkout.session.completed` and `account.updated`. Unrecognised accounts
   and orders (the sandbox is shared) are acknowledged and ignored. Because v2
   accounts don't emit `account.updated`, seller flags are also refreshed live
   when the seller returns from onboarding and, if needed, right before
   checkout.

### Setup

1. Apply the database migration — run `supabase/schema.sql` (if the project is
   new) and then `supabase/stripe.sql` in the Supabase SQL editor. This adds
   `listings.sold`, the `sellers` and `orders` tables, and the RLS policies the
   API routes need.
2. Environment variables (`.env.local` locally, Environment Variables on Vercel):

   ```
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
   STRIPE_SECRET_KEY=sk_test_...
   STRIPE_WEBHOOK_SECRET=whsec_...   # printed by the script in step 4
   ```

   The Supabase URL and anon key are also required. Optionally set
   `SUPABASE_SERVICE_ROLE_KEY` on the server — the API routes use it when
   present and fall back to the anon key (whose RLS policies are permissive in
   this demo app). Never commit `.env.local`; both it and `.env*` are ignored.
3. Deploy to Vercel and note the production URL (preview URLs are protected, so
   Stripe can't reach them).
4. Register the webhook once, then put the printed secret in
   `STRIPE_WEBHOOK_SECRET` and redeploy:

   ```bash
   node --env-file=.env.local scripts/create-webhook.mjs https://your-app.vercel.app
   ```

5. Test with card `4242 4242 4242 4242`, any future expiry, any CVC/ZIP. Use
   Stripe's test data for seller onboarding (identity, `000 000 0000` SSN,
   `000123456789` routing / `000123456789` account numbers).