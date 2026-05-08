# BookMe Security Upgrade Plan

Last checked: May 8, 2026 with `npm audit --omit=dev`.

## Current Finding

`npm audit` reports production advisories through the current Next.js dependency line. The available automated fix is a semver-major upgrade to Next.js `16.2.6`, so BookMe should not apply `npm audit fix --force` blindly before the class demo.

Observed advisories:

| Package | Severity | Summary | Current Fix Path |
|---|---:|---|---|
| `next` | High | Server Components / request handling denial-of-service advisories | Upgrade to Next.js 16 |
| `postcss` via `next` | Moderate | CSS stringify XSS advisory in transitive dependency | Upgrade to Next.js 16 |

## Why Not Force It Today

BookMe is on Next.js 14 with React 18. A direct Next.js 16 upgrade may require React 19 compatibility checks, App Router behavior checks, middleware checks, auth flow verification, and smoke testing across the demo/admin routes. That is worth doing, but it should be handled as an upgrade branch, not mixed into payment/channel work.

## Upgrade Branch Plan

1. Create a dedicated branch from `solution-client-mvp`.
2. Upgrade Next.js, ESLint config, and React packages together.
3. Run:

```bash
npm install
npm run typecheck
npm run build
npm run smoke
npm run eval
npm audit --omit=dev
```

4. Manually verify:

- `/demo?hotel=sriram-hotel`
- `/admin?hotel=sriram-hotel`
- `/api/agent`
- `/api/payments/razorpay-link`
- `/api/payments/razorpay-webhook`
- `/api/channels/telegram`
- NextAuth sign-in behavior when OAuth variables are configured

5. Merge only if the build, smoke tests, evals, and audit all pass.

## Current Demo Risk

For the no-cost class demo, BookMe runs locally and does not need to expose a public production server. The advisories should still be addressed before any real hotel pilot, especially before exposing the app to public traffic.
