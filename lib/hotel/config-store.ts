import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OwnerProposal } from "@/lib/onboarding/proposal";
import {
  getBookMeHotelFromSupabase,
  listBookMeHotelsFromSupabase,
  upsertBookMeHotelToSupabase,
  type BookMeDbHotel,
} from "@/lib/db/bookme";

export type HotelRoomConfig = {
  type: string;
  count: string;
  rate: string;
};

export type HotelConfig = {
  slug: string;
  hotelName: string;
  city: string;
  checkinWindow: string;
  escalationContact: string;
  gstin: string;
  sourceSystem: string;
  roomTypes: HotelRoomConfig[];
  totalRooms: number;
  photoName?: string;
  proposal?: OwnerProposal;
  createdAt: string;
  updatedAt: string;
};

type HotelConfigStore = {
  hotels: HotelConfig[];
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "bookme-hotels.json");

const canUseLocalFileStore = () => process.env.NODE_ENV !== "production" && !process.env.VERCEL;

const defaultHotel: HotelConfig = {
  slug: "sriram-hotel",
  hotelName: "Sriram Hotel Chennai",
  city: "T. Nagar, Chennai",
  checkinWindow: "12:00 PM to 11:00 PM",
  escalationContact: "+91 98765 43210",
  gstin: "Optional for pilot",
  sourceSystem: "Google Sheets or Excel",
  roomTypes: [
    { type: "Deluxe AC", count: "24", rate: "3499" },
    { type: "Executive King", count: "12", rate: "4999" },
    { type: "Family Suite", count: "6", rate: "7499" },
  ],
  totalRooms: 42,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export function slugifyHotelName(name: string) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  return slug || "hotel";
}

async function readStore(): Promise<HotelConfigStore> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as HotelConfigStore;
    return { hotels: parsed.hotels?.length ? parsed.hotels : [defaultHotel] };
  } catch {
    return { hotels: [defaultHotel] };
  }
}

async function writeStore(store: HotelConfigStore) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(store, null, 2)}\n`);
}

function fromDbHotel(hotel: BookMeDbHotel): HotelConfig {
  return {
    slug: hotel.slug,
    hotelName: hotel.hotelName,
    city: hotel.city,
    checkinWindow: hotel.checkinWindow,
    escalationContact: hotel.escalationContact,
    gstin: hotel.gstin,
    sourceSystem: hotel.sourceSystem,
    roomTypes: hotel.roomTypes,
    totalRooms: hotel.totalRooms,
    photoName: hotel.photoName ?? undefined,
    proposal: hotel.proposal ?? undefined,
    createdAt: hotel.createdAt,
    updatedAt: hotel.updatedAt,
  };
}

export async function listHotelConfigs() {
  try {
    const hotels = await listBookMeHotelsFromSupabase();
    if (hotels?.length) return hotels.map(fromDbHotel);
  } catch (error) {
    console.warn(error);
  }

  const store = await readStore();
  return store.hotels;
}

export async function getHotelConfig(slug = "sriram-hotel") {
  const requestedSlug = slug;
  try {
    const hotel = await getBookMeHotelFromSupabase(requestedSlug);
    if (hotel) {
      return fromDbHotel(hotel);
    }
  } catch (error) {
    console.warn(error);
  }

  const store = await readStore();
  return store.hotels.find((hotel) => hotel.slug === requestedSlug) ?? store.hotels[0] ?? defaultHotel;
}

export async function findHotelConfig(slug: string) {
  try {
    const hotel = await getBookMeHotelFromSupabase(slug);
    if (hotel) return fromDbHotel(hotel);
  } catch (error) {
    console.warn(error);
  }

  const store = await readStore();
  return store.hotels.find((hotel) => hotel.slug === slug) ?? null;
}

export async function saveHotelConfig(input: Omit<HotelConfig, "slug" | "createdAt" | "updatedAt"> & { slug?: string }) {
  const now = new Date().toISOString();
  const slug = input.slug ?? slugifyHotelName(input.hotelName);
  const existing = await getHotelConfig(slug);
  const hasExisting = existing.slug === slug;
  const hotel: HotelConfig = {
    ...input,
    slug,
    createdAt: hasExisting ? existing.createdAt : now,
    updatedAt: now,
  };

  try {
    const saved = await upsertBookMeHotelToSupabase(hotel);
    if (saved) return fromDbHotel(saved);
  } catch (error) {
    console.warn(error);
  }

  if (!canUseLocalFileStore()) {
    throw new Error("Hotel persistence is not configured. Set Supabase env vars before hosting BookMe.");
  }

  const store = await readStore();
  const localExisting = store.hotels.find((candidate) => candidate.slug === slug);
  const hotels = localExisting
    ? store.hotels.map((candidate) => (candidate.slug === slug ? hotel : candidate))
    : [hotel, ...store.hotels];

  await writeStore({ hotels });
  return hotel;
}
