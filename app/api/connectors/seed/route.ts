import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { seedGoogleSheetsDemo } from "@/lib/connectors/seed";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => undefined);
  const reset = body?.reset === true || body?.mode === "reset";
  const result = await seedGoogleSheetsDemo({ reset });
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
