import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getBookMeAuthMode } from "@/lib/auth/config";
import { authOptions } from "@/lib/auth/options";
import {
  listBookMeHotelMembershipsFromSupabase,
  upsertBookMeHotelMembershipToSupabase,
} from "@/lib/db/bookme";
import { listHotelConfigs, saveHotelConfig } from "@/lib/hotel/config-store";
import { validateHotelConfigInput } from "@/lib/onboarding/validation";

export async function GET() {
  const hotels = await listHotelConfigs();

  if (getBookMeAuthMode() === "oauth") {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const memberships = await listBookMeHotelMembershipsFromSupabase({ userEmail: session.user.email });
    const allowedSlugs = new Set(memberships.map((membership) => membership.hotelSlug));
    return NextResponse.json({ hotels: hotels.filter((hotel) => allowedSlugs.has(hotel.slug)) });
  }

  return NextResponse.json({ hotels });
}

export async function POST(request: Request) {
  const authMode = getBookMeAuthMode();
  const session = authMode === "oauth" ? await getServerSession(authOptions) : null;
  if (authMode === "oauth" && !session?.user?.email) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const input = validateHotelConfigInput(body);

  if (!input.ok) {
    return NextResponse.json({ error: "Invalid hotel setup", errors: input.errors }, { status: 400 });
  }

  const hotel = await saveHotelConfig(input.value);
  if (authMode === "oauth" && session?.user?.email) {
    await upsertBookMeHotelMembershipToSupabase({
      hotelSlug: hotel.slug,
      userEmail: session.user.email,
      role: "owner",
    });
  }

  return NextResponse.json({ hotel });
}
