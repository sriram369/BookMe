# BookMe Provider Demo Notes

BookMe can be presented without spending money. The live class demo should use the local web app and deterministic fail-closed provider paths.

## Free Class Demo Path

1. Start the app:

```bash
npm run dev
```

2. Open the guest demo:

```text
http://localhost:3000/demo?hotel=sriram-hotel
```

3. Show one guest workflow:

```text
I'm checking in, booking ID BKM-2001.
```

4. Open the admin dashboard:

```text
http://localhost:3000/admin?hotel=sriram-hotel
```

5. Show reservation status, audit activity, and the payment action in the Reservations table.

## Payment Demo

Click `Pay` on a reservation row.

Expected free-demo behavior:

- If Razorpay credentials are not configured, BookMe shows a setup-needed message.
- This is intentional: the system fails closed instead of faking a payment or letting the LLM mark a booking paid.

Expected production behavior:

- Staff clicks `Pay`.
- BookMe creates a Razorpay hosted payment link server-side.
- The hosted checkout opens in a new tab.
- Razorpay webhook verifies the payment event.
- BookMe updates the reservation payment status only after verified provider confirmation.

Required production variables:

```bash
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

## Telegram Demo

Telegram is optional. It is useful for a product story because it shows BookMe can run in a guest messaging channel, not only on the website.

Expected free-demo behavior:

- `/api/channels/telegram` reports missing credentials.
- Smoke tests verify the endpoint fails closed when credentials are absent.

Expected production behavior:

- Guest messages the Telegram bot.
- Telegram calls `/api/channels/telegram`.
- BookMe verifies the webhook secret.
- BookMe runs the same front-desk agent workflow.
- The bot replies with the result.

Required production variables:

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_DEFAULT_HOTEL_SLUG=sriram-hotel
```

## Presentation Line

“The demo runs fully locally for free. Paid providers are optional production adapters. When credentials are absent, BookMe fails closed and explains what setup is missing instead of pretending the integration worked.”
