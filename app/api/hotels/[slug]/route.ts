import { NextResponse } from "next/server";
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

  return NextResponse.json({
    hotel,
    dashboard: await adminDashboardDataAsync(hotel),
  });
}
