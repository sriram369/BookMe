import type { Reservation, Room, RoomType, SummaryCard, ToolResult } from "./types";
import { getStore } from "./store";

const dollars = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const normalizeIdentifier = (identifier: string) =>
  identifier.trim().toLowerCase().replace(/[()\-\s.]/g, "");

const normalizeRoomType = (roomType?: string): RoomType | undefined => {
  const normalized = roomType?.toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes("suite")) return "suite";
  if (normalized.includes("king")) return "king";
  if (normalized.includes("queen") || normalized.includes("basic")) return "queen";
  return undefined;
};

const nightsBetween = (checkin: string, checkout: string) => {
  const start = new Date(`${checkin}T00:00:00Z`).getTime();
  const end = new Date(`${checkout}T00:00:00Z`).getTime();
  return Math.max(0, Math.round((end - start) / 86_400_000));
};

const todayIso = () => new Date().toISOString().slice(0, 10);

const getRoom = (roomId: string) => getStore().rooms.find((room) => room.roomId === roomId);

const overlaps = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart < bEnd && bStart < aEnd;

const activeReservationForRoom = (roomId: string, checkin: string, checkout: string) =>
  getStore().reservations.find(
    (reservation) =>
      reservation.roomId === roomId &&
      reservation.status !== "Checked Out" &&
      overlaps(checkin, checkout, reservation.checkin, reservation.checkout),
  );

function reservationCard(reservation: Reservation, title: string, kind: SummaryCard["kind"]): SummaryCard {
  const room = getRoom(reservation.roomId);
  const nights = nightsBetween(reservation.checkin, reservation.checkout);
  const total = room ? nights * room.pricePerNight : 0;

  return {
    kind,
    title,
    status: reservation.status,
    fields: [
      { label: "Booking", value: reservation.bookingId },
      { label: "Guest", value: reservation.guestName },
      { label: "Room", value: room?.label ?? reservation.roomId },
      { label: "Dates", value: `${reservation.checkin} to ${reservation.checkout}` },
      { label: "Total", value: dollars(total) },
    ],
  };
}

export function lookupGuest(identifier: string): ToolResult {
  const normalized = normalizeIdentifier(identifier);

  if (normalized.length < 5) {
    return {
      ok: false,
      message: "Please provide a full phone number, email address, or booking ID.",
    };
  }

  const matches = getStore().reservations.filter((reservation) => {
    const phone = normalizeIdentifier(reservation.phone);
    const email = reservation.email.toLowerCase();
    const bookingId = reservation.bookingId.toLowerCase();

    return phone === normalized || email === normalized || bookingId === normalized;
  });

  if (matches.length === 0) {
    return {
      ok: false,
      message: "I could not find a reservation with that identifier. Please check the phone, email, or booking ID.",
    };
  }

  if (matches.length > 1) {
    return {
      ok: false,
      message: "I found more than one matching reservation. Please provide the booking ID.",
      data: matches.map((reservation) => ({
        bookingId: reservation.bookingId,
        checkin: reservation.checkin,
        checkout: reservation.checkout,
        status: reservation.status,
      })),
    };
  }

  const reservation = matches[0];
  return {
    ok: true,
    message: `Found ${reservation.guestName}'s reservation ${reservation.bookingId}.`,
    card: reservationCard(reservation, "Reservation found", "info"),
    data: reservation,
  };
}

export function checkAvailability(checkin: string, checkout: string, roomType?: string): ToolResult {
  if (!checkin || !checkout) {
    return { ok: false, message: "Please provide both check-in and check-out dates." };
  }

  if (checkout <= checkin) {
    return { ok: false, message: "Check-out must be after check-in." };
  }

  if (checkin < todayIso()) {
    return { ok: false, message: "Bookings cannot start in the past." };
  }

  const normalizedRoomType = normalizeRoomType(roomType);
  const rooms = getStore().rooms.filter(
    (room) => room.isActive && (!normalizedRoomType || room.roomType === normalizedRoomType),
  );
  const availableRooms = rooms.filter((room) => !activeReservationForRoom(room.roomId, checkin, checkout));

  if (availableRooms.length === 0) {
    return {
      ok: false,
      message: "No matching rooms are available for those dates. Try a different room type or date range.",
    };
  }

  const best = availableRooms[0];
  const nights = nightsBetween(checkin, checkout);
  return {
    ok: true,
    message: `${best.label} is available for ${nights} night${nights === 1 ? "" : "s"} at ${dollars(best.pricePerNight)}/night. Ask the guest to confirm before booking.`,
    card: {
      kind: "info",
      title: "Room available",
      status: "Pending confirmation",
      fields: [
        { label: "Room", value: best.label },
        { label: "Dates", value: `${checkin} to ${checkout}` },
        { label: "Rate", value: `${dollars(best.pricePerNight)}/night` },
        { label: "Total", value: dollars(nights * best.pricePerNight) },
      ],
    },
    data: { room: best, checkin, checkout, nights, total: nights * best.pricePerNight },
  };
}

