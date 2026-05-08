import "server-only";

import { getRazorpayConfig } from "./config";

export type RazorpayPaymentLinkInput = {
  bookingId: string;
  amountInPaise: number;
  description: string;
  customer?: {
    name?: string;
    email?: string;
    phone?: string;
  };
};

export type RazorpayPaymentLinkResult = {
  id: string;
  shortUrl: string;
  status: string;
};

type RazorpayPaymentLinkResponse = {
  id?: string;
  short_url?: string;
  status?: string;
  error?: {
    description?: string;
  };
};

export async function createRazorpayPaymentLink(
  input: RazorpayPaymentLinkInput,
): Promise<RazorpayPaymentLinkResult> {
  const config = getRazorpayConfig();
  if (!config) {
    throw new Error("Razorpay is not configured.");
  }

  const auth = Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/payment_links", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: input.amountInPaise,
      currency: "INR",
      accept_partial: false,
      description: input.description,
      reference_id: input.bookingId,
      customer: {
        name: input.customer?.name,
        email: input.customer?.email,
        contact: input.customer?.phone,
      },
      notify: {
        sms: Boolean(input.customer?.phone),
        email: Boolean(input.customer?.email),
      },
      reminder_enable: true,
      notes: {
        booking_id: input.bookingId,
        product: "BookMe",
      },
    }),
    cache: "no-store",
  });

  const data = (await response.json().catch(() => ({}))) as RazorpayPaymentLinkResponse;
  if (!response.ok) {
    throw new Error(data.error?.description ?? `Razorpay payment link failed: ${response.status}`);
  }

  if (!data.id || !data.short_url) {
    throw new Error("Razorpay did not return a payment link.");
  }

  return {
    id: data.id,
    shortUrl: data.short_url,
    status: data.status ?? "created",
  };
}

