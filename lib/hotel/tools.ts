import type { Reservation, Room, RoomType, SummaryCard, ToolResult } from "./types";
import { getStore } from "./store";
import type { HotelConfig } from "./config-store";
import { getConnectorBackend, listConnectorBackends, type ConnectorBackend } from "@/lib/connectors";

const dollars = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);

const rupees = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const titleFromSnake = (value: string) =>
  value
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const paymentStatusLabel = (reservation: Reservation) => {
  if ((reservation.payAtProperty ?? true) || (reservation.paymentMode ?? "pay_at_property") === "pay_at_property") {
    return "Pay at property";
  }
  return titleFromSnake(reservation.paymentStatus ?? "pending");
};

const paymentModeLabel = (reservation: Reservation) => titleFromSnake(reservation.paymentMode ?? "pay_at_property");

const normalizeIdentifier = (identifier: string) =>
  identifier.trim().toLowerCase().replace(/[()\-\s.]/g, "");

const bookingIdempotencyKey = (args: {
  guestName: string;
  phone: string;
  email: string;
  roomId: string;
  checkin: string;
  checkout: string;
}) =>
  [
    args.guestName.trim().toLowerCase(),
    normalizeIdentifier(args.phone),
    args.email.trim().toLowerCase(),
    args.roomId.trim().toLowerCase(),
    args.checkin,
    args.checkout,
  ].join("|");

