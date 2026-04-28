# BookMe

BookMe is an AI front-desk system for independent hotels.

The MVP flow is:

```text
Landing page -> Sign up -> Owner onboarding chat -> Hotel admin dashboard -> Guest demo site -> AI front desk -> Sheets tools
```

## Local Development

```bash
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

## Key Routes

- `/` - BookMe landing page
- `/signup` - owner sign up
- `/signin` - owner sign in
- `/onboarding` - chat-led hotel setup
- `/admin?hotel=sriram-hotel` - hotel admin dashboard
- `/demo?hotel=sriram-hotel` - guest-facing hotel demo
- `/api/config` - safe deployment configuration status
- `/api/connectors` - connector health

## Deployment

See `DEPLOYMENT.md`.
