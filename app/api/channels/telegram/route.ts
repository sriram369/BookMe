import { NextResponse } from "next/server";
import { runBookMeAgent } from "@/lib/agent/openrouter";
import {
  extractTelegramGuestMessage,
  getTelegramChannelConfig,
  getTelegramChannelStatus,
  sendTelegramMessage,
  telegramReplyFromAgentResult,
  type TelegramUpdate,
  verifyTelegramWebhookSecret,
} from "@/lib/channels/telegram";
import { auditBookMeEvent } from "@/lib/observability/audit";

export async function GET() {
  return NextResponse.json(getTelegramChannelStatus());
}

export async function POST(request: Request) {
  const config = getTelegramChannelConfig();
  if (!config) {
    await auditBookMeEvent({
      actorType: "system",
      eventType: "channel.telegram.not_configured",
      status: "blocked",
      message: "Telegram channel is not configured.",
    });
    return NextResponse.json(
      {
        error: "Telegram channel is not configured.",
        missing: getTelegramChannelStatus().missing,
      },
      { status: 501 },
    );
  }

  if (!verifyTelegramWebhookSecret(request, config)) {
    await auditBookMeEvent({
      hotelSlug: config.hotelSlug,
      actorType: "guest",
      eventType: "channel.telegram.invalid_secret",
      status: "blocked",
      message: "Rejected Telegram webhook with invalid secret token.",
    });
    return NextResponse.json({ error: "Invalid Telegram webhook secret." }, { status: 401 });
  }

  const update = (await request.json().catch(() => null)) as TelegramUpdate | null;
  const guestMessage = update ? extractTelegramGuestMessage(update) : null;

  if (!guestMessage) {
    await auditBookMeEvent({
      hotelSlug: config.hotelSlug,
      actorType: "guest",
      eventType: "channel.telegram.ignored",
      status: "ok",
      message: "Telegram update did not contain a text message.",
    });
    return NextResponse.json({ ok: true, ignored: true }, { status: 202 });
  }

  try {
    const result = await runBookMeAgent([{ role: "user", content: guestMessage.text }], config.hotelSlug);
    await sendTelegramMessage(config, guestMessage.chatId, telegramReplyFromAgentResult(result));

    await auditBookMeEvent({
      hotelSlug: config.hotelSlug,
      actorType: "guest",
      actorId: guestMessage.username ?? guestMessage.firstName ?? String(guestMessage.chatId),
      eventType: "channel.telegram.replied",
      workflow: "telegram_guest_message",
      toolName: result.toolCalls.at(-1) ?? null,
      bookingId: result.card?.fields.find((field) => field.label === "Booking")?.value,
      status: result.toolCalls.length > 0 || result.card ? "ok" : "blocked",
      message: result.message,
      metadata: {
        toolCalls: result.toolCalls,
        telegramChatId: String(guestMessage.chatId),
      },
    });

    return NextResponse.json({
      ok: true,
      hotelSlug: config.hotelSlug,
      toolCalls: result.toolCalls,
    });
  } catch (error) {
    await auditBookMeEvent({
      hotelSlug: config.hotelSlug,
      actorType: "system",
      eventType: "channel.telegram.failed",
      status: "error",
      message: error instanceof Error ? error.message : "Telegram channel failed.",
    });
    return NextResponse.json({ error: "Telegram channel failed." }, { status: 502 });
  }
}
