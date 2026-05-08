import "server-only";

import { recordBookMeAuditEvent, type BookMeAuditEventInput } from "@/lib/db/bookme";

const SENSITIVE_KEY_PATTERN = /(authorization|cookie|token|secret|key|password|private|credential)/i;
const globalForAuditWarnings = globalThis as typeof globalThis & {
  __bookmeAuditWarningShown?: boolean;
};

function sanitizeMetadata(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sanitizeMetadata);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, nestedValue]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[redacted]" : sanitizeMetadata(nestedValue),
      ]),
    );
  }

  return value;
}

export async function auditBookMeEvent(input: BookMeAuditEventInput) {
  try {
    await recordBookMeAuditEvent({
      ...input,
      metadata: sanitizeMetadata(input.metadata ?? {}) as Record<string, unknown>,
    });
  } catch (error) {
    if (!globalForAuditWarnings.__bookmeAuditWarningShown) {
      globalForAuditWarnings.__bookmeAuditWarningShown = true;
      console.warn("BookMe audit events are not being recorded. Check Supabase configuration.");
    }
  }
}
