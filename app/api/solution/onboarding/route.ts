import { NextResponse } from "next/server";
import { ownerOnboardingReply, solutionDashboard } from "@/lib/solution/store";

export async function POST(request: Request) {
  const body = (await request.json()) as { message?: string };
  const reply = ownerOnboardingReply(body.message ?? "");

  return NextResponse.json({
    reply,
    dashboard: solutionDashboard(),
  });
}
