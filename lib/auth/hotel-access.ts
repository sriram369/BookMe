import "server-only";

import {
  countBookMeHotelMembershipsFromSupabase,
  getBookMeHotelMembershipFromSupabase,
  upsertBookMeHotelMembershipToSupabase,
  type BookMeHotelMembership,
  type BookMeHotelRole,
} from "@/lib/db/bookme";

const ADMIN_ROLES = new Set<BookMeHotelRole>(["owner", "admin", "staff"]);

function shouldAllowOwnerBootstrap() {
  const explicit = process.env.BOOKME_ALLOW_OWNER_BOOTSTRAP?.trim().toLowerCase();
  if (explicit) {
    return ["1", "true", "yes"].includes(explicit);
  }

  return process.env.NODE_ENV !== "production" && !process.env.VERCEL;
}

export type HotelAccessResult =
  | { ok: true; mode: "local-demo" | "membership"; membership?: BookMeHotelMembership }
  | { ok: false; reason: "missing_user" | "not_member" | "membership_store_unavailable" };

export async function requireHotelAdminAccess(input: {
  hotelSlug: string;
  userEmail?: string | null;
  authMode: "oauth" | "local-demo";
}): Promise<HotelAccessResult> {
  if (input.authMode === "local-demo") {
    return { ok: true, mode: "local-demo" };
  }

  const userEmail = input.userEmail?.trim().toLowerCase();
  if (!userEmail) {
    return { ok: false, reason: "missing_user" };
  }

  const membership = await getBookMeHotelMembershipFromSupabase(input.hotelSlug, userEmail);
  if (membership && ADMIN_ROLES.has(membership.role)) {
    return { ok: true, mode: "membership", membership };
  }

  const membershipCount = await countBookMeHotelMembershipsFromSupabase(input.hotelSlug);
  if (membershipCount === 0 && shouldAllowOwnerBootstrap()) {
    const bootstrapped = await upsertBookMeHotelMembershipToSupabase({
      hotelSlug: input.hotelSlug,
      userEmail,
      role: "owner",
    });

    if (bootstrapped) {
      return { ok: true, mode: "membership", membership: bootstrapped };
    }
  }

  if (membershipCount === 0) {
    return { ok: false, reason: "membership_store_unavailable" };
  }

  return { ok: false, reason: "not_member" };
}

