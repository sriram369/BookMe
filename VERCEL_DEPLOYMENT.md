# BookMe Vercel Deployment

Production app:

```text
https://bookme-vercel.vercel.app
```

Primary demo routes:

```text
https://bookme-vercel.vercel.app/demo?hotel=sriram-hotel
https://bookme-vercel.vercel.app/admin?hotel=sriram-hotel
```

Vercel project:

```text
bookme-vercel
```

## Production Verification

Last verified from the CLI after production deployment:

```bash
BOOKME_BASE_URL=https://bookme-vercel.vercel.app npm run smoke
BOOKME_BASE_URL=https://bookme-vercel.vercel.app npm run eval
```

Results:

- Smoke tests: 6/6 passed
- Eval cases: 8/8 passed

## Production Scope

The deployed demo is the guest web portal plus hotel admin dashboard. Razorpay remains an optional production payment adapter and fails closed when credentials are absent.
