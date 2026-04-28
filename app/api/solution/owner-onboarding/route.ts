import { NextResponse } from "next/server";
import { ownerOnboardingReply, solutionDashboard } from "@/lib/solution/store";

export async function GET() {
  return NextResponse.json({ session: solutionDashboard() });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { content?: string };
  const content = String(body.content ?? "");

  if (!content.trim()) {
    return NextResponse.json({ error: "content is required" }, { status: 400 });
  }

  return NextResponse.json({
    reply: ownerOnboardingReply(content),
    session: solutionDashboard(),
  });
}
