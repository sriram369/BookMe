export type ConnectorStatus = "connected" | "needs_credentials" | "planned" | "manual_review";

export type SolutionConnector = {
  id: string;
  name: string;
  kind: "sheet" | "pms" | "ota" | "whatsapp";
  status: ConnectorStatus;
  description: string;
  lastSync: string;
};

export type SolutionRoomType = {
  id: string;
  name: string;
  count: number;
  baseRateInr: number;
};

export type SolutionReservationStatus = "Confirmed" | "ID Pending" | "Checked In" | "Manual Review" | "Checked Out";

export type SolutionReservation = {
  bookingId: string;
  guestName: string;
  phone: string;
  email: string;
  roomType: string;
  roomNumber: string;
  checkin: string;
  checkout: string;
  status: SolutionReservationStatus;
  idCaptureStatus: "not_requested" | "captured" | "manual_review";
  idPhotoName?: string;
  idCapturedAt?: string;
  checkedInAt?: string;
};

export type SolutionHotelConfig = {
  hotelName: string;
  location: string;
  totalRooms: number;
  checkinWindow: string;
  escalationContact: string;
  idRule: string;
  setupStage: "draft" | "connectors" | "ready";
};

export type SolutionAuditEvent = {
  id: string;
  at: string;
  actor: "owner" | "guest" | "system";
  title: string;
  detail: string;
};

export type SolutionDashboard = {
  hotel: SolutionHotelConfig;
  connectors: SolutionConnector[];
  rooms: SolutionRoomType[];
  reservations: SolutionReservation[];
  auditLog: SolutionAuditEvent[];
};

export type WelcomeLookupResult = {
  ok: boolean;
  message: string;
  reservation?: SolutionReservation;
};
