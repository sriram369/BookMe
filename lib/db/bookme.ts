import type { OwnerProposal } from "@/lib/onboarding/proposal";
import { supabaseRest } from "./supabase";

export type BookMeDbUser = {
  email: string;
  name?: string | null;
  image?: string | null;
  provider?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type BookMeDbRoomType = {
  type: string;
  count: string;
  rate: string;
};

export type BookMeDbHotel = {
  slug: string;
  hotelName: string;
  city: string;
  checkinWindow: string;
  escalationContact: string;
  gstin: string;
  sourceSystem: string;
  roomTypes: BookMeDbRoomType[];
  totalRooms: number;
  photoName?: string | null;
  proposal?: OwnerProposal | null;
  createdAt: string;
  updatedAt: string;
};

export type BookMeAuditEventInput = {
  hotelSlug?: string | null;
  actorType?: "guest" | "staff" | "system" | "agent";
  actorId?: string | null;
  eventType: string;
  workflow?: string | null;
  toolName?: string | null;
  bookingId?: string | null;
  status?: "ok" | "error" | "blocked";
  message?: string | null;
  metadata?: Record<string, unknown>;
};

export type BookMeAuditEvent = {
  id: string;
  hotelSlug?: string | null;
  actorType: string;
  actorId?: string | null;
  eventType: string;
  workflow?: string | null;
  toolName?: string | null;
  bookingId?: string | null;
  status: string;
  message?: string | null;
  metadata: Record<string, unknown>;
  createdAt: string;
};

type BookMeUserRow = {
  email: string;
  name: string | null;
  image: string | null;
  provider: string | null;
  created_at: string;
  updated_at: string;
};

type BookMeAuditEventRow = {
  id: string;
  hotel_slug: string | null;
  actor_type: string;
  actor_id: string | null;
  event_type: string;
  workflow: string | null;
  tool_name: string | null;
  booking_id: string | null;
  status: string;
  message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

type BookMeHotelRow = {
  slug: string;
  hotel_name: string;
  city: string;
  checkin_window: string;
  escalation_contact: string;
  gstin: string;
  source_system: string;
  room_types: BookMeDbRoomType[];
  total_rooms: number;
  photo_name: string | null;
  proposal: OwnerProposal | null;
  created_at: string;
  updated_at: string;
};

function encodeFilterValue(value: string) {
  return encodeURIComponent(value.replace(/"/g, '\\"'));
}

function userFromRow(row: BookMeUserRow): BookMeDbUser {
  return {
    email: row.email,
    name: row.name,
    image: row.image,
    provider: row.provider,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function hotelFromRow(row: BookMeHotelRow): BookMeDbHotel {
  return {
    slug: row.slug,
    hotelName: row.hotel_name,
    city: row.city,
    checkinWindow: row.checkin_window,
    escalationContact: row.escalation_contact,
    gstin: row.gstin,
    sourceSystem: row.source_system,
    roomTypes: row.room_types,
    totalRooms: row.total_rooms,
    photoName: row.photo_name,
    proposal: row.proposal,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function auditEventFromRow(row: BookMeAuditEventRow): BookMeAuditEvent {
  return {
    id: row.id,
    hotelSlug: row.hotel_slug,
    actorType: row.actor_type,
    actorId: row.actor_id,
    eventType: row.event_type,
    workflow: row.workflow,
    toolName: row.tool_name,
    bookingId: row.booking_id,
    status: row.status,
    message: row.message,
    metadata: row.metadata,
    createdAt: row.created_at,
  };
}

export async function listBookMeUsersFromSupabase() {
  const rows = await supabaseRest<BookMeUserRow[]>("bookme_users", {
    query: "select=*&order=created_at.desc",
  });

  return rows?.map(userFromRow) ?? null;
}

export async function upsertBookMeUserToSupabase(input: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  provider?: string | null;
}) {
  if (!input.email) {
    return null;
  }

  const rows = await supabaseRest<BookMeUserRow[]>("bookme_users", {
    method: "POST",
    query: "on_conflict=email",
    prefer: "resolution=merge-duplicates,return=representation",
    body: {
      email: input.email,
      name: input.name ?? null,
      image: input.image ?? null,
      provider: input.provider ?? null,
    },
  });

  return rows?.[0] ? userFromRow(rows[0]) : null;
}

export async function listBookMeHotelsFromSupabase() {
  const rows = await supabaseRest<BookMeHotelRow[]>("bookme_hotels", {
    query: "select=*&order=created_at.desc",
  });

  return rows?.map(hotelFromRow) ?? null;
}

export async function getBookMeHotelFromSupabase(slug: string) {
  const rows = await supabaseRest<BookMeHotelRow[]>("bookme_hotels", {
    query: `select=*&slug=eq.${encodeFilterValue(slug)}&limit=1`,
  });

  return rows?.[0] ? hotelFromRow(rows[0]) : null;
}

export async function upsertBookMeHotelToSupabase(
  input: Omit<BookMeDbHotel, "createdAt" | "updatedAt"> & {
    createdAt?: string;
    updatedAt?: string;
  },
) {
  const rows = await supabaseRest<BookMeHotelRow[]>("bookme_hotels", {
    method: "POST",
    query: "on_conflict=slug",
    prefer: "resolution=merge-duplicates,return=representation",
    body: {
      slug: input.slug,
      hotel_name: input.hotelName,
      city: input.city,
      checkin_window: input.checkinWindow,
      escalation_contact: input.escalationContact,
      gstin: input.gstin,
      source_system: input.sourceSystem,
      room_types: input.roomTypes,
      total_rooms: input.totalRooms,
      photo_name: input.photoName ?? null,
      proposal: input.proposal ?? null,
    },
  });

  return rows?.[0] ? hotelFromRow(rows[0]) : null;
}

export async function recordBookMeAuditEvent(input: BookMeAuditEventInput) {
  const eventType = input.eventType.trim();
  if (!eventType) return null;

  const rows = await supabaseRest<BookMeAuditEventRow[]>("bookme_audit_events", {
    method: "POST",
    prefer: "return=representation",
    body: {
      hotel_slug: input.hotelSlug ?? null,
      actor_type: input.actorType ?? "system",
      actor_id: input.actorId ?? null,
      event_type: eventType,
      workflow: input.workflow ?? null,
      tool_name: input.toolName ?? null,
      booking_id: input.bookingId ?? null,
      status: input.status ?? "ok",
      message: input.message ?? null,
      metadata: input.metadata ?? {},
    },
  });

  return rows?.[0] ?? null;
}

export async function listBookMeAuditEventsFromSupabase(options: { hotelSlug?: string; limit?: number } = {}) {
  const limit = Math.min(Math.max(options.limit ?? 12, 1), 50);
  const hotelFilter = options.hotelSlug ? `&hotel_slug=eq.${encodeFilterValue(options.hotelSlug)}` : "";
  const rows = await supabaseRest<BookMeAuditEventRow[]>("bookme_audit_events", {
    query: `select=*&order=created_at.desc&limit=${limit}${hotelFilter}`,
  });

  return rows?.map(auditEventFromRow) ?? [];
}
