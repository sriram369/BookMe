export type OAuthProviderStatus = {
  google: boolean;
  github: boolean;
};

export type ConfigStatus = {
  auth: {
    mode: "oauth" | "local-demo";
    protectedRoutes: boolean;
    nextAuthSecret: boolean;
    providers: OAuthProviderStatus;
  };
  supabase: {
    configured: boolean;
    table: string;
    missing: string[];
  };
  sheets: {
    configured: boolean;
    missing: string[];
  };
  openRouter: {
    configured: boolean;
    model: string;
    missing: string[];
  };
};

export type OAuthProviderCredentials = {
  google?: {
    clientId: string;
    clientSecret: string;
  };
  github?: {
    clientId: string;
    clientSecret: string;
  };
};

export const localAuthSecret = "bookme-local-dev-secret-change-before-production";

function hasEnv(name: string) {
  return Boolean(process.env[name]?.trim());
}

function missingEnv(names: string[]) {
  return names.filter((name) => !hasEnv(name));
}

export function getOAuthProviderCredentials(): OAuthProviderCredentials {
  const credentials: OAuthProviderCredentials = {};

  if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
    credentials.google = {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    };
  }

  if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
    credentials.github = {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    };
  }

  return credentials;
}

export function getOAuthProviderStatus(): OAuthProviderStatus {
  const credentials = getOAuthProviderCredentials();

  return {
    google: Boolean(credentials.google),
    github: Boolean(credentials.github),
  };
}

export function hasConfiguredOAuthProviders() {
  const providers = getOAuthProviderStatus();
  return providers.google || providers.github;
}

export function getAuthSecret() {
  const secret = process.env.NEXTAUTH_SECRET?.trim();

  if (secret) {
    return secret;
  }

  if (hasConfiguredOAuthProviders() && process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required when OAuth providers are configured in production.");
  }

  return localAuthSecret;
}

export function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim() || process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SECRET_KEY?.trim() || process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceRoleKey) {
    return null;
  }

  return {
    url,
    serviceRoleKey,
  };
}

export function getConfigStatus(): ConfigStatus {
  const providers = getOAuthProviderStatus();
  const oauthConfigured = providers.google || providers.github;
  const supabaseMissing = [
    ...(hasEnv("SUPABASE_URL") || hasEnv("NEXT_PUBLIC_SUPABASE_URL") ? [] : ["NEXT_PUBLIC_SUPABASE_URL"]),
    ...(hasEnv("SUPABASE_SECRET_KEY") || hasEnv("SUPABASE_SERVICE_ROLE_KEY") ? [] : ["SUPABASE_SECRET_KEY"]),
  ];
  const sheetsMissing = missingEnv([
    "GOOGLE_SHEETS_SERVICE_ACCOUNT_EMAIL",
    "GOOGLE_SHEETS_PRIVATE_KEY",
    "GOOGLE_SHEETS_SPREADSHEET_ID",
  ]);
  const openRouterMissing = missingEnv(["OPENROUTER_API_KEY"]);

  return {
    auth: {
      mode: oauthConfigured ? "oauth" : "local-demo",
      protectedRoutes: oauthConfigured,
      nextAuthSecret: hasEnv("NEXTAUTH_SECRET"),
      providers,
    },
    supabase: {
      configured: supabaseMissing.length === 0,
      table: "bookme_users, bookme_hotels, bookme_audit_events",
      missing: supabaseMissing,
    },
    sheets: {
      configured: sheetsMissing.length === 0,
      missing: sheetsMissing,
    },
    openRouter: {
      configured: openRouterMissing.length === 0,
      model: process.env.OPENROUTER_MODEL?.trim() || "openrouter/free",
      missing: openRouterMissing,
    },
  };
}
