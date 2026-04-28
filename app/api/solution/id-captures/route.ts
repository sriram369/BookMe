import { NextResponse } from "next/server";
import { captureGuestId, listSolutionIdCaptures } from "@/lib/solution/store";

const sources = ["sms_link", "email_link", "front_desk"];
const documentTypes = ["drivers_license", "passport", "state_id", "aadhaar", "pan"];

export async function GET() {
  return NextResponse.json({ idCaptures: listSolutionIdCaptures() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    reservationId?: string;
    source?: string;
    documentType?: string;
    fileName?: string;
    mimeType?: string;
    sizeBytes?: number;
    notes?: string;
  };
  const reservationId = String(body.reservationId ?? "");

  if (!reservationId) {
    return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
  }

  if (body.source && !sources.includes(body.source)) {
    return NextResponse.json({ error: "source is invalid" }, { status: 400 });
  }

  if (body.documentType && !documentTypes.includes(body.documentType)) {
    return NextResponse.json({ error: "documentType is invalid" }, { status: 400 });
  }

  const result = captureGuestId({
    bookingId: reservationId,
    fileName: body.fileName ?? body.documentType ?? "physical-id-photo",
    consent: true,
  });

  if (!result.ok || !result.reservation) {
    return NextResponse.json({ error: "reservation not found" }, { status: 404 });
  }

  return NextResponse.json({ idCapture: result.reservation }, { status: 201 });
}
