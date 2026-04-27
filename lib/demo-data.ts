import {
  BedDouble,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  KeyRound,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";

export const operatorStats = [
  { label: "Guest workflows", value: "3", detail: "Book, check in, check out" },
  { label: "Demo handling time", value: "<2m", detail: "From message to confirmation" },
  { label: "Front-desk coverage", value: "24/7", detail: "After-hours self-service" },
];

export const workflowCards = [
  {
    title: "Book a stay",
    body: "Guests describe dates and preferences. BookMe checks inventory before creating a reservation.",
    icon: CalendarCheck,
  },
  {
    title: "Check in",
    body: "Guests verify by phone, email, or booking ID. BookMe updates status and returns the room.",
    icon: KeyRound,
  },
  {
    title: "Check out",
    body: "BookMe closes the stay, calculates nights and total charge, and shows a receipt card.",
    icon: CircleDollarSign,
  },
];

export const productMessages = [
  { role: "guest", text: "Hi, I have a booking under 617-555-0192. Can I check in?" },
  { role: "agent", text: "I found your reservation for tonight. I can check you in now." },
  { role: "system", text: "lookup_guest -> checkin_guest" },
];

export const demoMessages = [
  {
    role: "guest",
    text: "I need a quiet king room for two nights starting April 25.",
  },
  {
    role: "agent",
    text: "I found a king room on floor 4 for $145/night. Would you like me to hold it?",
  },
  {
    role: "guest",
    text: "Yes, book it for Priya Sharma.",
  },
  {
    role: "agent",
    text: "Booked. Your confirmation is BKM-1047.",
  },
];

export const reservationSummary = {
  id: "BKM-1047",
  guest: "Priya Sharma",
  room: "King Room 418",
  dates: "Apr 25 - Apr 27",
  price: "$290 total",
  status: "Confirmed",
};

export const adminRows = [
  ["BKM-1047", "Priya Sharma", "King 418", "Confirmed", "$290"],
  ["BKM-1038", "James Lee", "Queen 214", "Checked In", "$435"],
  ["BKM-1029", "Maya Chen", "Suite 501", "Checked Out", "$620"],
];

export const trustItems = [
  { label: "Tool-grounded answers", icon: ShieldCheck },
  { label: "Live room inventory", icon: BedDouble },
  { label: "Human-ready handoff", icon: MessageSquareText },
  { label: "Timestamped status changes", icon: Clock3 },
  { label: "Confirmation cards", icon: CheckCircle2 },
];
