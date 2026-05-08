import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getBookMeAuthMode } from "@/lib/auth/config";
import { requireHotelAdminAccess } from "@/lib/auth/hotel-access";
import { authOptions } from "@/lib/auth/options";
import { auditBookMeEvent } from "@/lib/observability/audit";
import { toolFromNameAsync } from "@/lib/hotel/tools";

type StatusAction = "checkin" | "checkout";

function parseAction(value: unknown): StatusAction | undefined {
  if (value === "checkin" || value === "checkout") return value;
  return undefined;
}

export async function POST(
  request: Request,
  { params }: { params: { slug: string; bookingId: string } },
) {
  const authMode = getBookMeAuthMode();
  const session = authMode === "oauth" ? await getServerSession(authOptions) : null;
  const access = await requireHotelAdminAccess({
    hotelSlug: params.slug,
    userEmail: session?.user?.email,
    authMode,
  });

  if (!access.ok) {
    return NextResponse.json({ error: "hotel access denied", reason: access.reason }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const action = parseAction(body?.action);
  if (!action) {
    return NextResponse.json({ error: "Action must be checkin or checkout." }, { status: 400 });
  }

  const toolName = action === "checkin" ? "checkin_guest" : "checkout_guest";
  const result = await toolFromNameAsync(toolName, { booking_id: params.bookingId });

  await auditBookMeEvent({
    hotelSlug: params.slug,
    actorType: authMode === "oauth" ? "staff" : "system",
    actorId: session?.user?.email ?? "local-demo",
    eventType: "admin.reservation.override",
    workflow: action,
    toolName,
    bookingId: params.bookingId,
    status: result.ok ? "ok" : "blocked",
    message: result.message,
    metadata: {
      action,
      source: "admin_dashboard",
    },
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.message, card: result.card }, { status: 400 });
  }

  const reservation =
    typeof result.data === "object" && result.data !== null
      ? {
          bookingId: "bookingId" in result.data ? result.data.bookingId : params.bookingId,
          status: "status" in result.data ? result.data.status : result.card?.status,
        }
      : { bookingId: params.bookingId, status: result.card?.status };

  return NextResponse.json({
    message: result.message,
    card: result.card,
    reservation,
  });
}

