import type {
  PaymentMode,
  PaymentProvider,
  PaymentStatus,
  Reservation,
  ReservationStatus,
  Room,
  RoomType,
} from "@/lib/hotel/types";
import { getSupabaseServerConfig, supabaseRest } from "@/lib/db/supabase";
import type {
  ConnectorBackend,
  ConnectorHealth,
  ConnectorInitResult,
  ConnectorSeedData,
  ReservationCreateInput,
} from "./types";

const connectorId = "supabase";
const connectorName = "Supabase";
const defaultHotelSlug = process.env.BOOKME_DEFAULT_HOTEL_SLUG?.trim() || "sriram-hotel";

type ReservationRow = {
  hotel_slug: string;
  booking_id: string;
  idempotency_key: string | null;
  guest_name: string;
  phone: string;
  email: string;
  room_id: string;
  checkin: string;
  checkout: string;
  status: ReservationStatus;
  created_at: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  payment_status: PaymentStatus;
  payment_mode: PaymentMode;
  payment_provider: PaymentProvider;
  payment_reference: string | null;
  pay_at_property: boolean;
};

type RoomRow = {
  hotel_slug: string;
  room_id: string;
  room_type: RoomType;
  label: string;
  price_per_night: number;
  floor: number;
  view: string;
  max_guests: number;
  is_active: boolean;
};

function now() {
  return new Date().toISOString();
}

function health(
  status: ConnectorHealth["status"],
  message: string,
  details?: Record<string, unknown>,
): ConnectorHealth {
  return {
    id: connectorId,
    name: connectorName,
    status,
    message,
    checkedAt: now(),
    capabilities: {
      reservationsRead: status === "ok",
      reservationsWrite: status === "ok",
      inventoryRead: status === "ok",
      inventoryWrite: status === "ok",
      initialize: status === "ok",
    },
    details,
  };
}

function reservationFromRow(row: ReservationRow): Reservation {
  return {
    bookingId: row.booking_id,
    idempotencyKey: row.idempotency_key ?? undefined,
    guestName: row.guest_name,
    phone: row.phone,
    email: row.email,
    roomId: row.room_id,
    checkin: row.checkin,
    checkout: row.checkout,
    status: row.status,
    createdAt: row.created_at,
    checkedInAt: row.checked_in_at ?? undefined,
    checkedOutAt: row.checked_out_at ?? undefined,
    paymentStatus: row.payment_status,
    paymentMode: row.payment_mode,
    paymentProvider: row.payment_provider,
    paymentReference: row.payment_reference ?? undefined,
    payAtProperty: row.pay_at_property,
  };
}

function reservationToRow(input: ReservationCreateInput) {
  return {
    hotel_slug: defaultHotelSlug,
    booking_id: input.bookingId,
    idempotency_key: input.idempotencyKey ?? null,
    guest_name: input.guestName,
    phone: input.phone,
    email: input.email,
    room_id: input.roomId,
    checkin: input.checkin,
    checkout: input.checkout,
    status: input.status,
    created_at: input.createdAt ?? now(),
    checked_in_at: input.checkedInAt ?? null,
    checked_out_at: input.checkedOutAt ?? null,
    payment_status: input.paymentStatus ?? "pending",
    payment_mode: input.paymentMode ?? "pay_at_property",
    payment_provider: input.paymentProvider ?? "manual",
    payment_reference: input.paymentReference ?? null,
    pay_at_property: input.payAtProperty ?? true,
  };
}

function roomFromRow(row: RoomRow): Room {
  return {
    roomId: row.room_id,
    roomType: row.room_type,
    label: row.label,
    pricePerNight: row.price_per_night,
    floor: row.floor,
    view: row.view,
    maxGuests: row.max_guests,
    isActive: row.is_active,
  };
}

function roomToRow(input: Room) {
  return {
    hotel_slug: defaultHotelSlug,
    room_id: input.roomId,
    room_type: input.roomType,
    label: input.label,
    price_per_night: input.pricePerNight,
    floor: input.floor,
    view: input.view,
    max_guests: input.maxGuests,
    is_active: input.isActive,
  };
}

async function listReservationRows() {
  const rows = await supabaseRest<ReservationRow[]>("bookme_reservations", {
    query: `select=*&hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}&order=created_at.desc`,
  });
  return rows ?? [];
}

async function listRoomRows() {
  const rows = await supabaseRest<RoomRow[]>("bookme_rooms", {
    query: `select=*&hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}&order=room_id.asc`,
  });
  return rows ?? [];
}

async function nextBookingId() {
  const reservations = (await listReservationRows()).map(reservationFromRow);
  const highest = reservations.reduce((max, reservation) => {
    const number = Number(reservation.bookingId.match(/\d+$/)?.[0] ?? 0);
    return Math.max(max, number);
  }, 1047);

  return `BKM-${highest + 1}`;
}

async function existingReservationForIdempotency(idempotencyKey?: string) {
  if (!idempotencyKey) return undefined;
  const rows = await supabaseRest<ReservationRow[]>("bookme_reservations", {
    query: `select=*&hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}&idempotency_key=eq.${encodeURIComponent(idempotencyKey)}&limit=1`,
  });
  return rows?.[0] ? reservationFromRow(rows[0]) : undefined;
}

