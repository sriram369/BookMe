import "server-only";

export type PaymentProviderStatus = {
  provider: "razorpay";
  configured: boolean;
  missing: string[];
};

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function missingEnv(names: string[]) {
  return names.filter((name) => !hasEnv(name));
}

export function getRazorpayConfig() {
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET?.trim();

  if (!keyId || !keySecret) {
    return null;
  }

  return {
    keyId,
    keySecret,
    webhookSecret,
  };
}

export function getRazorpayWebhookSecret() {
  return process.env.RAZORPAY_WEBHOOK_SECRET?.trim() || null;
}

export function getPaymentStatus(): PaymentProviderStatus {
  const missing = missingEnv(["RAZORPAY_KEY_ID", "RAZORPAY_KEY_SECRET"]);

  return {
    provider: "razorpay",
    configured: missing.length === 0,
    missing,
  };
}
