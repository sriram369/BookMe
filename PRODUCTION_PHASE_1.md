# BookMe Production Phase 1

Phase 1 turns BookMe from a strong demo MVP into a production-grade pilot for one independent hotel.

## Core Promise

BookMe v1 is an AI front desk that lets hotel guests complete routine booking, check-in, and checkout workflows while every data-changing action is grounded in tools, logged, and available for staff review.

## Current Status

| Area | Status | Notes |
|---|---|---|
| Guest booking/check-in/checkout | In progress | Demo and eval paths work. Critical flows have deterministic fallbacks. |
| README and class evaluation | Done | README, `eval/`, `npm run eval`, typecheck, and build are in place. |
| Data source | Started | Supabase connector now supports reservations/inventory as primary when healthy; Google Sheets/local store remain fallbacks. |
| Authentication | Started | NextAuth OAuth shell exists, hotel membership roles are modeled, and admin/API access is membership-gated when OAuth is enabled. |
| Audit logs | Started | Audit event schema/helper is in place, key AI workflow completions, blocked tools, invalid requests, and fallback paths are logged when Supabase is configured. |
| Admin operations | Started | Dashboard has connector status, recent activity, reservation search/filter, and manual check-in/check-out override; still needs handoff queue and notes. |
| Payments | Started | Razorpay payment-link design and deterministic API shell are in place; LLM remains blocked from direct payment control. |
| Monitoring | Not started | Needs error reporting, event logging, and daily operational review. |

## Phase 1 Must-Haves

1. **Production data model**
   - Add durable tables for hotels, users, reservations, inventory, guests, and audit events.
   - Keep Google Sheets as an optional pilot connector, not the only source of truth.
   - Add migration notes for moving demo data into Supabase.

2. **Auditability**
   - Log every AI-assisted workflow attempt.
   - Log tool name, sanitized tool inputs, outcome, booking ID when available, and timestamp.
   - Keep raw secrets and private credentials out of logs.

3. **Auth and hotel isolation**
   - Confirm OAuth works in production.
   - Add hotel membership/role mapping.
   - Protect admin routes from cross-hotel access.

4. **Reliable front-desk workflows**
   - Keep deterministic handling for critical booking/check-in/checkout paths.
   - Prevent double booking by checking availability at write time.
   - Add idempotency for booking creation.
   - Expand eval and regression tests.

5. **Operational admin**
   - Show connector status.
   - Show recent AI/tool audit events.
   - Allow staff to search reservations.
   - Provide manual handoff/override paths.

## Phase 1 Should-Haves

- Playwright smoke test for guest demo and admin dashboard.
- Clear production setup checklist.
- Staging environment.
- Error monitoring.
- Daily pilot review report.

## Out of Scope for Phase 1

- Direct refund automation.
- Direct cancellation automation.
- Payment disputes.
- Group bookings and corporate rates.
- Full PMS replacement.
- Multi-property enterprise dashboard.

## Working Backlog

| Priority | Item | Status |
|---|---|---|
| P0 | Commit and push class-ready README/eval work | Pending |
| P0 | Add production Phase 1 tracker | Done |
| P0 | Add audit event schema/helper | Done |
| P0 | Record AI/tool workflow audit events | Done |
| P0 | Add admin-visible audit/event view | Done |
| P0 | Harden Supabase failure behavior to avoid noisy request failures | Done |
| P0 | Add hotel membership and role tables | Done |
| P0 | Protect admin routes by role/hotel | Done |
| P1 | Move reservations/inventory toward Supabase primary store | Done |
| P1 | Add idempotency key to booking creation | Done |
| P1 | Add reservation search/filter in admin | Done |
| P1 | Add manual staff check-in/check-out override | Done |
| P1 | Add Playwright smoke tests | Done |
| P2 | Add Razorpay payment link design, no LLM payment control | Done |
| P2 | Add WhatsApp guest channel design | Pending |
| P2 | Plan/test Next.js major upgrade for npm audit advisories | Pending |

## Known Residual Risks

- `npm audit --omit=dev` reports advisories in the current Next.js line. The available automated fix is a major Next upgrade, so it should be handled as a planned framework upgrade with regression testing rather than a blind `--force` patch.
- Supabase primary reservations/inventory are implemented behind the connector interface, but true multi-hotel production will need per-request hotel scoping through the connector instead of the current default hotel slug.
- Booking idempotency now prevents common duplicate creates, but high-concurrency production booking should eventually move ID generation and room locking into a database function or transaction.

## How We Will Work

- I will keep changes small and pushable.
- After each slice, I will run relevant checks.
- We will keep this file as the production tracker.
- You can steer priorities any time by saying which backlog item matters most.
