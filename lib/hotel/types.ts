export type RoomType = "queen" | "king" | "suite";

export type ReservationStatus = "Confirmed" | "Checked In" | "Checked Out";

export type PaymentStatus = "pending" | "pay_at_property" | "paid" | "failed" | "refunded";

export type PaymentMode = "pay_at_property" | "online_placeholder" | "cash" | "card" | "upi" | "payment_link";

export type PaymentProvider = "manual" | "razorpay" | "cashfree" | "stripe" | "google_pay";

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
  idempotencyKey?: string;
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
  paymentStatus?: PaymentStatus;
  paymentMode?: PaymentMode;
  paymentProvider?: PaymentProvider;
  paymentReference?: string;
  payAtProperty?: boolean;
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
