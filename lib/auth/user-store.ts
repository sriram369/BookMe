import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { upsertBookMeUserToSupabase } from "@/lib/db/bookme";

export type BookMeUser = {
  email: string;
  name?: string | null;
  image?: string | null;
  provider?: string;
  createdAt: string;
  updatedAt: string;
};

type UserStore = {
  users: BookMeUser[];
};

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "bookme-users.json");
const canUseLocalFileStore = () => process.env.NODE_ENV !== "production" && !process.env.VERCEL;

async function readStore(): Promise<UserStore> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as UserStore;
    return { users: parsed.users ?? [] };
  } catch {
    return { users: [] };
  }
}

async function writeStore(store: UserStore) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dataFile, `${JSON.stringify(store, null, 2)}\n`);
}

async function saveBookMeUserToLocalStore(input: {
  email: string;
  name?: string | null;
  image?: string | null;
  provider?: string;
}) {
  const store = await readStore();
  const now = new Date().toISOString();
  const existing = store.users.find((user) => user.email.toLowerCase() === input.email.toLowerCase());
  const user: BookMeUser = {
    email: input.email,
    name: input.name,
    image: input.image,
    provider: input.provider,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  const users = existing
    ? store.users.map((candidate) => (candidate.email.toLowerCase() === user.email.toLowerCase() ? user : candidate))
    : [user, ...store.users];

  await writeStore({ users });
  return user;
}

export async function saveBookMeUser(input: {
  email?: string | null;
  name?: string | null;
  image?: string | null;
  provider?: string;
}) {
  if (!input.email) return null;

  try {
    const supabaseUser = await upsertBookMeUserToSupabase({
      email: input.email,
      name: input.name,
      image: input.image,
      provider: input.provider,
    });

    if (supabaseUser) {
      return supabaseUser;
    }
  } catch (error) {
    console.warn(error);
  }

  if (!canUseLocalFileStore()) {
    console.warn("BookMe user persistence is not configured. Set Supabase env vars before hosting BookMe.");
    return null;
  }

  return saveBookMeUserToLocalStore({
    email: input.email,
    name: input.name,
    image: input.image,
    provider: input.provider,
  });
}
