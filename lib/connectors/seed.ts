import { getConnectorBackend } from "@/lib/connectors";
import type { Reservation, Room } from "@/lib/hotel/types";

const isoDateFromToday = (offset: number) => {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
};

export type SeedGoogleSheetsResult = {
  ok: boolean;
  message: string;
  mode: "seed" | "reset";
  roomsUpserted: number;
  roomsReset: number;
  reservationsCreated: number;
  reservationsSkipped: number;
  reservationsReset: number;
};

const demoRooms: Room[] = [
  {
    roomId: "DLX-101",
    roomType: "queen",
    label: "Deluxe AC 101",
    pricePerNight: 3499,
    floor: 1,
    view: "City",
    maxGuests: 2,
    isActive: true,
  },
  {
    roomId: "DLX-102",
    roomType: "queen",
    label: "Deluxe AC 102",
    pricePerNight: 3499,
    floor: 1,
    view: "City",
    maxGuests: 2,
    isActive: true,
  },
  {
    roomId: "EXE-201",
    roomType: "king",
    label: "Executive King 201",
    pricePerNight: 4999,
    floor: 2,
    view: "Quiet",
    maxGuests: 2,
    isActive: true,
  },
  {
    roomId: "EXE-202",
    roomType: "king",
    label: "Executive King 202",
    pricePerNight: 4999,
    floor: 2,
    view: "Quiet",
    maxGuests: 2,
    isActive: true,
  },
  {
    roomId: "STE-301",
    roomType: "suite",
    label: "Family Suite 301",
    pricePerNight: 7499,
    floor: 3,
    view: "Street",
    maxGuests: 4,
    isActive: true,
  },
];

function demoReservations(): Reservation[] {
  const today = isoDateFromToday(0);
  const tomorrow = isoDateFromToday(1);
  const dayAfterTomorrow = isoDateFromToday(2);
  const createdAt = `${today}T00:00:00.000Z`;
  const checkedInAt = `${today}T09:00:00.000Z`;

  return [
    {
      bookingId: "BKM-2001",
      guestName: "James Lee",
      phone: "+916175550192",
      email: "james@example.com",
      roomId: "DLX-101",
      checkin: today,
      checkout: tomorrow,
      status: "Confirmed",
      createdAt,
      paymentStatus: "pending",
      paymentMode: "pay_at_property",
      paymentProvider: "manual",
      payAtProperty: true,
    },
    {
      bookingId: "BKM-2002",
      guestName: "Priya Sharma",
      phone: "+919876511111",
      email: "priya@example.com",
      roomId: "EXE-201",
      checkin: today,
      checkout: dayAfterTomorrow,
      status: "Checked In",
      createdAt,
      checkedInAt,
      paymentStatus: "pending",
      paymentMode: "pay_at_property",
      paymentProvider: "manual",
      payAtProperty: true,
    },
  ];
}

function unavailableResult(message: string, mode: SeedGoogleSheetsResult["mode"]): SeedGoogleSheetsResult {
  return {
    ok: false,
    message,
    mode,
    roomsUpserted: 0,
    roomsReset: 0,
    reservationsCreated: 0,
    reservationsSkipped: 0,
    reservationsReset: 0,
  };
}

export async function seedGoogleSheetsDemo(options: { reset?: boolean } = {}): Promise<SeedGoogleSheetsResult> {
  const mode = options.reset ? "reset" : "seed";
  const connector = getConnectorBackend("google-sheets");
  if (!connector?.inventory || !connector.reservations) {
    return unavailableResult("Google Sheets connector is unavailable.", mode);
  }

  const health = await connector.health();
  if (health.status !== "ok") {
    return unavailableResult(health.message, mode);
  }

  if (options.reset) {
    if (!connector.resetSeedData) {
      return unavailableResult("Google Sheets connector does not support demo data reset.", mode);
    }

    const reset = await connector.resetSeedData({
      rooms: demoRooms,
      reservations: demoReservations(),
    });

    return {
      ok: true,
      message: "Google Sheets demo data was reset.",
      mode,
      roomsUpserted: 0,
      roomsReset: reset.roomsReset,
      reservationsCreated: 0,
      reservationsSkipped: 0,
      reservationsReset: reset.reservationsReset,
    };
  }

  await Promise.all(demoRooms.map((room) => connector.inventory!.upsertRoom(room)));

  const existingReservations = await connector.reservations.listReservations();
  const existingIds = new Set(existingReservations.map((reservation) => reservation.bookingId.toLowerCase()));
  let reservationsCreated = 0;
  let reservationsSkipped = 0;

  for (const reservation of demoReservations()) {
    if (existingIds.has(reservation.bookingId.toLowerCase())) {
      reservationsSkipped += 1;
      continue;
    }

    await connector.reservations.createReservation(reservation);
    reservationsCreated += 1;
  }

  return {
    ok: true,
    message: "Google Sheets demo data is ready.",
    mode,
    roomsUpserted: demoRooms.length,
    roomsReset: 0,
    reservationsCreated,
    reservationsSkipped,
    reservationsReset: 0,
  };
}
