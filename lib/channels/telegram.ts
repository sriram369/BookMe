import "server-only";

import type { AgentResult } from "@/lib/agent/openrouter";
import type { SummaryCard } from "@/lib/hotel/types";

export type TelegramChannelConfig = {
  botToken: string;
  webhookSecret: string;
  hotelSlug: string;
};

export type TelegramUpdate = {
  update_id?: number;
  message?: {
    message_id?: number;
    text?: string;
    chat?: {
      id?: number | string;
      type?: string;
    };
    from?: {
      id?: number;
      username?: string;
      first_name?: string;
      last_name?: string;
    };
  };
};

type TelegramSendMessageResponse = {
  ok?: boolean;
  description?: string;
};

function cleanEnv(name: string) {
  return process.env[name]?.trim() || undefined;
}

export function getTelegramChannelConfig(): TelegramChannelConfig | null {
  const botToken = cleanEnv("TELEGRAM_BOT_TOKEN");
  const webhookSecret = cleanEnv("TELEGRAM_WEBHOOK_SECRET");
  const hotelSlug = cleanEnv("TELEGRAM_DEFAULT_HOTEL_SLUG") ?? cleanEnv("BOOKME_DEFAULT_HOTEL_SLUG") ?? "sriram-hotel";

  if (!botToken || !webhookSecret) return null;
  return { botToken, webhookSecret, hotelSlug };
}

export function getTelegramChannelStatus() {
  const missing = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_WEBHOOK_SECRET"].filter((name) => !cleanEnv(name));

  return {
    provider: "telegram" as const,
    configured: missing.length === 0,
    missing,
    hotelSlug: cleanEnv("TELEGRAM_DEFAULT_HOTEL_SLUG") ?? cleanEnv("BOOKME_DEFAULT_HOTEL_SLUG") ?? "sriram-hotel",
  };
}

export function verifyTelegramWebhookSecret(request: Request, config: TelegramChannelConfig) {
  return request.headers.get("x-telegram-bot-api-secret-token")?.trim() === config.webhookSecret;
}

export function extractTelegramGuestMessage(update: TelegramUpdate) {
  const chatId = update.message?.chat?.id;
  const text = update.message?.text?.trim();

  if (chatId === undefined || chatId === null || !text) return null;

  return {
    chatId,
    text,
    username: update.message?.from?.username,
    firstName: update.message?.from?.first_name,
  };
}

function cardText(card: SummaryCard | undefined) {
  if (!card) return "";

  const fields = card.fields.map((field) => `${field.label}: ${field.value}`).join("\n");
  return `\n\n${card.title}\nStatus: ${card.status}\n${fields}`;
}

export function telegramReplyFromAgentResult(result: AgentResult) {
  return `${result.message}${cardText(result.card)}`.slice(0, 3900);
}

export async function sendTelegramMessage(config: TelegramChannelConfig, chatId: number | string, text: string) {
  const response = await fetch(`https://api.telegram.org/bot${config.botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
    cache: "no-store",
  });

  const body = (await response.json().catch(() => ({}))) as TelegramSendMessageResponse;
  if (!response.ok || body.ok === false) {
    throw new Error(body.description ?? `Telegram sendMessage failed: ${response.status}`);
  }
}
