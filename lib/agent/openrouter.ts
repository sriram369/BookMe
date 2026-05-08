import type { SummaryCard, ToolResult } from "@/lib/hotel/types";
import { toolFromNameAsync } from "@/lib/hotel/tools";
import { getHotelConfig, type HotelConfig } from "@/lib/hotel/config-store";
import { auditBookMeEvent } from "@/lib/observability/audit";

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

type ChatProviderConfig = {
  endpoint: string;
  apiKey: string;
  model: string;
  headers: Record<string, string>;
};

export type AgentResult = {
  message: string;
  card?: SummaryCard;
  model?: string;
  toolCalls: string[];
};

const systemPrompt = (hotel: HotelConfig) => {
  const today = new Date().toISOString().slice(0, 10);

  return `You are BookMe, the AI front desk for ${hotel.hotelName} in ${hotel.city}.
Today is ${today}.
Hotel check-in window: ${hotel.checkinWindow}.
Escalation contact for staff handoff: ${hotel.escalationContact}.
Reservation source: ${hotel.sourceSystem}.
Room types and base rates:
${hotel.roomTypes.map((room) => `- ${room.type}: ${room.count} rooms, INR ${room.rate}/night`).join("\n")}

You can help with exactly three workflows:
1. New room booking
2. Check-in for an existing reservation
3. Check-out for an existing checked-in reservation

Rules:
- Never invent room numbers, prices, availability, totals, booking IDs, or statuses.
- Use tools for all reservation lookup, availability, booking creation, check-in, and checkout actions.
- For booking, call check_availability before create_booking.
- If the guest asks for a room category, use the matching category: deluxe/basic/standard maps to queen, executive/king maps to king, family/suite maps to suite.
- Never create a booking for a different room category than the guest requested or than you just quoted.
- Do not call create_booking unless the guest explicitly confirms.
- If information is missing, ask one concise follow-up question.
- Cancellations, refunds, payments, complaints, corporate rates, KYC disputes, and accessibility accommodations require human staff.
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
            enum: ["queen", "king", "suite", "basic", "deluxe", "standard", "executive", "family"],
            description: "Requested room type or hotel category. Use deluxe/basic/standard for queen-style rooms, executive/king for king rooms, family/suite for suites.",
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

function openRouterTimeoutSignal() {
  const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS ?? 15000);
  return AbortSignal.timeout(Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000);
}

function resultFromLatestTool(
  latestCard: SummaryCard | undefined,
  toolCalls: string[],
  model: string | undefined,
): AgentResult | undefined {
  if (!latestCard || toolCalls.length === 0) return undefined;

  return {
    message: `${latestCard.title}: ${latestCard.status}.`,
    card: latestCard,
    model,
    toolCalls,
  };
}

function isTerminalWorkflowTool(name: string) {
  return name === "create_booking" || name === "checkin_guest" || name === "checkout_guest";
}

type AvailabilitySnapshot = {
  roomId: string;
  checkin: string;
  checkout: string;
};

function availabilityFromToolResult(result: ToolResult): AvailabilitySnapshot | undefined {
  if (!result.ok || typeof result.data !== "object" || result.data === null) return undefined;

  const data = result.data as {
    room?: { roomId?: unknown };
    checkin?: unknown;
    checkout?: unknown;
  };
  if (
    typeof data.room?.roomId !== "string" ||
    typeof data.checkin !== "string" ||
    typeof data.checkout !== "string"
  ) {
    return undefined;
  }

  return {
    roomId: data.room.roomId,
    checkin: data.checkin,
    checkout: data.checkout,
  };
}

function bookingMatchesAvailability(rawArgs: unknown, availability: AvailabilitySnapshot | undefined) {
  const args = typeof rawArgs === "object" && rawArgs !== null ? (rawArgs as Record<string, unknown>) : {};
  return (
    availability &&
    String(args.room_id ?? "").toLowerCase() === availability.roomId.toLowerCase() &&
    String(args.checkin ?? "") === availability.checkin &&
    String(args.checkout ?? "") === availability.checkout
  );
}

function getChatProviderConfig(): ChatProviderConfig | undefined {
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  if (openAiKey) {
    return {
      endpoint: "https://api.openai.com/v1/chat/completions",
      apiKey: openAiKey,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
      headers: {
        Authorization: `Bearer ${openAiKey}`,
        "Content-Type": "application/json",
      },
    };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (openRouterKey) {
    return {
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: openRouterKey,
      model: process.env.OPENROUTER_MODEL?.trim() || "openrouter/free",
      headers: {
        Authorization: `Bearer ${openRouterKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title": "BookMe",
      },
    };
  }

  return undefined;
}

