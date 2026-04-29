import { NextResponse } from "next/server";
import { runBookMeAgent } from "@/lib/agent/openrouter";
import { validateClientMessages } from "@/lib/onboarding/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const input = validateClientMessages(body);

    if (!input.ok) {
      return NextResponse.json(
        { message: input.errors[0] ?? "Please send a message to the front desk.", toolCalls: [] },
        { status: 400 },
      );
    }

    const result = await runBookMeAgent(input.value.messages, input.value.hotelSlug);
    return NextResponse.json(result);
  } catch (error) {
    console.warn(error);
    return NextResponse.json(
      {
        message: "The front desk is having trouble right now. Please try again in a moment.",
        toolCalls: [],
      },
      { status: 500 },
    );
  }
}