const normalizeRoomType = (roomType?: string): RoomType | undefined => {
  const normalized = roomType?.toLowerCase();
  if (!normalized) return undefined;
  if (normalized.includes("suite") || normalized.includes("family")) return "suite";
  if (normalized.includes("king") || normalized.includes("executive")) return "king";
  if (
    normalized.includes("queen") ||
    normalized.includes("basic") ||
    normalized.includes("deluxe") ||
    normalized.includes("standard") ||
    normalized.includes("ac")
  ) {
    return "queen";
  }
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

const activeReservationForRoomFrom = (
  reservations: Reservation[],
  roomId: string,
  checkin: string,
  checkout: string,
) =>
  reservations.find(
    (reservation) =>
      reservation.roomId === roomId &&
      reservation.status !== "Checked Out" &&
      overlaps(checkin, checkout, reservation.checkin, reservation.checkout),
  );

function reservationCard(reservation: Reservation, title: string, kind: SummaryCard["kind"]): SummaryCard {
  const room = getRoom(reservation.roomId);
  return reservationCardWithRoom(reservation, room, title, kind, dollars);
}

function reservationCardWithRoom(
  reservation: Reservation,
  room: Room | undefined,
  title: string,
  kind: SummaryCard["kind"],
  money: (amount: number) => string,
): SummaryCard {
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
      { label: "Total", value: money(total) },
      { label: "Payment", value: paymentStatusLabel(reservation) },
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
  availableRooms.sort((a, b) => a.pricePerNight - b.pricePerNight || a.roomId.localeCompare(b.roomId));

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
    idempotencyKey: bookingIdempotencyKey(args),
    guestName: args.guestName,
    phone: normalizeIdentifier(args.phone),
    email: args.email.toLowerCase(),
    roomId: args.roomId,
    checkin: args.checkin,
    checkout: args.checkout,
    status: "Confirmed",
    createdAt: new Date().toISOString(),
    paymentStatus: "pending",
    paymentMode: "pay_at_property",
    paymentProvider: "manual",
    payAtProperty: true,
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

export function adminDashboardData(config?: HotelConfig) {
  const store = getStore();
  const roomsById = new Map(store.rooms.map((room) => [room.roomId, room]));

  const reservations = store.reservations.map((reservation) => {
    const room = roomsById.get(reservation.roomId);
    const nights = nightsBetween(reservation.checkin, reservation.checkout);
    const total = (room?.pricePerNight ?? 0) * nights;

    return {
      bookingId: reservation.bookingId,
      guestName: reservation.guestName,
      contact: reservation.email || reservation.phone,
      customerEmail: reservation.email,
      customerPhone: reservation.phone,
      room: room?.label ?? reservation.roomId,
      dates: `${reservation.checkin} to ${reservation.checkout}`,
      status: reservation.status,
      total: dollars(total),
      amountInPaise: Math.max(0, Math.round(total * 100)),
      paymentStatus: paymentStatusLabel(reservation),
      paymentMode: paymentModeLabel(reservation),
    };
  });

  const inventory = config
    ? config.roomTypes.map((room, index) => ({
        roomId: `type-${index + 1}`,
        label: room.type,
        roomType: `${room.count} rooms`,
        rate: rupees(Number(room.rate || 0)),
        floor: "Mapped",
        view: config.sourceSystem,
        maxGuests: "Policy based",
        status: "Available",
      }))
    : store.rooms.map((room) => {
    const activeReservations = store.reservations.filter(
      (reservation) => reservation.roomId === room.roomId && reservation.status !== "Checked Out",
    );

    return {
      roomId: room.roomId,
      label: room.label,
      roomType: room.roomType,
      rate: dollars(room.pricePerNight),
      floor: String(room.floor),
      view: room.view,
      maxGuests: String(room.maxGuests),
      status: activeReservations.length > 0 ? "Reserved" : "Available",
    };
  });

  const checkedIn = store.reservations.filter((reservation) => reservation.status === "Checked In").length;
  const confirmed = store.reservations.filter((reservation) => reservation.status === "Confirmed").length;
  const checkedOut = store.reservations.filter((reservation) => reservation.status === "Checked Out").length;
  const roomRevenue = store.reservations.reduce((sum, reservation) => {
    const room = roomsById.get(reservation.roomId);
    return sum + (room?.pricePerNight ?? 0) * nightsBetween(reservation.checkin, reservation.checkout);
  }, 0);

  return {
    hotel: {
      name: config?.hotelName ?? "Sriram Hotel",
      location: config?.city ?? "Downtown Boston",
      dataSource: config?.sourceSystem ?? "Mock data",
      guestSite: config ? `/demo?hotel=${config.slug}` : "/demo",
      checkinWindow: config?.checkinWindow,
      escalationContact: config?.escalationContact,
      proposal: config?.proposal,
    },
    metrics: [
      { label: "Reservations", value: String(store.reservations.length), detail: `${confirmed} upcoming` },
      { label: "Checked in", value: String(checkedIn), detail: "Guests currently in-house" },
      { label: "Rooms", value: String(config?.totalRooms ?? store.rooms.length), detail: config ? `${config.roomTypes.length} mapped types` : `${store.rooms.length - checkedIn} available now` },
      { label: "Demo revenue", value: dollars(roomRevenue), detail: `${checkedOut} completed stays` },
    ],
    reservations,
    inventory,
  };
}

export async function adminDashboardDataAsync(config?: HotelConfig) {
  const connector = await activeConnector();
  if (!connector?.reservations || !connector.inventory) {
    return adminDashboardData(config);
  }

  try {
    const [reservationsRaw, rooms] = await Promise.all([
      connector.reservations.listReservations(),
      connector.inventory.listRooms(),
    ]);
    const roomsById = new Map(rooms.map((room) => [room.roomId, room]));
    const reservations = reservationsRaw.map((reservation) => {
      const room = roomsById.get(reservation.roomId);
      const nights = nightsBetween(reservation.checkin, reservation.checkout);
      const total = (room?.pricePerNight ?? 0) * nights;

      return {
        bookingId: reservation.bookingId,
        guestName: reservation.guestName,
        contact: reservation.email || reservation.phone,
        customerEmail: reservation.email,
        customerPhone: reservation.phone,
        room: room?.label ?? reservation.roomId,
        dates: `${reservation.checkin} to ${reservation.checkout}`,
        status: reservation.status,
        total: rupees(total),
        amountInPaise: Math.max(0, Math.round(total * 100)),
        paymentStatus: paymentStatusLabel(reservation),
        paymentMode: paymentModeLabel(reservation),
      };
    });

    const inventory = rooms.map((room) => {
      const activeReservations = reservationsRaw.filter(
        (reservation) => reservation.roomId === room.roomId && reservation.status !== "Checked Out",
      );

      return {
        roomId: room.roomId,
        label: room.label,
        roomType: room.roomType,
        rate: rupees(room.pricePerNight),
        floor: String(room.floor),
        view: room.view,
        maxGuests: String(room.maxGuests),
        status: activeReservations.length > 0 ? "Reserved" : "Available",
      };
    });

    const checkedIn = reservationsRaw.filter((reservation) => reservation.status === "Checked In").length;
    const confirmed = reservationsRaw.filter((reservation) => reservation.status === "Confirmed").length;
    const checkedOut = reservationsRaw.filter((reservation) => reservation.status === "Checked Out").length;
    const roomRevenue = reservationsRaw.reduce((sum, reservation) => {
      const room = roomsById.get(reservation.roomId);
      return sum + (room?.pricePerNight ?? 0) * nightsBetween(reservation.checkin, reservation.checkout);
    }, 0);

    return {
      hotel: {
        name: config?.hotelName ?? "Sriram Hotel",
        location: config?.city ?? "Downtown Boston",
        dataSource: "Google Sheets",
        guestSite: config ? `/demo?hotel=${config.slug}` : "/demo",
        checkinWindow: config?.checkinWindow,
        escalationContact: config?.escalationContact,
        proposal: config?.proposal,
      },
      metrics: [
        { label: "Reservations", value: String(reservationsRaw.length), detail: `${confirmed} upcoming` },
        { label: "Checked in", value: String(checkedIn), detail: "Guests currently in-house" },
        { label: "Rooms", value: String(rooms.length), detail: `${Math.max(0, rooms.length - checkedIn)} available now` },
        { label: "Revenue", value: rupees(roomRevenue), detail: `${checkedOut} completed stays` },
      ],
      reservations,
      inventory,
    };
  } catch (error) {
    console.warn(error);
    return adminDashboardData(config);
  }
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

async function activeConnector(): Promise<ConnectorBackend | undefined> {
  const preferredConnectorId = process.env.BOOKME_CONNECTOR_ID?.trim();
  const connectors = preferredConnectorId
    ? [getConnectorBackend(preferredConnectorId)].filter((connector): connector is ConnectorBackend => Boolean(connector))
    : listConnectorBackends();

  for (const connector of connectors) {
    if (!connector.reservations || !connector.inventory) continue;
    const status = await connector.health();
    if (status.status === "ok") return connector;
  }

  return undefined;
}

async function lookupGuestConnected(connector: ConnectorBackend, identifier: string): Promise<ToolResult> {
  if (!connector.reservations || !connector.inventory) return lookupGuest(identifier);

  const normalized = normalizeIdentifier(identifier);
  if (normalized.length < 5) {
    return { ok: false, message: "Please provide a full phone number, email address, or booking ID." };
  }

  const reservations = await connector.reservations.listReservations();
  const rooms = await connector.inventory.listRooms();
  const roomsById = new Map(rooms.map((room) => [room.roomId, room]));
  const matches = reservations.filter((reservation) => {
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
    card: reservationCardWithRoom(reservation, roomsById.get(reservation.roomId), "Reservation found", "info", rupees),
    data: reservation,
  };
}

async function checkAvailabilityConnected(
  connector: ConnectorBackend,
  checkin: string,
  checkout: string,
  roomType?: string,
): Promise<ToolResult> {
  if (!connector.reservations || !connector.inventory) return checkAvailability(checkin, checkout, roomType);

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
  const rooms = (await connector.inventory.listRooms()).filter(
    (room) => room.isActive && (!normalizedRoomType || room.roomType === normalizedRoomType),
  );
  const reservations = await connector.reservations.listReservations();
  const availableRooms = rooms.filter((room) => !activeReservationForRoomFrom(reservations, room.roomId, checkin, checkout));
  availableRooms.sort((a, b) => a.pricePerNight - b.pricePerNight || a.roomId.localeCompare(b.roomId));

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
    message: `${best.label} is available for ${nights} night${nights === 1 ? "" : "s"} at ${rupees(best.pricePerNight)}/night. Ask the guest to confirm before booking.`,
    card: {
      kind: "info",
      title: "Room available",
      status: "Pending confirmation",
      fields: [
        { label: "Room", value: best.label },
        { label: "Dates", value: `${checkin} to ${checkout}` },
        { label: "Rate", value: `${rupees(best.pricePerNight)}/night` },
        { label: "Total", value: rupees(nights * best.pricePerNight) },
      ],
    },
    data: { room: best, checkin, checkout, nights, total: nights * best.pricePerNight },
  };
}

async function createBookingConnected(
  connector: ConnectorBackend,
  args: {
    guestName: string;
    phone: string;
    email: string;
    roomId: string;
    checkin: string;
    checkout: string;
    confirmedByGuest: boolean;
  },
): Promise<ToolResult> {
  if (!connector.reservations || !connector.inventory) return createBooking(args);

  if (!args.confirmedByGuest) {
    return { ok: false, message: "Before creating the booking, ask the guest for explicit confirmation." };
  }

  if (!args.guestName || (!args.phone && !args.email)) {
    return { ok: false, message: "A booking requires the guest name and either a phone number or email." };
  }

  const reservations = await connector.reservations.listReservations();
  const idempotencyKey = bookingIdempotencyKey(args);
  const existing = reservations.find(
    (reservation) =>
      reservation.idempotencyKey === idempotencyKey ||
      (reservation.status !== "Checked Out" &&
        reservation.roomId === args.roomId &&
        reservation.checkin === args.checkin &&
        reservation.checkout === args.checkout &&
        reservation.guestName.trim().toLowerCase() === args.guestName.trim().toLowerCase() &&
        (normalizeIdentifier(reservation.phone) === normalizeIdentifier(args.phone) ||
          reservation.email.toLowerCase() === args.email.toLowerCase())),
  );
  if (existing) {
    const room = (await connector.inventory.listRooms()).find((candidate) => candidate.roomId === existing.roomId);
    return {
      ok: true,
      message: `Booking already exists for ${existing.guestName}. Confirmation number: ${existing.bookingId}.`,
      card: reservationCardWithRoom(existing, room, "Reservation confirmed", "booking", rupees),
      data: existing,
    };
  }

  if (activeReservationForRoomFrom(reservations, args.roomId, args.checkin, args.checkout)) {
    return { ok: false, message: "That room was just taken. Please check availability again and offer another room." };
  }

  const room = (await connector.inventory.listRooms()).find((candidate) => candidate.roomId === args.roomId);
  if (!room) {
    return { ok: false, message: "That room ID does not exist." };
  }

  const reservation = await connector.reservations.createReservation({
    guestName: args.guestName,
    idempotencyKey,
    phone: normalizeIdentifier(args.phone),
    email: args.email.toLowerCase(),
    roomId: args.roomId,
    checkin: args.checkin,
    checkout: args.checkout,
    status: "Confirmed",
    paymentStatus: "pending",
    paymentMode: "pay_at_property",
    paymentProvider: "manual",
    payAtProperty: true,
  });

  return {
    ok: true,
    message: `Booked ${room.label} for ${reservation.guestName}. Confirmation number: ${reservation.bookingId}.`,
    card: reservationCardWithRoom(reservation, room, "Reservation confirmed", "booking", rupees),
    data: reservation,
  };
}

async function checkInGuestConnected(connector: ConnectorBackend, bookingId: string): Promise<ToolResult> {
  if (!connector.reservations || !connector.inventory) return checkInGuest(bookingId);

  const reservation = (await connector.reservations.listReservations()).find(
    (candidate) => candidate.bookingId.toLowerCase() === bookingId.toLowerCase(),
  );
  if (!reservation) return { ok: false, message: "I could not find that booking ID." };

  const room = (await connector.inventory.listRooms()).find((candidate) => candidate.roomId === reservation.roomId);
  if (reservation.status === "Checked In") {
    return {
      ok: false,
      message: "This reservation is already checked in.",
      card: reservationCardWithRoom(reservation, room, "Already checked in", "checkin", rupees),
    };
  }

  if (reservation.status === "Checked Out") {
    return {
      ok: false,
      message: "This reservation has already checked out.",
      card: reservationCardWithRoom(reservation, room, "Already checked out", "checkout", rupees),
    };
  }

  if (reservation.checkin > todayIso()) {
    return {
      ok: false,
      message: `This reservation starts on ${reservation.checkin}. Please check in on the arrival date.`,
      card: reservationCardWithRoom(reservation, room, "Check-in not open", "info", rupees),
    };
  }

  const updated = await connector.reservations.updateReservationStatus(bookingId, "Checked In", {
    checkedInAt: new Date().toISOString(),
  });
  return {
    ok: true,
    message: `Checked in ${updated.guestName}. Room ${updated.roomId} is ready.`,
    card: reservationCardWithRoom(updated, room, "Room ready", "checkin", rupees),
    data: updated,
  };
}

async function checkOutGuestConnected(connector: ConnectorBackend, bookingId: string): Promise<ToolResult> {
  if (!connector.reservations || !connector.inventory) return checkOutGuest(bookingId);

  const reservation = (await connector.reservations.listReservations()).find(
    (candidate) => candidate.bookingId.toLowerCase() === bookingId.toLowerCase(),
  );
  if (!reservation) return { ok: false, message: "I could not find that booking ID." };

  const room = (await connector.inventory.listRooms()).find((candidate) => candidate.roomId === reservation.roomId);
  if (reservation.status !== "Checked In") {
    return {
      ok: false,
      message: "Only checked-in reservations can be checked out.",
      card: reservationCardWithRoom(reservation, room, "Checkout unavailable", "info", rupees),
    };
  }

  const updated = await connector.reservations.updateReservationStatus(bookingId, "Checked Out", {
    checkedOutAt: new Date().toISOString(),
  });
  return {
    ok: true,
    message: `Checked out ${updated.guestName}. Thank you for staying with us.`,
    card: reservationCardWithRoom(updated, room, "Checkout complete", "checkout", rupees),
    data: updated,
  };
}

export async function toolFromNameAsync(name: string, rawArgs: unknown): Promise<ToolResult> {
  const connector = await activeConnector();
  if (!connector) return toolFromName(name, rawArgs);

  const args = typeof rawArgs === "object" && rawArgs !== null ? (rawArgs as Record<string, unknown>) : {};

  try {
    switch (name) {
      case "lookup_guest":
        return lookupGuestConnected(connector, String(args.identifier ?? ""));
      case "check_availability":
        return checkAvailabilityConnected(
          connector,
          String(args.checkin ?? ""),
          String(args.checkout ?? ""),
          args.room_type ? String(args.room_type) : undefined,
        );
      case "create_booking":
        return createBookingConnected(connector, {
          guestName: String(args.guest_name ?? ""),
          phone: String(args.phone ?? ""),
          email: String(args.email ?? ""),
          roomId: String(args.room_id ?? ""),
          checkin: String(args.checkin ?? ""),
          checkout: String(args.checkout ?? ""),
          confirmedByGuest: Boolean(args.confirmed_by_guest),
        });
      case "checkin_guest":
        return checkInGuestConnected(connector, String(args.booking_id ?? ""));
      case "checkout_guest":
        return checkOutGuestConnected(connector, String(args.booking_id ?? ""));
      default:
        return { ok: false, message: `Unknown tool: ${name}` };
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "The reservation connector failed.",
    };
  }
}
