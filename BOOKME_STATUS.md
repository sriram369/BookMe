# BookMe Status

Updated: April 29, 2026

## Current GitHub State

Repository: https://github.com/sriram369/BookMe

The repository is public.

Branches:

- `main`: currently at `4b8c42a` (`Build operator admin dashboard`)
- `solution-client-mvp`: latest active branch for the MVP work

The newest BookMe work is on `solution-client-mvp`. It has been pushed to GitHub, but there is no open pull request yet and it has not been merged into `main`.

## What We Built

BookMe is now shaped as an AI front desk platform for hotels, focused first on Indian small and mid-size hotels.

The product has two sides:

- Public BookMe website for people checking out the product.
- Hotel owner/admin side where a hotel can sign up, onboard, connect its reservation data, and run an AI front desk.

Core app routes:

- `/` - BookMe public landing page.
- `/signup` - sign up page with OAuth/local-demo handling.
- `/signin` - sign in page with OAuth/local-demo handling.
- `/onboarding` - hotel owner onboarding flow.
- `/demo?hotel=<slug>` - guest-facing hotel demo site.
- `/admin?hotel=<slug>` - hotel operator/admin dashboard.
- `/api/config` - safe config status endpoint.
- `/api/connectors` - Google Sheets connector health/init endpoint.
- `/api/hotels` - hotel config list/save API.
- `/api/hotels/[slug]` - single hotel dashboard API.
- `/api/agent` - AI front desk chat endpoint.

## Architecture

The current architecture is:

```text
Guest / Hotel Owner Browser
        |
        v
Next.js App Router UI
        |
        v
Next.js API Routes
        |
        +--> NextAuth OAuth for sign in/sign up
        |
        +--> Supabase/Postgres for BookMe users and hotel onboarding records
        |
        +--> Google Sheets connector for hotel reservations and inventory
        |
        +--> OpenRouter/OpenAI-compatible LLM wrapper for the AI front desk
```

The app can run locally without OAuth using demo/local auth behavior. Supabase, Google Sheets, and OpenRouter are now connected in local development. The current local model is `openai/gpt-4o-mini` through OpenRouter.

## Backend Work Completed

- Added NextAuth OAuth shell with Google/GitHub provider support.
- Added local-demo auth behavior when OAuth credentials are not configured.
- Added Supabase REST helpers for server-side persistence.
- Added Supabase schema in `supabase/schema.sql`.
- Added hotel config store that saves to Supabase when configured.
- Added local JSON fallback only for local development.
- Added Google Sheets connector.
- Added connector health endpoint.
- Added connector initialization support for expected Sheets tabs and headers.
- Added connector seed/reset endpoint at `/api/connectors/seed`.
- Added hotel-aware agent endpoint.
- Added deterministic booking pre-router for explicit date/room booking requests so the critical path uses tools reliably.
- Added validation for onboarding, hotel setup, and agent messages.
- Added safe `/api/config` endpoint that reports missing env vars without leaking secrets.
- Added payment placeholder fields for reservations.

## Frontend Work Completed

- Built the BookMe landing page.
- Added sign in and sign up pages.
- Added hotel owner onboarding flow.
- Added client onboarding chat that fills hotel setup details.
- Added room inventory intake UI.
- Added pricing/proposal generation UI.
- Added hotel admin dashboard.
- Added Payment column to the admin reservation table.
- Added dynamic hotel demo pages.
- Added cleaner error handling in onboarding when the server rejects invalid setup data.

## Google Sheets Contract

Expected tabs:

- `Reservations`
- `Inventory`
- `ID Log`
- `Audit Log`

Reservations columns:

- `booking_id`
- `guest_name`
- `phone`
- `email`
- `room_id`
- `checkin`
- `checkout`
- `status`
- `created_at`
- `checked_in_at`
- `checked_out_at`
- `payment_status`
- `payment_mode`
- `payment_provider`
- `payment_reference`
- `pay_at_property`

Inventory columns:

- `room_id`
- `room_type`
- `label`
- `price_per_night`
- `floor`
- `view`
- `max_guests`
- `is_active`

## Verification Completed

The latest pushed branch passed:

- `npm run typecheck`
- `npm run build`
- API smoke checks for invalid proposal/hotel/agent payloads returning `400`
- API smoke check for valid proposal payload returning `200`
- Google Sheets connector initialization
- Google Sheets demo reset
- AI availability check against Google Sheets
- AI booking creation against Google Sheets
- AI check-in against Google Sheets
- AI checkout against Google Sheets

Previous route smoke checks also passed:

- `/`
- `/signup`
- `/onboarding`
- `/admin?hotel=test-palace-jaipur`
- `/api/config`
- `/api/connectors`
- unknown hotel API slug returning `404`

## What Is Left

### Required Account Setup

These cannot be completed purely in code without the actual accounts and secrets:

1. Supabase project created and schema applied.
2. Supabase env vars configured locally:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
3. Google Sheets service account created and connected locally.
4. OpenRouter configured locally with:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL=openai/gpt-4o-mini`
5. Still needed: Google OAuth app/client secret.
6. Add OAuth env vars:
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
7. Before production, rotate any secrets pasted in chat and update Vercel/local env with the rotated values.

### Product/Engineering Work Still Needed

1. Test real OAuth sign up and sign in.
2. Add a proper payment provider integration plan/implementation:
   - MVP/current: `pay_at_property`
   - likely production default for India: Razorpay payment links + webhook
   - possible alternatives: Cashfree, Stripe, Google Pay/UPI via provider
3. Add browser screenshot QA for landing, signup, onboarding, admin, and demo pages.
4. Add regression tests for:
   - unknown hotel slug behavior
   - onboarding validation
   - hotel config persistence
   - connector health
   - deterministic booking flow
   - payment placeholder columns
5. Create a pull request from `solution-client-mvp` into `main`.
6. Deploy to Vercel after production env vars are configured.

## Current Assessment

The codebase is past the basic MVP plumbing stage. Supabase, Google Sheets, and AI tool-calling are connected locally and have been tested together.

The biggest remaining risk is not the UI anymore. It is live integration:

- OAuth must be tested with real callback URLs.
- Secrets must be rotated before production.
- Razorpay/Cashfree/Stripe payment choice must be implemented behind server-side webhooks, not controlled directly by the LLM.
- Browser QA and regression tests are still needed.

The current demo can run a real end-to-end hotel front desk flow against Google Sheets: availability, booking, check-in, and checkout.
