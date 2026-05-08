# BookMe Provider Demo Notes

BookMe can be presented without spending money. The live class demo should use the local guest website and admin dashboard. Provider integrations are optional production proof points, not the core demo.

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

## Presentation Line

“The main product is a guest web portal that a hotel can share by QR code, SMS, email, or website button. The local demo runs for free. Payment providers are optional production adapters, and when credentials are absent, BookMe fails closed instead of pretending the integration worked.”
