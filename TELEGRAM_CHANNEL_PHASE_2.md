# BookMe Telegram Channel Phase 2

Telegram is the preferred first guest messaging channel for BookMe because it is easier to demo and pilot than WhatsApp Business. It lets guests message a bot, while BookMe reuses the same deterministic front-desk agent and reservation tools behind the web demo.

## Core Rule

Telegram is only a channel adapter. It must not introduce new business logic, booking rules, payment authority, or staff-only actions. Guest messages are routed into the existing BookMe agent workflow.

## Environment Variables

```bash
TELEGRAM_BOT_TOKEN=
TELEGRAM_WEBHOOK_SECRET=
TELEGRAM_DEFAULT_HOTEL_SLUG=sriram-hotel
```

`TELEGRAM_DEFAULT_HOTEL_SLUG` is optional. If it is not set, BookMe uses `BOOKME_DEFAULT_HOTEL_SLUG` or `sriram-hotel`.

## API Shape

Webhook endpoint:

```http
POST /api/channels/telegram
```

Health endpoint:

```http
GET /api/channels/telegram
```

Required webhook behavior:

- fail closed if bot credentials are missing
- verify `x-telegram-bot-api-secret-token`
- ignore non-text updates
- route guest text to the same BookMe agent used by `/api/agent`
- send the agent response back through Telegram `sendMessage`
- log channel outcomes as audit events

## Setup Notes

1. Create a bot with BotFather and store the token as `TELEGRAM_BOT_TOKEN`.
2. Generate a random `TELEGRAM_WEBHOOK_SECRET`.
3. Deploy BookMe to an HTTPS URL.
4. Register the webhook with Telegram:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://YOUR_DOMAIN/api/channels/telegram",
    "secret_token": "'"$TELEGRAM_WEBHOOK_SECRET"'",
    "allowed_updates": ["message"]
  }'
```

## Demo Script

Guest sends:

```text
I'm checking in, booking ID BKM-2001.
```

Expected behavior:

- Telegram sends the message to BookMe webhook.
- BookMe verifies the secret token.
- BookMe calls the existing check-in workflow.
- The bot replies with the check-in result and summary card fields.

## Non-Goals

- No Telegram payments.
- No staff admin actions through Telegram.
- No group-chat support in the first pilot.
- No long-term chat memory beyond the single message handoff.
