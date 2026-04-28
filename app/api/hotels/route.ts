import { NextResponse } from "next/server";
import { listHotelConfigs, saveHotelConfig, type HotelRoomConfig } from "@/lib/hotel/config-store";
import type { OwnerProposal } from "@/lib/onboarding/proposal";

export async function GET() {
  const hotels = await listHotelConfigs();
  return NextResponse.json({ hotels });
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    hotelName?: string;
    city?: string;
    checkinWindow?: string;
    escalationContact?: string;
    gstin?: string;
    sourceSystem?: string;
    roomTypes?: HotelRoomConfig[];
    totalRooms?: number;
    photoName?: string;
    proposal?: OwnerProposal;
  };

  const hotel = await saveHotelConfig({
    hotelName: String(body.hotelName ?? "New Hotel"),
    city: String(body.city ?? ""),
    checkinWindow: String(body.checkinWindow ?? ""),
    escalationContact: String(body.escalationContact ?? ""),
    gstin: String(body.gstin ?? ""),
    sourceSystem: String(body.sourceSystem ?? "Google Sheets or Excel"),
    roomTypes: Array.isArray(body.roomTypes) ? body.roomTypes : [],
    totalRooms: Number(body.totalRooms ?? 0),
    photoName: body.photoName,
    proposal: body.proposal,
  });

  return NextResponse.json({ hotel });
}
