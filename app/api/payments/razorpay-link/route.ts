import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getBookMeAuthMode } from "@/lib/auth/config";
import { requireHotelAdminAccess } from "@/lib/auth/hotel-access";
import { authOptions } from "@/lib/auth/options";
import { getRazorpayConfig } from "@/lib/payments/config";
import { createRazorpayPaymentLink } from "@/lib/payments/razorpay";
import { auditBookMeEvent } from "@/lib/observability/audit";

type PaymentLinkRequest = {
  hotelSlug?: unknown;
  bookingId?: unknown;
  amountInPaise?: unknown;
  description?: unknown;
  customer?: {
    name?: unknown;
    email?: unknown;
    phone?: unknown;
  };
};

function validatePaymentLinkRequest(body: PaymentLinkRequest) {
  const errors: string[] = [];
  const hotelSlug = typeof body.hotelSlug === "string" ? body.hotelSlug.trim() : "";
  const bookingId = typeof body.bookingId === "string" ? body.bookingId.trim() : "";
  const amountInPaise = typeof body.amountInPaise === "number" ? body.amountInPaise : Number(body.amountInPaise);
  const description =
    typeof body.description === "string" && body.description.trim()
      ? body.description.trim()
      : `Room payment for ${bookingId}`;

  if (!hotelSlug) errors.push("hotelSlug is required.");
  if (!bookingId) errors.push("bookingId is required.");
  if (!Number.isInteger(amountInPaise) || amountInPaise <= 0) {
    errors.push("amountInPaise must be a positive integer.");
  }

  const customer = body.customer ?? {};
  return {
    ok: errors.length === 0,
    errors,
    value: {
      hotelSlug,
      bookingId,
      amountInPaise,
      description,
      customer: {
        name: typeof customer.name === "string" ? customer.name.trim() : undefined,
        email: typeof customer.email === "string" ? customer.email.trim() : undefined,
        phone: typeof customer.phone === "string" ? customer.phone.trim() : undefined,
      },
    },
  };
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as PaymentLinkRequest;
  const input = validatePaymentLinkRequest(body);

  if (!input.ok) {
    await auditBookMeEvent({
      hotelSlug: typeof body.hotelSlug === "string" ? body.hotelSlug : null,
      actorType: "staff",
      eventType: "payment.link.invalid",
      bookingId: typeof body.bookingId === "string" ? body.bookingId : null,
      status: "blocked",
      message: input.errors.join(" "),
    });
    return NextResponse.json({ error: "Invalid payment link request", errors: input.errors }, { status: 400 });
  }

  const authMode = getBookMeAuthMode();
  const session = authMode === "oauth" ? await getServerSession(authOptions) : null;
  const access = await requireHotelAdminAccess({
    hotelSlug: input.value.hotelSlug,
    userEmail: session?.user?.email,
    authMode,
  });

  if (!access.ok) {
    await auditBookMeEvent({
      hotelSlug: input.value.hotelSlug,
      actorType: "staff",
      actorId: session?.user?.email ?? "unknown",
      eventType: "payment.link.denied",
      bookingId: input.value.bookingId,
      status: "blocked",
      message: access.reason,
    });
    return NextResponse.json({ error: "hotel access denied", reason: access.reason }, { status: 403 });
  }

  if (!getRazorpayConfig()) {
    await auditBookMeEvent({
      hotelSlug: input.value.hotelSlug,
      actorType: authMode === "oauth" ? "staff" : "system",
      actorId: session?.user?.email ?? "local-demo",
      eventType: "payment.link.not_configured",
      bookingId: input.value.bookingId,
      status: "blocked",
      message: "Razorpay credentials are not configured.",
    });
    return NextResponse.json(
      {
        error: "Razorpay is not configured.",
        missing: ["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"],
      },
      { status: 501 },
    );
  }

  try {
    const paymentLink = await createRazorpayPaymentLink({
      bookingId: input.value.bookingId,
      amountInPaise: input.value.amountInPaise,
      description: input.value.description,
      customer: input.value.customer,
    });

    await auditBookMeEvent({
      hotelSlug: input.value.hotelSlug,
      actorType: authMode === "oauth" ? "staff" : "system",
      actorId: session?.user?.email ?? "local-demo",
      eventType: "payment.link.created",
      bookingId: input.value.bookingId,
      status: "ok",
      message: "Razorpay payment link created.",
      metadata: {
        provider: "razorpay",
        paymentLinkId: paymentLink.id,
        amountInPaise: input.value.amountInPaise,
      },
    });

    return NextResponse.json({
      provider: "razorpay",
      bookingId: input.value.bookingId,
      paymentLink,
    });
  } catch (error) {
    await auditBookMeEvent({
      hotelSlug: input.value.hotelSlug,
      actorType: authMode === "oauth" ? "staff" : "system",
      actorId: session?.user?.email ?? "local-demo",
      eventType: "payment.link.failed",
      bookingId: input.value.bookingId,
      status: "error",
      message: error instanceof Error ? error.message : "Payment link creation failed.",
    });

    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Payment link creation failed." },
      { status: 502 },
    );
  }
}

