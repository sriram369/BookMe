import { NextResponse } from "next/server";
import { solutionDashboard, updateSolutionCheckInStatus } from "@/lib/solution/store";
import type { SolutionReservationStatus } from "@/lib/solution/types";

const checkInStatuses: SolutionReservationStatus[] = ["Confirmed", "ID Pending", "Checked In", "Manual Review", "Checked Out"];

const isCheckInStatus = (status: unknown): status is SolutionReservationStatus =>
  checkInStatuses.includes(status as SolutionReservationStatus);

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reservationId = url.searchParams.get("reservationId") ?? "";

  if (!reservationId) {
    return NextResponse.json({ error: "reservationId is required" }, { status: 400 });
  }

  const guest = solutionDashboard().reservations.find((reservation) => reservation.bookingId === reservationId);
  if (!guest) {
    return NextResponse.json({ error: "reservation not found" }, { status: 404 });
  }

  return NextResponse.json({ guest });
}

export async function PATCH(request: Request) {
  const body = (await request.json()) as { reservationId?: string; status?: SolutionReservationStatus };
  const reservationId = String(body.reservationId ?? "");
  const status = body.status;

  if (!reservationId || !isCheckInStatus(status)) {
    return NextResponse.json(
      { error: "reservationId and a valid status are required" },
      { status: 400 },
    );
  }

  const guest = updateSolutionCheckInStatus(reservationId, status);
  if (!guest) {
    return NextResponse.json({ error: "reservation not found" }, { status: 404 });
  }

  return NextResponse.json({ guest });
}
