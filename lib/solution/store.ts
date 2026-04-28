import type {
  SolutionAuditEvent,
  SolutionConnector,
  SolutionDashboard,
  SolutionHotelConfig,
  SolutionReservation,
  SolutionRoomType,
  WelcomeLookupResult,
} from "./types";

type SolutionStore = SolutionDashboard & {
  nextAuditNumber: number;
};

const today = new Date().toISOString().slice(0, 10);
const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const now = () => new Date().toISOString();

const normalizeIdentifier = (value: string) =>
  value.trim().toLowerCase().replace(/[()\-\s.]/g, "");

const initialHotel: SolutionHotelConfig = {
  hotelName: "Sriram Hotel Chennai",
  location: "T. Nagar, Chennai",
  totalRooms: 42,
  checkinWindow: "12:00 PM to 11:00 PM",
  escalationContact: "+91 98765 43210",
  idRule: "Physical government ID photo required before room release.",
  setupStage: "connectors",
};

const initialConnectors: SolutionConnector[] = [
  {
    id: "google-sheets",
    name: "Google Sheets",
    kind: "sheet",
    status: "connected",
    description: "Reservations, room inventory, ID metadata, and audit log tabs.",
    lastSync: "2 minutes ago",
  },
  {
    id: "ezee",
    name: "eZee / Hotelogix PMS",
    kind: "pms",
    status: "needs_credentials",
    description: "PMS adapter planned after the paid pilot validates the workflow.",
    lastSync: "Not connected",
  },
  {
    id: "ota",
    name: "Booking.com / Agoda / MakeMyTrip",
    kind: "ota",
    status: "planned",
    description: "Read-only booking import first; writeback requires partner credentials.",
    lastSync: "Planned",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    kind: "whatsapp",
    status: "manual_review",
    description: "Guest handoff channel for failures and staff escalation.",
    lastSync: "Manual handoff",
  },
];

const initialRooms: SolutionRoomType[] = [
  { id: "deluxe-ac", name: "Deluxe AC", count: 24, baseRateInr: 3499 },
  { id: "executive-king", name: "Executive King", count: 12, baseRateInr: 4999 },
  { id: "family-suite", name: "Family Suite", count: 6, baseRateInr: 7499 },
];

const initialReservations: SolutionReservation[] = [
  {
    bookingId: "BM-IN-2048",
    guestName: "Aarav Mehta",
    phone: "9876543210",
    email: "aarav@example.com",
    roomType: "Deluxe AC",
    roomNumber: "214",
    checkin: today,
    checkout: plusDays(2),
    status: "ID Pending",
    idCaptureStatus: "not_requested",
  },
  {
    bookingId: "BM-IN-2039",
    guestName: "Priya Nair",
    phone: "9988776655",
    email: "priya.nair@example.com",
    roomType: "Executive King",
    roomNumber: "418",
    checkin: today,
    checkout: plusDays(1),
    status: "Checked In",
    idCaptureStatus: "captured",
    idPhotoName: "priya-aadhaar-front.jpg",
    idCapturedAt: plusDays(0),
    checkedInAt: plusDays(0),
  },
  {
    bookingId: "BM-IN-2027",
    guestName: "Rahul Shah",
    phone: "9123456780",
    email: "rahul@example.com",
    roomType: "Family Suite",
    roomNumber: "501",
    checkin: plusDays(1),
    checkout: plusDays(4),
    status: "Confirmed",
    idCaptureStatus: "not_requested",
  },
];

const initialAuditLog: SolutionAuditEvent[] = [
  {
    id: "AUD-1003",
    at: now(),
    actor: "system",
    title: "Google Sheets sync healthy",
    detail: "Reservations and inventory tabs were reachable.",
  },
  {
    id: "AUD-1002",
    at: now(),
    actor: "guest",
    title: "ID captured",
    detail: "Priya Nair uploaded ID metadata before check-in.",
  },
  {
    id: "AUD-1001",
    at: now(),
    actor: "owner",
    title: "Pilot setup started",
    detail: "Owner selected Google Sheets as the source of truth.",
  },
];

const initialStore = (): SolutionStore => ({
  hotel: initialHotel,
  connectors: initialConnectors,
  rooms: initialRooms,
  reservations: initialReservations,
  auditLog: initialAuditLog,
  nextAuditNumber: 1004,
});

const globalForSolution = globalThis as typeof globalThis & {
  __bookmeSolutionStore?: SolutionStore;
};

export function getSolutionStore() {
  if (!globalForSolution.__bookmeSolutionStore) {
    globalForSolution.__bookmeSolutionStore = initialStore();
  }

  return globalForSolution.__bookmeSolutionStore;
}

export function solutionDashboard(): SolutionDashboard {
  const store = getSolutionStore();
  return {
    hotel: store.hotel,
    connectors: store.connectors,
    rooms: store.rooms,
    reservations: store.reservations,
    auditLog: store.auditLog,
  };
}

function addAudit(actor: SolutionAuditEvent["actor"], title: string, detail: string) {
  const store = getSolutionStore();
  const event: SolutionAuditEvent = {
    id: `AUD-${store.nextAuditNumber++}`,
    at: now(),
    actor,
    title,
    detail,
  };
  store.auditLog.unshift(event);
  return event;
}