export function createSupabaseConnector(): ConnectorBackend {
  return {
    id: connectorId,
    name: connectorName,
    async health() {
      const config = getSupabaseServerConfig();
      if (!config) {
        return health("not_configured", "Supabase is not configured. Set Supabase URL and service-role key.");
      }

      try {
        const roomRows = await supabaseRest<RoomRow[]>("bookme_rooms", {
          query: `select=room_id&hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}&limit=1`,
        });
        const reservationRows = await supabaseRest<ReservationRow[]>("bookme_reservations", {
          query: `select=booking_id&hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}&limit=1`,
        });
        if (!roomRows || !reservationRows) {
          return health("error", "Supabase is configured but could not be reached.");
        }
      } catch (error) {
        return health("error", "Supabase is reachable, but reservation/inventory schema is not ready.", {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      return health("ok", "Supabase reservation and inventory tables are reachable.", {
        hotelSlug: defaultHotelSlug,
      });
    },
    async initialize(): Promise<ConnectorInitResult> {
      const current = await this.health();
      return { ...current, createdSheets: [], existingSheets: [] };
    },
    async resetSeedData(data: ConnectorSeedData) {
      await supabaseRest("bookme_reservations", {
        method: "DELETE",
        query: `hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}`,
        prefer: "return=minimal",
      });
      await supabaseRest("bookme_rooms", {
        method: "DELETE",
        query: `hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}`,
        prefer: "return=minimal",
      });

      for (const room of data.rooms) {
        await this.inventory!.upsertRoom(room);
      }
      for (const reservation of data.reservations) {
        await this.reservations!.createReservation({
          ...reservation,
          bookingId: reservation.bookingId,
          createdAt: reservation.createdAt,
        });
      }

      return {
        roomsReset: data.rooms.length,
        reservationsReset: data.reservations.length,
      };
    },
    reservations: {
      async listReservations() {
        return (await listReservationRows()).map(reservationFromRow);
      },
      async createReservation(input: ReservationCreateInput) {
        const existing = await existingReservationForIdempotency(input.idempotencyKey);
        if (existing) return existing;

        const body = reservationToRow({
          ...input,
          bookingId: input.bookingId ?? (await nextBookingId()),
          createdAt: input.createdAt ?? now(),
        });
        const rows = await supabaseRest<ReservationRow[]>("bookme_reservations", {
          method: "POST",
          prefer: "return=representation",
          body,
        });
        if (!rows?.[0]) throw new Error("Supabase reservation creation returned no row.");
        return reservationFromRow(rows[0]);
      },
      async updateReservationStatus(bookingId, status, patch) {
        const rows = await supabaseRest<ReservationRow[]>("bookme_reservations", {
          method: "PATCH",
          query: `hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}&booking_id=eq.${encodeURIComponent(bookingId)}`,
          prefer: "return=representation",
          body: {
            status,
            checked_in_at: patch?.checkedInAt ?? undefined,
            checked_out_at: patch?.checkedOutAt ?? undefined,
          },
        });
        if (!rows?.[0]) throw new Error("Reservation not found in Supabase.");
        return reservationFromRow(rows[0]);
      },
      async updateReservationPayment(bookingId, patch) {
        const rows = await supabaseRest<ReservationRow[]>("bookme_reservations", {
          method: "PATCH",
          query: `hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}&booking_id=eq.${encodeURIComponent(bookingId)}`,
          prefer: "return=representation",
          body: {
            payment_status: patch.paymentStatus,
            payment_mode: patch.paymentMode,
            payment_provider: patch.paymentProvider,
            payment_reference: patch.paymentReference,
            pay_at_property: patch.payAtProperty,
          },
        });
        if (!rows?.[0]) throw new Error("Reservation not found in Supabase.");
        return reservationFromRow(rows[0]);
      },
    },
    inventory: {
      async listRooms() {
        return (await listRoomRows()).map(roomFromRow);
      },
      async createRoom(input) {
        const rows = await supabaseRest<RoomRow[]>("bookme_rooms", {
          method: "POST",
          prefer: "return=representation",
          body: roomToRow(input),
        });
        if (!rows?.[0]) throw new Error("Supabase room creation returned no row.");
        return roomFromRow(rows[0]);
      },
      async updateRoom(roomId, patch) {
        const rows = await supabaseRest<RoomRow[]>("bookme_rooms", {
          method: "PATCH",
          query: `hotel_slug=eq.${encodeURIComponent(defaultHotelSlug)}&room_id=eq.${encodeURIComponent(roomId)}`,
          prefer: "return=representation",
          body: {
            room_type: patch.roomType,
            label: patch.label,
            price_per_night: patch.pricePerNight,
            floor: patch.floor,
            view: patch.view,
            max_guests: patch.maxGuests,
            is_active: patch.isActive,
          },
        });
        if (!rows?.[0]) throw new Error("Room not found in Supabase.");
        return roomFromRow(rows[0]);
      },
      async upsertRoom(input) {
        const rows = await supabaseRest<RoomRow[]>("bookme_rooms", {
          method: "POST",
          query: "on_conflict=hotel_slug,room_id",
          prefer: "resolution=merge-duplicates,return=representation",
          body: roomToRow(input),
        });
        if (!rows?.[0]) throw new Error("Supabase room upsert returned no row.");
        return roomFromRow(rows[0]);
      },
    },
  };
}
