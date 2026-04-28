import { NextResponse } from "next/server";
import { listHotelConfigs, saveHotelConfig } from "@/lib/hotel/config-store";
import { validateHotelConfigInput } from "@/lib/onboarding/validation";

export async function GET() {
  const hotels = await listHotelConfigs();
  return NextResponse.json({ hotels });
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = validateHotelConfigInput(body);

  if (!input.ok) {
    return NextResponse.json({ error: "Invalid hotel setup", errors: input.errors }, { status: 400 });
  }

  const hotel = await saveHotelConfig(input.value);

  return NextResponse.json({ hotel });
}
