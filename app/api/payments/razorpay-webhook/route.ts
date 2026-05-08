import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { listConnectorBackends, type ConnectorBackend } from "@/lib/connectors";
import type { PaymentStatus } from "@/lib/hotel/types";
import { auditBookMeEvent } from "@/lib/observability/audit";
import { getRazorpayWebhookSecret } from "@/lib/payments/config";

type RazorpayWebhookBody = {
  event?: string;
  payload?: {
    payment_link?: {
      entity?: {
        id?: string;
        reference_id?: string;
        status?: string;
        notes?: Record<string, unknown>;
      };
    };
    payment?: {
      entity?: {
        id?: string;
        status?: string;
        notes?: Record<string, unknown>;
      };
    };
  };
};

type PaymentUpdate = {
  bookingId: string;
  paymentStatus: PaymentStatus;
  paymentReference?: string;
};

function verifyRazorpaySignature(rawBody: string, signature: string, secret: string) {
  const expected = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  const expectedBuffer = Buffer.from(expected, "hex");
  const signatureBuffer = Buffer.from(signature, "hex");

  return expectedBuffer.length === signatureBuffer.length && crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
}

function noteString(notes: Record<string, unknown> | undefined, key: string) {
  const value = notes?.[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function resolvePaymentUpdate(body: RazorpayWebhookBody): PaymentUpdate | undefined {
  const event = body.event ?? "";
  const paymentLink = body.payload?.payment_link?.entity;
  const payment = body.payload?.payment?.entity;
  const bookingId =
    paymentLink?.reference_id?.trim() ||
    noteString(paymentLink?.notes, "booking_id") ||
    noteString(payment?.notes, "booking_id");

  if (!bookingId) return undefined;

  const paymentReference = payment?.id || paymentLink?.id;
  const paymentLinkStatus = paymentLink?.status ?? "";
  const paymentStatus = payment?.status ?? "";

  if (event === "payment_link.paid" || paymentLinkStatus === "paid" || paymentStatus === "captured") {
    return { bookingId, paymentStatus: "paid", paymentReference };
  }

  if (
    event === "payment.failed" ||
    event === "payment_link.cancelled" ||
    event === "payment_link.expired" ||
    paymentStatus === "failed" ||
    paymentLinkStatus === "cancelled" ||
    paymentLinkStatus === "expired"
  ) {
    return { bookingId, paymentStatus: "failed", paymentReference };
  }

  return undefined;
}

async function activeReservationConnector(): Promise<ConnectorBackend | undefined> {
  for (const connector of listConnectorBackends()) {
    if (!connector.reservations) continue;
    const health = await connector.health();
    if (health.status === "ok") return connector;
  }

  return undefined;
}

export async function POST(request: Request) {
  const secret = getRazorpayWebhookSecret();
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature")?.trim();

  if (!secret) {
    await auditBookMeEvent({
      actorType: "system",
      eventType: "payment.webhook.not_configured",
      status: "blocked",
      message: "Razorpay webhook secret is not configured.",
    });
    return NextResponse.json({ error: "Razorpay webhook is not configured." }, { status: 501 });
  }

  if (!signature || !verifyRazorpaySignature(rawBody, signature, secret)) {
    await auditBookMeEvent({
      actorType: "system",
      eventType: "payment.webhook.invalid_signature",
      status: "blocked",
      message: "Rejected Razorpay webhook with invalid signature.",
    });
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  let body: RazorpayWebhookBody;
  try {
    body = JSON.parse(rawBody || "{}") as RazorpayWebhookBody;
  } catch {
    await auditBookMeEvent({
      actorType: "system",
      eventType: "payment.webhook.invalid_json",
      status: "blocked",
      message: "Rejected Razorpay webhook with invalid JSON after signature verification.",
    });
    return NextResponse.json({ error: "Invalid webhook JSON." }, { status: 400 });
  }

  const update = resolvePaymentUpdate(body);

  if (!update) {
    await auditBookMeEvent({
      actorType: "system",
      eventType: "payment.webhook.ignored",
      status: "ok",
      message: "Verified Razorpay webhook did not map to a payment state change.",
      metadata: {
        provider: "razorpay",
        event: body.event,
      },
    });
    return NextResponse.json({ ok: true, ignored: true }, { status: 202 });
  }

  const connector = await activeReservationConnector();
  if (!connector?.reservations) {
    await auditBookMeEvent({
      actorType: "system",
      eventType: "payment.webhook.storage_unavailable",
      bookingId: update.bookingId,
      status: "error",
      message: "No configured reservation connector could accept the verified payment update.",
      metadata: {
        provider: "razorpay",
        event: body.event,
      },
    });
    return NextResponse.json({ error: "Reservation storage is unavailable." }, { status: 503 });
  }

  try {
    const reservation = await connector.reservations.updateReservationPayment(update.bookingId, {
      paymentStatus: update.paymentStatus,
      paymentMode: "payment_link",
      paymentProvider: "razorpay",
      paymentReference: update.paymentReference,
      payAtProperty: update.paymentStatus === "paid" ? false : undefined,
    });

    await auditBookMeEvent({
      actorType: "system",
      eventType: "payment.webhook.applied",
      bookingId: update.bookingId,
      status: "ok",
      message: `Razorpay webhook marked booking ${update.bookingId} as ${update.paymentStatus}.`,
      metadata: {
        provider: "razorpay",
        event: body.event,
        connectorId: connector.id,
        paymentReference: update.paymentReference,
      },
    });

    return NextResponse.json({
      ok: true,
      provider: "razorpay",
      bookingId: update.bookingId,
      paymentStatus: update.paymentStatus,
      reservation,
    });
  } catch (error) {
    await auditBookMeEvent({
      actorType: "system",
      eventType: "payment.webhook.failed",
      bookingId: update.bookingId,
      status: "error",
      message: error instanceof Error ? error.message : "Razorpay webhook payment update failed.",
      metadata: {
        provider: "razorpay",
        event: body.event,
      },
    });
    return NextResponse.json({ error: "Payment update failed." }, { status: 502 });
  }
}
