import type { Reservation, Room } from "./types";

type BookMeStore = {
  rooms: Room[];
  reservations: Reservation[];
  nextBookingNumber: number;
};

const today = new Date().toISOString().slice(0, 10);
const plusDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const initialStore = (): BookMeStore => ({
  nextBookingNumber: 1048,
  rooms: [
    {
      roomId: "214",
      roomType: "queen",
      label: "Queen Room 214",
      pricePerNight: 145,
      floor: 2,
      view: "Courtyard",
      maxGuests: 2,
      isActive: true,
    },
    {
      roomId: "418",
      roomType: "king",
      label: "King Room 418",
      pricePerNight: 185,
      floor: 4,
      view: "City",
      maxGuests: 2,
      isActive: true,
    },
    {
      roomId: "501",
      roomType: "suite",
      label: "Corner Suite 501",
      pricePerNight: 310,
      floor: 5,
      view: "Skyline",
      maxGuests: 4,
      isActive: true,
    },
  ],
  reservations: [
    {
      bookingId: "BKM-1038",
      guestName: "James Lee",
      phone: "6175550192",
      email: "james@example.com",
      roomId: "214",
      checkin: today,
      checkout: plusDays(3),
      status: "Confirmed",
      createdAt: plusDays(-8),
    },
    {
      bookingId: "BKM-1029",
      guestName: "Maya Chen",
      phone: "6175550144",
      email: "maya@example.com",
      roomId: "501",
      checkin: plusDays(-3),
      checkout: today,
      status: "Checked In",
      createdAt: plusDays(-12),
      checkedInAt: plusDays(-3),
    },
    {
      bookingId: "BKM-1041",
      guestName: "Priya Sharma",
      phone: "6175550188",
      email: "priya@example.com",
      roomId: "418",
      checkin: plusDays(4),
      checkout: plusDays(6),
      status: "Confirmed",
      createdAt: plusDays(-1),
    },
  ],
});

const globalForStore = globalThis as typeof globalThis & {
  __bookmeStore?: BookMeStore;
};

export function getStore() {
  if (!globalForStore.__bookmeStore) {
    globalForStore.__bookmeStore = initialStore();
  }

  return globalForStore.__bookmeStore;
}

export function resetStoreForTests() {
  globalForStore.__bookmeStore = initialStore();
}

