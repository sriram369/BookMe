import { NextResponse } from "next/server";
import { solutionDashboard } from "@/lib/solution/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(solutionDashboard());
}
