export type RoomType = "queen" | "king" | "suite";

export type ReservationStatus = "Confirmed" | "Checked In" | "Checked Out";

export type Room = {
  roomId: string;
  roomType: RoomType;
  label: string;
  pricePerNight: number;
  floor: number;
  view: string;
  maxGuests: number;
  isActive: boolean;
};

export type Reservation = {
  bookingId: string;
  guestName: string;
  phone: string;
  email: string;
  roomId: string;
  checkin: string;
  checkout: string;
  status: ReservationStatus;
  createdAt: string;
  checkedInAt?: string;
  checkedOutAt?: string;
};

export type SummaryCard = {
  kind: "booking" | "checkin" | "checkout" | "info";
  title: string;
  status: string;
  fields: Array<{ label: string; value: string }>;
};

export type ToolResult = {
  ok: boolean;
  message: string;
  card?: SummaryCard;
  data?: unknown;
};

