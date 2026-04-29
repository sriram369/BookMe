import { NextResponse } from "next/server";
import { seedGoogleSheetsDemo } from "@/lib/connectors/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  const result = await seedGoogleSheetsDemo();
  return NextResponse.json(result, { status: result.ok ? 200 : 400 });
}
