import type { ClientChatMessage } from "@/lib/agent/openrouter";
import type { HotelRoomConfig } from "@/lib/hotel/config-store";
import type { OwnerProposal, OwnerProposalInput } from "@/lib/onboarding/proposal";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; errors: string[] };

type HotelConfigInput = {
  hotelName: string;
  city: string;
  checkinWindow: string;
  escalationContact: string;
  gstin: string;
  sourceSystem: string;
  roomTypes: HotelRoomConfig[];
  totalRooms: number;
  photoName?: string;
  proposal?: OwnerProposal;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown, fallback = "") {
  return typeof value === "string" ? value.trim() : fallback;
}

function cleanOptionalString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned || undefined;
}

function cleanNonNegativeInt(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.floor(parsed);
}

function validateRoomTypes(value: unknown) {
  if (!Array.isArray(value)) {
    return { rooms: [] as HotelRoomConfig[], errors: ["Add at least one room type."] };
  }

  const errors: string[] = [];
  const rooms = value
    .map((room, index) => {
      if (!isRecord(room)) {
        errors.push(`Room ${index + 1} is invalid.`);
        return null;
      }

      const type = cleanString(room.type);
      const count = cleanString(room.count);
      const rate = cleanString(room.rate);

      if (!type) errors.push(`Room ${index + 1} needs a type.`);
      if (!Number.isFinite(Number(count)) || Number(count) <= 0) errors.push(`Room ${index + 1} needs a positive count.`);
      if (!Number.isFinite(Number(rate)) || Number(rate) < 0) errors.push(`Room ${index + 1} needs a valid base rate.`);

      return { type, count, rate };
    })
    .filter((room): room is HotelRoomConfig => Boolean(room?.type));

  if (rooms.length === 0) errors.push("Add at least one valid room type.");
  return { rooms: rooms.slice(0, 25), errors };
}

function validateProposal(value: unknown): OwnerProposal | undefined {
  if (!isRecord(value)) return undefined;
  const recommendedPlan = cleanString(value.recommendedPlan);
  if (recommendedPlan !== "Pilot" && recommendedPlan !== "Growth" && recommendedPlan !== "Managed") return undefined;

  return {
    recommendedPlan,
    monthlyPrice: cleanString(value.monthlyPrice, "Custom"),
    setupFee: cleanString(value.setupFee, "Custom"),
    summary: cleanString(value.summary),
    rollout: Array.isArray(value.rollout) ? value.rollout.map((item) => cleanString(item)).filter(Boolean).slice(0, 6) : [],
    risks: Array.isArray(value.risks) ? value.risks.map((item) => cleanString(item)).filter(Boolean).slice(0, 6) : [],
  };
}

export function validateOwnerProposalInput(body: unknown): ValidationResult<OwnerProposalInput> {
  const input = isRecord(body) ? body : {};
  const { rooms, errors } = validateRoomTypes(input.roomTypes);
  const hotelName = cleanString(input.hotelName);
  const city = cleanString(input.city);
  const sourceSystem = cleanString(input.sourceSystem, "Google Sheets or Excel");
  const totalRooms = cleanNonNegativeInt(input.totalRooms || rooms.reduce((sum, room) => sum + Number(room.count || 0), 0));

  if (!hotelName) errors.push("Hotel name is required.");
  if (!city) errors.push("City or locality is required.");
  if (!sourceSystem) errors.push("Reservation source is required.");
  if (totalRooms <= 0) errors.push("Total rooms must be greater than zero.");

  if (errors.length) return { ok: false, errors };

  return {
    ok: true,
    value: {
      hotelName,
      city,
      sourceSystem,
      totalRooms,
      roomTypes: rooms,
    },
  };
}

export function validateHotelConfigInput(body: unknown): ValidationResult<HotelConfigInput> {
  const proposalInput = validateOwnerProposalInput(body);
  const input = isRecord(body) ? body : {};
  const errors = proposalInput.ok ? [] : [...proposalInput.errors];

  const checkinWindow = cleanString(input.checkinWindow);
  const escalationContact = cleanString(input.escalationContact);

  if (!checkinWindow) errors.push("Check-in window is required.");
  if (!escalationContact) errors.push("Escalation contact is required.");

  if (errors.length || !proposalInput.ok) return { ok: false, errors };

  return {
    ok: true,
    value: {
      ...proposalInput.value,
      checkinWindow,
      escalationContact,
      gstin: cleanString(input.gstin, "Optional for pilot"),
      photoName: cleanOptionalString(input.photoName),
      proposal: validateProposal(input.proposal),
    },
  };
}

export function validateClientMessages(body: unknown): ValidationResult<{ messages: ClientChatMessage[]; hotelSlug?: string }> {
  const input = isRecord(body) ? body : {};
  const messages = Array.isArray(input.messages)
    ? input.messages
        .filter(isRecord)
        .map((message) => ({
          role: message.role,
          content: cleanString(message.content),
        }))
        .filter((message): message is ClientChatMessage =>
          (message.role === "user" || message.role === "assistant") && message.content.length > 0,
        )
        .slice(-12)
    : [];

  if (messages.length === 0) {
    return { ok: false, errors: ["Please send a message to the front desk."] };
  }

  const hotelSlug = cleanOptionalString(input.hotelSlug);
  return { ok: true, value: { messages, hotelSlug } };
}
