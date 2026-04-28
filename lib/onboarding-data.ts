import {
  BadgeIndianRupee,
  BedDouble,
  Bot,
  Camera,
  FileSpreadsheet,
  Hotel,
  KeyRound,
  MessageCircle,
  PlugZap,
  ShieldCheck,
} from "lucide-react";

export const hotelSystems = [
  "Google Sheets or Excel",
  "eZee Absolute / eZee FrontDesk",
  "Hotelogix",
  "Cloudbeds",
  "Booking.com / Agoda / MakeMyTrip extranets",
  "WhatsApp reservation log",
  "Manual front-desk register",
];

export const onboardingSteps = [
  {
    label: "Hotel profile",
    title: "Tell BookMe what property this is.",
    body: "Name, city, room count, check-in window, GST details, and front-desk escalation contact.",
    icon: Hotel,
  },
  {
    label: "Connect data",
    title: "Connect the reservation source of truth.",
    body: "Start with Google Sheets for the MVP. Add PMS and OTA connectors as the hotel grows.",
    icon: FileSpreadsheet,
  },
  {
    label: "Room inventory",
    title: "Add rooms by typing or uploading photos.",
    body: "Owners can type room types and rates, or upload room/menu-board photos for AI-assisted extraction.",
    icon: Camera,
  },
  {
    label: "Automation rules",
    title: "Decide what AI can complete by itself.",
    body: "Booking, check-in, checkout, WhatsApp handoff, refunds blocked, and staff escalation rules.",
    icon: Bot,
  },
];

export const indiaAutomationRules = [
  {
    title: "Check-in",
    body: "Verify booking, collect required ID details, respect hotel check-in time, and update status.",
    icon: KeyRound,
  },
  {
    title: "Checkout",
    body: "Close stay, calculate nights and room charges, then issue a summary without touching payments.",
    icon: BadgeIndianRupee,
  },
  {
    title: "Reservations",
    body: "Quote availability from live inventory and create bookings only after explicit guest confirmation.",
    icon: BedDouble,
  },
  {
    title: "Human handoff",
    body: "Escalate cancellations, refunds, disputes, group bookings, accessibility requests, and VIP cases.",
    icon: ShieldCheck,
  },
  {
    title: "WhatsApp first",
    body: "Many India hotels already run guest comms on WhatsApp, so BookMe should support web plus WhatsApp.",
    icon: MessageCircle,
  },
  {
    title: "Connector layer",
    body: "Sheets first, then PMS/OTA adapters behind the same reservation tools.",
    icon: PlugZap,
  },
];

export const pricingPlans = [
  {
    name: "Pilot",
    price: "₹9,999/mo",
    note: "For one demo property",
    features: ["Guest web AI front desk", "Google Sheets backend", "Booking + check-in + checkout", "Basic admin dashboard"],
  },
  {
    name: "Growth",
    price: "₹24,999/mo",
    note: "For 50-150 room hotels",
    features: ["Everything in Pilot", "WhatsApp automation", "Room photo extraction", "Monthly workflow tuning", "Priority support"],
  },
  {
    name: "Managed",
    price: "₹49,999+/mo",
    note: "For PMS-connected hotels",
    features: ["PMS/OTA integrations", "Custom hotel website", "Audit logs and evals", "Dedicated setup support"],
  },
];
