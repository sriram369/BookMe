# BookMe Status

Updated: April 28, 2026

## Current GitHub State

Repository: https://github.com/sriram369/BookMe

The repository is public.

Branches:

- `main`: currently at `4b8c42a` (`Build operator admin dashboard`)
- `solution-client-mvp`: currently at `8e656ff` (`Harden BookMe onboarding API validation`)

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
        +--> OpenRouter LLM wrapper for the AI front desk
```

The app can run locally without real credentials using demo/local fallback behavior. For production, it expects real Supabase, OAuth, Google Sheets, and OpenRouter environment variables.

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
- Added hotel-aware agent endpoint.
- Added validation for onboarding, hotel setup, and agent messages.
- Added safe `/api/config` endpoint that reports missing env vars without leaking secrets.

## Frontend Work Completed

- Built the BookMe landing page.
- Added sign in and sign up pages.
- Added hotel owner onboarding flow.
- Added client onboarding chat that fills hotel setup details.
- Added room inventory intake UI.
- Added pricing/proposal generation UI.
- Added hotel admin dashboard.
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

1. Create Supabase project.
2. Run `supabase/schema.sql`.
3. Add Supabase env vars:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
   - `SUPABASE_SECRET_KEY`
4. Create Google OAuth app.
5. Add OAuth env vars:
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
6. Create Google Cloud service account.
7. Create/share a Google Sheet with that service account.
8. Add Sheets env vars:
   - `GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL`
   - `GOOGLE_SHEETS_PRIVATE_KEY`
   - `GOOGLE_SHEETS_SPREADSHEET_ID`
9. Rotate the OpenRouter key that was pasted in chat and add the new one:
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL=openrouter/free`

### Product/Engineering Work Still Needed

1. Test real OAuth sign up and sign in.
2. Test real Supabase hotel save/load.
3. Test real Google Sheets connector initialization.
4. Test real guest flow:
   - new booking
   - check-in
   - check-out
5. Add browser screenshot QA for landing, signup, onboarding, admin, and demo pages.
6. Add regression tests for:
   - unknown hotel slug behavior
   - onboarding validation
   - hotel config persistence
   - connector health
7. Create a pull request from `solution-client-mvp` into `main`.
8. Deploy to Vercel after env vars are configured.

## Current Assessment

The codebase is in a good MVP checkpoint state. The main architecture is clear and the pieces are connected at the code level.

The biggest remaining risk is not the UI anymore. It is live integration:

- OAuth must be tested with real callback URLs.
- Supabase must be tested with real project credentials.
- Google Sheets must be tested with real service-account permissions.
- The AI flow must be tested against real reservation/inventory data.

Once those are connected, BookMe can be tested as a real end-to-end hotel front desk demo.
