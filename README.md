# Event Master

Find and buy tickets to events across Nigeria — state by state, with admin-controlled
pricing and checkout via Flutterwave V3 (NGN) or Stripe (international cards).

Built to extend to other countries later: the data model treats country → state → event
as a chain of rows, not a hardcoded structure, so adding a second country is a data
operation, not a refactor.

## Stack

- **Frontend:** React + Vite, React Router, deployed to Vercel
- **Backend:** Supabase (Postgres + Auth + Edge Functions) — no separate server
- **Payments:** Flutterwave V3 (primary, NGN) + Stripe (international)

## Roles

- **Buyer** — browses events, buys tickets, no sign-up required to browse, sign-up required to check out
- **Organizer** — submits events + ticket types; events stay `pending` until admin approves
- **Admin** — approves/rejects events, and can override **any** ticket price on **any** event via a dedicated Pricing Control page. Every price change is written to `price_edit_log` with who changed it and why.

## 1. Set up Supabase

1. Create a new Supabase project.
2. In the SQL editor, run the migrations in order:
   - `supabase/migrations/0001_init.sql` — schema, RLS policies, seed data (Nigeria + 36 states + FCT + categories)
   - `supabase/migrations/0002_functions.sql` — triggers + the atomic ticket-sale and admin price-override functions
   - `supabase/migrations/0005_ticket_email.sql` — tracks Resend ticket-email delivery
3. Promote yourself to admin after signing up once through the app:
   ```sql
   update profiles set role = 'admin' where id = '<your-auth-user-id>';
   ```

## 2. Configure environment variables

Copy `.env.example` to `.env` and fill in your Supabase project URL + anon key:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Deploy the Edge Functions

You'll need the Supabase CLI (`npm i -g supabase`).

```bash
supabase login
supabase link --project-ref your-project-ref

supabase functions deploy create-payment
supabase functions deploy flutterwave-webhook
supabase functions deploy stripe-webhook
```

Set the function secrets (these never touch the frontend):

```bash
supabase secrets set FLW_SECRET_KEY=FLWSECK-xxxxx
supabase secrets set FLW_WEBHOOK_HASH=your-flutterwave-webhook-secret-hash
supabase secrets set RESEND_API_KEY=re_xxxxx
supabase secrets set RESEND_FROM_EMAIL="EventMasters <tickets@eventmasters.live>"
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
supabase secrets set SITE_URL=https://eventmaster.cc
```

## 4. Configure webhooks on each provider's dashboard

- **Flutterwave:** Dashboard → Settings → Webhooks → set URL to
  `https://your-project.supabase.co/functions/v1/flutterwave-webhook`,
  and set the secret hash to match `FLW_WEBHOOK_HASH`.
- **Stripe:** Dashboard → Developers → Webhooks → add endpoint
  `https://your-project.supabase.co/functions/v1/stripe-webhook`,
  listen for `checkout.session.completed`, and copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

## 5. Run locally

```bash
npm install
npm run dev
```

## 6. Deploy frontend to Vercel

```bash
vercel
```

`vercel.json` already rewrites all routes to `index.html` for client-side routing.
Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as Vercel environment variables.

## How a ticket purchase actually works

1. Buyer picks ticket quantities on the event page → goes to `/checkout`.
2. Checkout calls the `create-payment` edge function, which **re-validates prices and
   stock server-side** (never trusts the browser), creates a `pending` order, and asks
   Flutterwave or Stripe to start a transaction. The buyer is redirected to the provider.
3. After payment, the provider calls our webhook function directly (not through the
   browser). The webhook **re-verifies the transaction with the provider's API**, checks
   the amount matches, atomically decrements ticket stock (so two buyers can't oversell
   the last ticket), and generates one scannable `ticket_code` per ticket purchased.
4. Once tickets are issued, a branded ticket email is sent through Resend. Each ticket
   includes its QR code inline plus the ticket code and a link to My Tickets. Resend's
   idempotency key prevents duplicate sends if browser verification and the webhook race.
5. The buyer lands on `/payment-result`, which polls the order status and shows their
   tickets once the webhook has landed.

## Admin price control

`Admin → Pricing control` lists every approved/live event. Expanding an event shows its
ticket types with current price and remaining stock. Editing a price calls the
`admin_update_ticket_price` Postgres function (SECURITY DEFINER, admin-only), which
updates the price and writes an audit row in one transaction — so there's always a
record of who changed a price, from what, to what, and why.

## Extending to a second country later

Insert a new row into `countries`, then rows into `states` for that country's regions.
Nothing else in the schema, RLS policies, or UI assumes Nigeria specifically — the
event creation form and browse filters already pull states dynamically per country.
