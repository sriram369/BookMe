# BookMe Payments Phase 2

Phase 2 adds payment-link support without giving the LLM direct control over money movement.

## Core Rule

The AI may explain payment status or route a guest to staff, but it must not directly create, verify, cancel, refund, or mark payments paid. Payment operations are deterministic server workflows.

## Provider Choice

For an India hotel pilot, the first provider is Razorpay Payment Links.

Why:

- supports UPI, cards, and net banking
- supports hosted payment links
- avoids collecting card data inside BookMe
- provides webhook callbacks for payment status
- works well for pay-before-arrival or payment-at-property upgrade flows

## Safe Architecture

```text
Admin / deterministic server action
  |
  v
BookMe payment-link API
  - verifies admin hotel access
  - validates booking ID and amount
  - checks provider credentials
  - creates Razorpay payment link server-side
  - logs audit event
  |
  v
Razorpay Payment Links API
  |
  v
Guest pays on Razorpay-hosted page
  |
  v
Webhook verifies signature server-side
  |
  v
Reservation payment fields update
```

## Environment Variables

```bash
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
BOOKME_PAYMENT_PROVIDER=razorpay
```

## API Shape

Create a payment link:

```http
POST /api/payments/razorpay-link
```

Body:

```json
{
  "hotelSlug": "sriram-hotel",
  "bookingId": "BKM-2001",
  "amountInPaise": 499900,
  "description": "Room payment for BKM-2001",
  "customer": {
    "name": "James Lee",
    "email": "james@example.com",
    "phone": "+916175550192"
  }
}
```

Expected behavior:

- If Razorpay credentials are missing, return `501` with a safe setup message.
- If the user is not authorized for the hotel, return `403`.
- If the request is invalid, return `400`.
- If Razorpay succeeds, return a hosted payment link URL and reference ID.
- Always log an audit event.

## Webhook Phase

The first webhook shell is implemented and fails closed unless `RAZORPAY_WEBHOOK_SECRET` is configured.

Webhook endpoint:

```http
POST /api/payments/razorpay-webhook
```

Required behavior:

- verify `x-razorpay-signature` against the raw request body
- reject unverified events before parsing payment status
- update payment status only after verified provider event
- never trust client-submitted payment status
- log every webhook event

Supported updates:

- `payment_link.paid`, paid payment link status, or captured payment status marks the booking `paid`
- `payment.failed`, cancelled payment links, and expired payment links mark the booking `failed`
- unrelated verified events are acknowledged as ignored

The webhook resolves the booking from Razorpay `reference_id` or `notes.booking_id`, then writes through the configured reservation connector.

## Explicit Non-Goals

- No refunds in the AI workflow.
- No cancellation automation.
- No client-side secret usage.
- No LLM-created payment links.
- No marking a booking paid without provider verification.