async function fallbackAgent(messages: ClientChatMessage[], hotel: HotelConfig): Promise<AgentResult> {
  const latest = messages[messages.length - 1]?.content ?? "";
  const lower = latest.toLowerCase();
  const bookingId = latest.match(/bkm-\d{4,}/i)?.[0];
  const phone = latest.match(/(?:\+?1[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)?.[0];

  if (lower.includes("check in") || lower.includes("checking in")) {
    if (bookingId) {
      const result = await toolFromNameAsync("checkin_guest", { booking_id: bookingId });
      return {
        message: result.message,
        card: result.card,
        toolCalls: ["checkin_guest"],
      };
    }

    if (phone) {
      const lookup = await toolFromNameAsync("lookup_guest", { identifier: phone });
      const reservation = lookup.data as { bookingId?: string } | undefined;
      if (lookup.ok && reservation?.bookingId) {
        const checkin = await toolFromNameAsync("checkin_guest", { booking_id: reservation.bookingId });
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

    const result = await toolFromNameAsync("checkout_guest", { booking_id: bookingId });
    return {
      message: result.message,
      card: result.card,
      toolCalls: ["checkout_guest"],
    };
  }

  return {
    message:
      `I can help you book a room, check in, or check out at ${hotel.hotelName}. What would you like to do today?`,
    toolCalls: [],
  };
}

function extractDateRange(text: string) {
  const match = text.match(/(\d{4}-\d{2}-\d{2}).{0,40}?(\d{4}-\d{2}-\d{2})/);
  if (!match) return undefined;
  return { checkin: match[1], checkout: match[2] };
}

function extractRequestedRoomType(text: string) {
  const lower = text.toLowerCase();
  if (/(family|suite)/.test(lower)) return "suite";
  if (/(executive|king)/.test(lower)) return "king";
  if (/(deluxe|basic|standard|queen|ac)/.test(lower)) return "deluxe";
  return undefined;
}

function extractGuestDetails(text: string) {
  const email = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? "";
  const phone = text.match(/\+?\d[\d\s-]{7,}\d/)?.[0] ?? "";
  const name =
    text.match(/\bfor\s+([^,]+?)(?:,\s*phone|\s+phone|,\s*email|\s+email|$)/i)?.[1]?.trim() ??
    text.match(/\bname\s+(?:is\s+)?([^,]+?)(?:,\s*phone|\s+phone|,\s*email|\s+email|$)/i)?.[1]?.trim() ??
    "";

  return { guestName: name, phone, email };
}

async function deterministicBookingAgent(messages: ClientChatMessage[]): Promise<AgentResult | undefined> {
  const latest = messages[messages.length - 1]?.content ?? "";
  const lower = latest.toLowerCase();
  const transcript = messages.map((message) => message.content).join("\n");
  const dates = extractDateRange(transcript);
  const roomType = extractRequestedRoomType(transcript);

  if (!dates || !roomType) return undefined;

  const hasBookingIntent = /\b(book|booking|reserve|reservation|room|available|availability)\b/.test(lower);
  const hasConfirmation = /\b(yes|confirm|confirmed|book it|reserve it|proceed)\b/.test(lower);

  if (!hasBookingIntent && !hasConfirmation) return undefined;

  const availability = await toolFromNameAsync("check_availability", {
    checkin: dates.checkin,
    checkout: dates.checkout,
    room_type: roomType,
  });

  if (!availability.ok || !hasConfirmation) {
    return {
      message: availability.message,
      card: availability.card,
      toolCalls: ["check_availability"],
    };
  }

  const details = extractGuestDetails(latest);
  if (!details.guestName || (!details.phone && !details.email)) {
    return {
      message: "I can confirm this booking. Please send the guest name and either phone number or email.",
      card: availability.card,
      toolCalls: ["check_availability"],
    };
  }

  const data = availability.data as { room?: { roomId?: string } } | undefined;
  const roomId = data?.room?.roomId;
  if (!roomId) {
    return {
      message: "I found availability, but could not read the room ID. Please try again.",
      card: availability.card,
      toolCalls: ["check_availability"],
    };
  }

  const booking = await toolFromNameAsync("create_booking", {
    guest_name: details.guestName,
    phone: details.phone,
    email: details.email,
    room_id: roomId,
    checkin: dates.checkin,
    checkout: dates.checkout,
    confirmed_by_guest: true,
  });

  return {
    message: booking.message,
    card: booking.card,
    toolCalls: ["check_availability", "create_booking"],
  };
}

function shouldUseDeterministicStayService(messages: ClientChatMessage[]) {
  const latest = messages[messages.length - 1]?.content.toLowerCase() ?? "";
  return (
    lowerIncludesAny(latest, ["check in", "checking in", "check out", "checkout"]) &&
    /\bbkm-\d{4,}\b/i.test(latest)
  );
}

function lowerIncludesAny(value: string, needles: string[]) {
  return needles.some((needle) => value.includes(needle));
}

export async function runBookMeAgent(messages: ClientChatMessage[], hotelSlug?: string): Promise<AgentResult> {
  const hotel = await getHotelConfig(hotelSlug);
  if (shouldUseDeterministicStayService(messages)) {
    const result = await fallbackAgent(messages, hotel);
    await auditBookMeEvent({
      hotelSlug: hotel.slug,
      actorType: "guest",
      eventType: "agent.workflow.completed",
      workflow: "stay_service",
      toolName: result.toolCalls.at(-1) ?? null,
      status: result.card ? "ok" : "blocked",
      message: result.message,
      metadata: {
        toolCalls: result.toolCalls,
        mode: "deterministic",
      },
    });
    return result;
  }

  const deterministic = await deterministicBookingAgent(messages);
  if (deterministic) {
    await auditBookMeEvent({
      hotelSlug: hotel.slug,
      actorType: "guest",
      eventType: "agent.workflow.completed",
      workflow: "booking",
      toolName: deterministic.toolCalls.at(-1) ?? null,
      status: deterministic.card ? "ok" : "blocked",
      message: deterministic.message,
      metadata: {
        toolCalls: deterministic.toolCalls,
        mode: "deterministic",
      },
    });
    return deterministic;
  }

  const provider = getChatProviderConfig();
  if (!provider) {
    return fallbackAgent(messages, hotel);
  }

  const requestMessages: OpenRouterMessage[] = [
    { role: "system", content: systemPrompt(hotel) },
    ...messages.map((message) => ({ role: message.role, content: message.content }) as OpenRouterMessage),
  ];

  let latestCard: SummaryCard | undefined;
  let latestAvailability: AvailabilitySnapshot | undefined;
  const toolCalls: string[] = [];
  let model: string | undefined;

  for (let step = 0; step < 4; step++) {
    let response: Response;
    try {
      response = await fetch(provider.endpoint, {
        method: "POST",
        signal: openRouterTimeoutSignal(),
        headers: provider.headers,
        body: JSON.stringify({
          model: provider.model,
          messages: requestMessages,
          tools,
          tool_choice: "auto",
          temperature: 0.2,
        }),
      });
    } catch {
      return resultFromLatestTool(latestCard, toolCalls, model) ?? fallbackAgent(messages, hotel);
    }

    let data: OpenRouterResponse;
    try {
      data = (await response.json()) as OpenRouterResponse;
    } catch {
      return resultFromLatestTool(latestCard, toolCalls, model) ?? fallbackAgent(messages, hotel);
    }

    if (!response.ok || data.error) {
      return resultFromLatestTool(latestCard, toolCalls, model) ?? fallbackAgent(messages, hotel);
    }

    model = data.model;
    const assistant = data.choices?.[0]?.message;
    if (!assistant) {
      return resultFromLatestTool(latestCard, toolCalls, model) ?? fallbackAgent(messages, hotel);
    }

    const calls = assistant.tool_calls ?? [];
    if (calls.length === 0) {
      const content = assistant.content?.trim();
      return {
        message: content || (await fallbackAgent(messages, hotel)).message,
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
      const args = parseToolArgs(call.function.arguments);
      const result: ToolResult =
        call.function.name === "create_booking" && !bookingMatchesAvailability(args, latestAvailability)
          ? {
              ok: false,
              message:
                "Check availability again and create the booking only for the exact room and dates returned by that check.",
            }
          : await toolFromNameAsync(call.function.name, args);
      toolCalls.push(call.function.name);
      if (call.function.name === "check_availability") {
        latestAvailability = availabilityFromToolResult(result) ?? latestAvailability;
      }
      latestCard = result.card ?? latestCard;

      if (result.ok && result.card && isTerminalWorkflowTool(call.function.name)) {
        await auditBookMeEvent({
          hotelSlug: hotel.slug,
          actorType: "guest",
          eventType: "agent.workflow.completed",
          workflow: call.function.name,
          toolName: call.function.name,
          status: "ok",
          message: result.message,
          metadata: {
            toolCalls,
            mode: "llm_tool_call",
          },
        });
        return {
          message: result.message,
          card: result.card,
          model,
          toolCalls,
        };
      }

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
      : (await fallbackAgent(messages, hotel)).message,
    card: latestCard,
    model,
    toolCalls,
  };
}
