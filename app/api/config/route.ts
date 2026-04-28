import { NextResponse } from "next/server";
import { getConfigStatus } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(getConfigStatus());
}
