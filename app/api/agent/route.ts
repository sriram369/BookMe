import { NextResponse } from "next/server";
import { runBookMeAgent, type ClientChatMessage } from "@/lib/agent/openrouter";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { messages?: ClientChatMessage[]; hotelSlug?: string };
    const messages = (body.messages ?? []).filter(
      (message) =>
        (message.role === "user" || message.role === "assistant") &&
        typeof message.content === "string" &&
        message.content.trim().length > 0,
    );

    if (messages.length === 0) {
      return NextResponse.json(
        { message: "Please send a message to the front desk.", toolCalls: [] },
        { status: 400 },
      );
    }

    const result = await runBookMeAgent(messages.slice(-12), body.hotelSlug);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        message: "The front desk is having trouble right now. Please try again in a moment.",
        toolCalls: [],
      },
      { status: 500 },
    );
  }
}
