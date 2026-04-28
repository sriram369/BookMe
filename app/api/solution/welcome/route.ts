import { NextResponse } from "next/server";
import { captureGuestId, lookupWelcomeGuest } from "@/lib/solution/store";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    action?: "lookup" | "capture_id";
    identifier?: string;
    bookingId?: string;
    fileName?: string;
    consent?: boolean;
  };

  if (body.action === "capture_id") {
    return NextResponse.json(
      captureGuestId({
        bookingId: body.bookingId ?? "",
        fileName: body.fileName ?? "",
        consent: Boolean(body.consent),
      }),
    );
  }

  return NextResponse.json(lookupWelcomeGuest(body.identifier ?? ""));
}