export function createBooking(args: {
  guestName: string;
  phone: string;
  email: string;
  roomId: string;
  checkin: string;
  checkout: string;
  confirmedByGuest: boolean;
}): ToolResult {
  if (!args.confirmedByGuest) {
    return {
      ok: false,
      message: "Before creating the booking, ask the guest for explicit confirmation.",
    };
  }

  if (!args.guestName || (!args.phone && !args.email)) {
    return {
      ok: false,
      message: "A booking requires the guest name and either a phone number or email.",
    };
  }

  if (activeReservationForRoom(args.roomId, args.checkin, args.checkout)) {
    return {
      ok: false,
      message: "That room was just taken. Please check availability again and offer another room.",
    };
  }

  const store = getStore();
  const room = store.rooms.find((candidate) => candidate.roomId === args.roomId);
  if (!room) {
    return { ok: false, message: "That room ID does not exist." };
  }

  const reservation: Reservation = {
    bookingId: `BKM-${store.nextBookingNumber++}`,
    guestName: args.guestName,
    phone: normalizeIdentifier(args.phone),
    email: args.email.toLowerCase(),
    roomId: args.roomId,
    checkin: args.checkin,
    checkout: args.checkout,
    status: "Confirmed",
    createdAt: new Date().toISOString(),
  };

  store.reservations.unshift(reservation);

  return {
    ok: true,
    message: `Booked ${room.label} for ${reservation.guestName}. Confirmation number: ${reservation.bookingId}.`,
    card: reservationCard(reservation, "Reservation confirmed", "booking"),
    data: reservation,
  };
}

export function checkInGuest(bookingId: string): ToolResult {
  const reservation = getStore().reservations.find(
    (candidate) => candidate.bookingId.toLowerCase() === bookingId.toLowerCase(),
  );

  if (!reservation) {
    return { ok: false, message: "I could not find that booking ID." };
  }

  if (reservation.status === "Checked In") {
    return {
      ok: false,
      message: "This reservation is already checked in.",
      card: reservationCard(reservation, "Already checked in", "checkin"),
    };
  }

  if (reservation.status === "Checked Out") {
    return {
      ok: false,
      message: "This reservation has already checked out.",
      card: reservationCard(reservation, "Already checked out", "checkout"),
    };
  }

  if (reservation.checkin > todayIso()) {
    return {
      ok: false,
      message: `This reservation starts on ${reservation.checkin}. Please check in on the arrival date.`,
      card: reservationCard(reservation, "Check-in not open", "info"),
    };
  }

  reservation.status = "Checked In";
  reservation.checkedInAt = new Date().toISOString();

  return {
    ok: true,
    message: `Checked in ${reservation.guestName}. Room ${reservation.roomId} is ready.`,
    card: reservationCard(reservation, "Room ready", "checkin"),
    data: reservation,
  };
}

export function checkOutGuest(bookingId: string): ToolResult {
  const reservation = getStore().reservations.find(
    (candidate) => candidate.bookingId.toLowerCase() === bookingId.toLowerCase(),
  );

  if (!reservation) {
    return { ok: false, message: "I could not find that booking ID." };
  }

  if (reservation.status !== "Checked In") {
    return {
      ok: false,
      message: "Only checked-in reservations can be checked out.",
      card: reservationCard(reservation, "Checkout unavailable", "info"),
    };
  }

  reservation.status = "Checked Out";
  reservation.checkedOutAt = new Date().toISOString();

  return {
    ok: true,
    message: `Checked out ${reservation.guestName}. Thank you for staying with us.`,
    card: reservationCard(reservation, "Checkout complete", "checkout"),
    data: reservation,
  };
}

export function reservationsForAdmin() {
  const store = getStore();
  return store.reservations.map((reservation) => {
    const room = getRoom(reservation.roomId);
    const nights = nightsBetween(reservation.checkin, reservation.checkout);
    return [
      reservation.bookingId,
      reservation.guestName,
      room?.label ?? reservation.roomId,
      reservation.status,
      dollars((room?.pricePerNight ?? 0) * nights),
    ];
  });
}

export function toolFromName(name: string, rawArgs: unknown): ToolResult {
  const args = typeof rawArgs === "object" && rawArgs !== null ? (rawArgs as Record<string, unknown>) : {};

  switch (name) {
    case "lookup_guest":
      return lookupGuest(String(args.identifier ?? ""));
    case "check_availability":
      return checkAvailability(
        String(args.checkin ?? ""),
        String(args.checkout ?? ""),
        args.room_type ? String(args.room_type) : undefined,
      );
    case "create_booking":
      return createBooking({
        guestName: String(args.guest_name ?? ""),
        phone: String(args.phone ?? ""),
        email: String(args.email ?? ""),
        roomId: String(args.room_id ?? ""),
        checkin: String(args.checkin ?? ""),
        checkout: String(args.checkout ?? ""),
        confirmedByGuest: Boolean(args.confirmed_by_guest),
      });
    case "checkin_guest":
      return checkInGuest(String(args.booking_id ?? ""));
    case "checkout_guest":
      return checkOutGuest(String(args.booking_id ?? ""));
    default:
      return { ok: false, message: `Unknown tool: ${name}` };
  }
}