export function ownerOnboardingReply(message: string) {
  const lower = message.toLowerCase();
  const store = getSolutionStore();

  if (lower.includes("sheet") || lower.includes("google")) {
    store.connectors[0].status = "connected";
    store.hotel.setupStage = "connectors";
    addAudit("owner", "Google Sheets selected", "Owner chose Google Sheets as the pilot source of truth.");
    return "Good. We will use Google Sheets as the first source of truth: Reservations, Inventory, ID Log, and Audit Log tabs.";
  }

  if (lower.includes("room") || lower.includes("rate") || lower.includes("price")) {
    addAudit("owner", "Room setup updated", "Owner discussed room count and pricing during setup chat.");
    return "For the paid pilot, map room type, count, base rate, max guests, and whether the room is active. We can do it for the hotel as a paid setup add-on.";
  }

  if (lower.includes("id") || lower.includes("aadhaar") || lower.includes("passport")) {
    store.hotel.idRule = "Physical ID photo capture required before room release; staff review stays visible in admin.";
    addAudit("owner", "ID rule confirmed", store.hotel.idRule);
    return "Understood. Guest check-in will require phone/email lookup, ID photo capture, consent, then staff-visible check-in status.";
  }

  addAudit("owner", "Setup chat message", message);
  return "I will configure this as a paid-client setup: hotel profile, rooms and rates, Google Sheets connector, guest check-in rules, ID capture, and admin monitoring.";
}

export function lookupWelcomeGuest(identifier: string): WelcomeLookupResult {
  const normalized = normalizeIdentifier(identifier);
  const reservation = getSolutionStore().reservations.find((candidate) => {
    return (
      normalizeIdentifier(candidate.phone) === normalized ||
      candidate.email.toLowerCase() === identifier.trim().toLowerCase() ||
      candidate.bookingId.toLowerCase() === identifier.trim().toLowerCase()
    );
  });

  if (!reservation) {
    addAudit("guest", "Guest lookup failed", `No reservation found for ${identifier}.`);
    return {
      ok: false,
      message: "We could not find a reservation with that mobile number, email, or booking ID.",
    };
  }

  addAudit("guest", "Guest reservation found", `${reservation.guestName} matched ${reservation.bookingId}.`);
  return {
    ok: true,
    message: `Found reservation for ${reservation.guestName}. Please capture a physical ID photo to continue check-in.`,
    reservation,
  };
}

export function captureGuestId(args: {
  bookingId: string;
  fileName: string;
  consent: boolean;
}): WelcomeLookupResult {
  const reservation = getSolutionStore().reservations.find(
    (candidate) => candidate.bookingId.toLowerCase() === args.bookingId.toLowerCase(),
  );

  if (!reservation) {
    return { ok: false, message: "Booking ID was not found." };
  }

  if (!args.consent) {
    reservation.status = "Manual Review";
    reservation.idCaptureStatus = "manual_review";
    addAudit("guest", "ID consent missing", `${reservation.guestName} did not acknowledge ID capture.`);
    return {
      ok: false,
      message: "ID capture needs guest consent. Staff review is required.",
      reservation,
    };
  }

  reservation.idCaptureStatus = "captured";
  reservation.idPhotoName = args.fileName || "physical-id-photo";
  reservation.idCapturedAt = now();
  reservation.status = "Checked In";
  reservation.checkedInAt = now();
  addAudit("guest", "Guest checked in", `${reservation.guestName} uploaded ID metadata and checked in to room ${reservation.roomNumber}.`);

  return {
    ok: true,
    message: `Check-in complete. Room ${reservation.roomNumber} is ready. Staff can see the ID capture log in admin.`,
    reservation,
  };
}

export function listSolutionConnectors() {
  return getSolutionStore().connectors;
}

export function updateSolutionConnectorStatus(connectorId: string, status: SolutionConnector["status"], detail?: string) {
  const connector = getSolutionStore().connectors.find((candidate) => candidate.id === connectorId);
  if (!connector) return undefined;

  connector.status = status;
  connector.description = detail?.trim() || connector.description;
  connector.lastSync = status === "connected" ? "Just now" : connector.lastSync;
  addAudit("system", "Connector status updated", `${connector.name} is now ${status}.`);
  return connector;
}

export function lookupSolutionGuestsByContact(input: { phone?: string; email?: string }) {
  const phone = input.phone ? normalizeIdentifier(input.phone) : "";
  const email = input.email?.trim().toLowerCase();

  return getSolutionStore().reservations.filter((reservation) => {
    return (
      (phone && normalizeIdentifier(reservation.phone) === phone) ||
      (email && reservation.email.toLowerCase() === email)
    );
  });
}

export function listSolutionIdCaptures() {
  return getSolutionStore().reservations
    .filter((reservation) => reservation.idCaptureStatus !== "not_requested")
    .map((reservation) => ({
      id: `${reservation.bookingId}-id`,
      reservationId: reservation.bookingId,
      guestName: reservation.guestName,
      status: reservation.idCaptureStatus,
      fileName: reservation.idPhotoName,
      capturedAt: reservation.idCapturedAt,
    }));
}

export function updateSolutionCheckInStatus(bookingId: string, status: SolutionReservation["status"]) {
  const reservation = getSolutionStore().reservations.find(
    (candidate) => candidate.bookingId.toLowerCase() === bookingId.toLowerCase(),
  );
  if (!reservation) return undefined;

  reservation.status = status;
  if (status === "Checked In" && !reservation.checkedInAt) {
    reservation.checkedInAt = now();
  }
  addAudit("system", "Reservation status updated", `${reservation.guestName} is now ${status}.`);
  return reservation;
}
