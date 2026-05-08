import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getBookMeAuthMode } from "@/lib/auth/config";
import { requireHotelAdminAccess } from "@/lib/auth/hotel-access";
import { authOptions } from "@/lib/auth/options";
import { findHotelConfig } from "@/lib/hotel/config-store";
import { adminDashboardDataAsync } from "@/lib/hotel/tools";

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } },
) {
  const hotel = await findHotelConfig(params.slug);
  if (!hotel) {
    return NextResponse.json({ error: "hotel not found" }, { status: 404 });
  }

  const authMode = getBookMeAuthMode();
  const session = authMode === "oauth" ? await getServerSession(authOptions) : null;
  const access = await requireHotelAdminAccess({
    hotelSlug: hotel.slug,
    userEmail: session?.user?.email,
    authMode,
  });

  if (!access.ok) {
    return NextResponse.json({ error: "hotel access denied", reason: access.reason }, { status: 403 });
  }

  return NextResponse.json({
    hotel,
    dashboard: await adminDashboardDataAsync(hotel),
  });
}
