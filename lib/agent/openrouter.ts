import type { SummaryCard, ToolResult } from "@/lib/hotel/types";
import { toolFromName } from "@/lib/hotel/tools";

export type ClientChatMessage = {
  role: "user" | "assistant";
  content: string;
};

type OpenRouterMessage =
  | { role: "system"; content: string }
  | { role: "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };

type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

type OpenRouterChoice = {
  message: {
    role: "assistant";
    content?: string | null;
    tool_calls?: ToolCall[];
  };
};

type OpenRouterResponse = {
  model?: string;
  choices?: OpenRouterChoice[];
  error?: {
    message?: string;
  };
};

export type AgentResult = {
  message: string;
  card?: SummaryCard;
  model?: string;
  toolCalls: string[];
};

const systemPrompt = () => {
  const today = new Date().toISOString().slice(0, 10);

  return `You are BookMe, the AI front desk for Sriram Hotel in Downtown Boston.
Today is ${today}.

You can help with exactly three workflows:
1. New room booking
2. Check-in for an existing reservation
3. Check-out for an existing checked-in reservation

Rules:
- Never invent room numbers, prices, availability, totals, booking IDs, or statuses.
- Use tools for all reservation lookup, availability, booking creation, check-in, and checkout actions.
- For booking, call check_availability before create_booking.
- Do not call create_booking unless the guest explicitly confirms.
- If information is missing, ask one concise follow-up question.
- Cancellations, refunds, payments, complaints, corporate rates, and accessibility accommodations require human staff.
- Keep responses short, calm, and hotel-appropriate.`;
};

const tools = [
  {
    type: "function",
    function: {
      name: "lookup_guest",
      description: "Look up an existing reservation by full phone number, email address, or booking ID.",
      parameters: {
        type: "object",
        properties: {
          identifier: {
            type: "string",
            description: "Full guest phone number, email address, or booking ID.",
          },
        },
        required: ["identifier"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "check_availability",
      description: "Check active room inventory for a date range and optional room type.",
      parameters: {
        type: "object",
        properties: {
          checkin: { type: "string", description: "Check-in date in YYYY-MM-DD format." },
          checkout: { type: "string", description: "Check-out date in YYYY-MM-DD format." },
          room_type: {
            type: "string",
            enum: ["queen", "king", "suite", "basic"],
            description: "Requested room type.",
          },
        },
        required: ["checkin", "checkout"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "create_booking",
      description: "Create a booking after availability has been checked and the guest explicitly confirms.",
      parameters: {
        type: "object",
        properties: {
          guest_name: { type: "string" },
          phone: { type: "string" },
          email: { type: "string" },
          room_id: { type: "string" },
          checkin: { type: "string", description: "YYYY-MM-DD" },
          checkout: { type: "string", description: "YYYY-MM-DD" },
          confirmed_by_guest: {
            type: "boolean",
            description: "True only when the guest explicitly said yes/confirm/book it.",
          },
        },
        required: ["guest_name", "room_id", "checkin", "checkout", "confirmed_by_guest"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkin_guest",
      description: "Mark an existing reservation as checked in.",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string" },
        },
        required: ["booking_id"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkout_guest",
      description: "Mark an existing checked-in reservation as checked out.",
      parameters: {
        type: "object",
        properties: {
          booking_id: { type: "string" },
        },
        required: ["booking_id"],
      },
    },
  },
] as const;

function parseToolArgs(value: string) {
  try {
    return JSON.parse(value || "{}") as unknown;
  } catch {
    return {};
  }
}

function fallbackAgent(messages: ClientChatMessage[]): AgentResult {
  const latest = messages[messages.length - 1]?.content ?? "";
  const lower = latest.toLowerCase();
  const bookingId = latest.match(/bkm-\d{4,}/i)?.[0];
  const phone = latest.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0];

  if (lower.includes("check in") || lower.includes("checking in")) {
    if (bookingId) {
      const result = toolFromName("checkin_guest", { booking_id: bookingId });
      return {
        message: result.message,
        card: result.card,
        toolCalls: ["checkin_guest"],
      };
    }

    if (phone) {
      const lookup = toolFromName("lookup_guest", { identifier: phone });
      const reservation = lookup.data as { bookingId?: string } | undefined;
      if (lookup.ok && reservation?.bookingId) {
        const checkin = toolFromName("checkin_guest", { booking_id: reservation.bookingId });
        return {
          message: checkin.message,
          card: checkin.card,
          toolCalls: ["lookup_guest", "checkin_guest"],
        };
      }

      return { message: lookup.message, card: lookup.card, toolCalls: ["lookup_guest"] };
    }

    return {
      message: "I can check you in. Please send your booking ID, full phone number, or email address.",
      toolCalls: [],
    };
  }

  if (lower.includes("check out") || lower.includes("checkout")) {
    if (!bookingId) {
      return {
        message: "I can check you out. Please send your booking ID.",
        toolCalls: [],
      };
    }

    const result = toolFromName("checkout_guest", { booking_id: bookingId });
    return {
      message: result.message,
      card: result.card,
      toolCalls: ["checkout_guest"],
    };
  }

  return {
    message:
      "I can help you book a room, check in, or check out. What would you like to do today?",
    toolCalls: [],
  };
}

export async function runBookMeAgent(messages: ClientChatMessage[]): Promise<AgentResult> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return fallbackAgent(messages);
  }

  const requestMessages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt() },
    ...messages.map((message) => ({ role: message.role, content: message.content }) as OpenRouterMessage),
  ];

  let latestCard: SummaryCard | undefined;
  const toolCalls: string[] = [];
  let model: string | undefined;

  for (let step = 0; step < 4; step++) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title": "BookMe",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
        messages: requestMessages,
        tools,
        tool_choice: "auto",
        temperature: 0.2,
      }),
    });

    const data = (await response.json()) as OpenRouterResponse;
    if (!response.ok || data.error) {
      return fallbackAgent(messages);
    }

    model = data.model;
    const assistant = data.choices?.[0]?.message;
    if (!assistant) {
      return fallbackAgent(messages);
    }

    const calls = assistant.tool_calls ?? [];
    if (calls.length === 0) {
      const content = assistant.content?.trim();
      return {
        message: content || fallbackAgent(messages).message,
        card: latestCard,
        model,
        toolCalls,
      };
    }

    requestMessages.push({
      role: "assistant",
      content: assistant.content ?? null,
      tool_calls: calls,
    });

    for (const call of calls) {
      const result: ToolResult = toolFromName(call.function.name, parseToolArgs(call.function.arguments));
      toolCalls.push(call.function.name);
      latestCard = result.card ?? latestCard;
      requestMessages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return {
    message: latestCard
      ? `${latestCard.title}: ${latestCard.status}.`
      : fallbackAgent(messages).message,
    card: latestCard,
    model,
    toolCalls,
  };
}

