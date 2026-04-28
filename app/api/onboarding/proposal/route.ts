import { NextResponse } from "next/server";
import { generateOwnerProposal, type OwnerProposalInput } from "@/lib/onboarding/proposal";

export async function POST(request: Request) {
  const input = (await request.json()) as Partial<OwnerProposalInput>;

  const proposal = await generateOwnerProposal({
    hotelName: String(input.hotelName ?? ""),
    city: String(input.city ?? ""),
    sourceSystem: String(input.sourceSystem ?? "Google Sheets or Excel"),
    totalRooms: Number(input.totalRooms ?? 0),
    roomTypes: Array.isArray(input.roomTypes) ? input.roomTypes : [],
  });

  return NextResponse.json({ proposal });
}
