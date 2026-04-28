# BookMe Deployment Guide

This is the lowest-cost production path for the current BookMe MVP.

## Target Stack

- Hosting: Vercel Hobby
- Database: Supabase Free, region `South Asia (Mumbai) ap-south-1`
- Reservation backend: Google Sheets
- Auth: Google OAuth through NextAuth
- AI: OpenRouter free model for demos, paid OpenAI/OpenRouter model later

## 1. Supabase

1. Create a Supabase project.
2. Choose region: `South Asia (Mumbai) ap-south-1`.
3. Open SQL Editor.
4. Run the full contents of `supabase/schema.sql`.
5. Copy:
   - Project URL
   - Service role key
   - Anon key

Required env vars:

```bash
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_ANON_KEY=
```

The app uses the service-role key only on the server. Do not expose it in client code.

## 2. Google OAuth

Create OAuth credentials in Google Cloud Console.

Authorized redirect URIs:

```text
http://localhost:3000/api/auth/callback/google
https://YOUR_DOMAIN/api/auth/callback/google
```

Required env vars:

```bash
NEXTAUTH_URL=https://YOUR_DOMAIN
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

Generate `NEXTAUTH_SECRET` with:

```bash
openssl rand -base64 32
```

## 3. Google Sheets

1. Create a Google Cloud service account.
2. Create a JSON key.
3. Copy the service account email.
4. Create a Google Sheet for the hotel.
5. Share the Google Sheet with the service account email as Editor.
6. Copy the spreadsheet ID from the URL.

Required env vars:

```bash
GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL=
GOOGLE_SHEETS_PRIVATE_KEY=
GOOGLE_SHEETS_SPREADSHEET_ID=
```

For `GOOGLE_SHEETS_PRIVATE_KEY`, keep the escaped newline format:

```text
-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

After deploy, call:

```bash
POST /api/connectors
{
  "connectorId": "google-sheets",
  "initialize": true
}
```

This creates/initializes:

- `Reservations`
- `Inventory`
- `ID Log`
- `Audit Log`

## 4. OpenRouter

Required env vars:

```bash
OPENROUTER_API_KEY=
OPENROUTER_MODEL=openrouter/free
NEXT_PUBLIC_SITE_URL=https://YOUR_DOMAIN
```

Rotate any key that was pasted into chat before using it in production.

## 5. Vercel

1. Import the GitHub repo into Vercel.
2. Add all env vars from `.env.production.example`.
3. Deploy.
4. Set Google OAuth hosted callback URL after Vercel gives the domain.
5. Redeploy after changing OAuth callback/env vars.

## 6. Production Smoke Test

After deploy:

1. Open `/api/config`.
2. Confirm:
   - Supabase configured
   - Sheets configured
   - OpenRouter configured
   - Auth mode is `oauth`
3. Open `/signup`.
4. Sign in with Google.
5. Complete `/onboarding`.
6. Open generated `/admin?hotel=...`.
7. Open generated `/demo?hotel=...`.
8. Test a guest chat message.
9. Open `/api/connectors` and confirm Google Sheets is `ok`.

## Notes

- Local JSON fallback is only for local development. Hosted production should use Supabase.
- Payments, refunds, cancellations, disputes, corporate rates, and special accommodation requests should remain staff handoff workflows.
- For India hotels, keep WhatsApp as the next channel after the web demo.
