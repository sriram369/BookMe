import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";
import { getAuthSecret, hasConfiguredOAuthProviders } from "@/lib/auth/config";

export async function middleware(request: NextRequest) {
  if (!hasConfiguredOAuthProviders()) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret: getAuthSecret(),
  });

  if (token) {
    return NextResponse.next();
  }

  const signInUrl = new URL("/signin", request.url);
  signInUrl.searchParams.set("callbackUrl", `${request.nextUrl.pathname}${request.nextUrl.search}`);

  return NextResponse.redirect(signInUrl);
}

export const config = {
  matcher: ["/admin/:path*", "/onboarding/:path*", "/solution/:path*"],
};
