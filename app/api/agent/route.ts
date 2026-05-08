import { NextResponse } from "next/server";
import { runBookMeAgent } from "@/lib/agent/openrouter";
import { validateClientMessages } from "@/lib/onboarding/validation";
import { auditBookMeEvent } from "@/lib/observability/audit";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => null);
    const input = validateClientMessages(body);

    if (!input.ok) {
      await auditBookMeEvent({
        hotelSlug: typeof body?.hotelSlug === "string" ? body.hotelSlug : null,
        actorType: "guest",
        eventType: "agent.request.invalid",
        status: "blocked",
        message: input.errors[0] ?? "Invalid front desk request.",
        metadata: {
          errors: input.errors,
        },
      });

      return NextResponse.json(
        { message: input.errors[0] ?? "Please send a message to the front desk.", toolCalls: [] },
        { status: 400 },
      );
    }

    const result = await runBookMeAgent(input.value.messages, input.value.hotelSlug);
    return NextResponse.json(result);
  } catch (error) {
    console.warn(error);
    await auditBookMeEvent({
      actorType: "system",
      eventType: "agent.request.failed",
      status: "error",
      message: error instanceof Error ? error.message : "Unknown agent request failure.",
    });

    return NextResponse.json(
      {
        message: "The front desk is having trouble right now. Please try again in a moment.",
        toolCalls: [],
      },
      { status: 500 },
    );
  }
}
