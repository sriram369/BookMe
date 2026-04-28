import "server-only";

type SupabaseKeyType = "service_role" | "anon";

export type SupabaseServerConfig = {
  url: string;
  key: string;
  keyType: SupabaseKeyType;
};

export type SupabaseRestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: string;
  body?: unknown;
  prefer?: string;
};

function cleanEnvValue(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function cleanSupabaseUrl(value: string | undefined) {
  return cleanEnvValue(value)?.replace(/\/+$/, "");
}

export function getSupabaseServerConfig(env: NodeJS.ProcessEnv = process.env): SupabaseServerConfig | null {
  const url = cleanSupabaseUrl(env.SUPABASE_URL ?? env.NEXT_PUBLIC_SUPABASE_URL);
  const serviceRoleKey = cleanEnvValue(env.SUPABASE_SERVICE_ROLE_KEY);

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    key: serviceRoleKey,
    keyType: "service_role",
  };
}

export function hasSupabaseServerConfig(env: NodeJS.ProcessEnv = process.env) {
  return getSupabaseServerConfig(env) !== null;
}

export async function supabaseRest<T>(table: string, options: SupabaseRestOptions = {}): Promise<T | null> {
  const config = getSupabaseServerConfig();

  if (!config) {
    return null;
  }

  const query = options.query ? `?${options.query}` : "";
  const response = await fetch(`${config.url}/rest/v1/${table}${query}`, {
    method: options.method ?? "GET",
    headers: {
      apikey: config.key,
      Authorization: `Bearer ${config.key}`,
      "Content-Type": "application/json",
      ...(options.prefer ? { Prefer: options.prefer } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`Supabase ${table} request failed: ${response.status} ${response.statusText}`);
  }

  if (response.status === 204) {
    return null;
  }

  return (await response.json()) as T;
}
