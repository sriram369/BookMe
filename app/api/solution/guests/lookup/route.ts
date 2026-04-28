import { NextResponse } from "next/server";
import { lookupSolutionGuestsByContact } from "@/lib/solution/store";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const phone = url.searchParams.get("phone") ?? undefined;
  const email = url.searchParams.get("email") ?? undefined;

  if (!phone && !email) {
    return NextResponse.json({ error: "phone or email is required" }, { status: 400 });
  }

  return NextResponse.json({ guests: lookupSolutionGuestsByContact({ phone, email }) });
}

export async function POST(request: Request) {
  const body = (await request.json()) as { phone?: string; email?: string };

  if (!body.phone && !body.email) {
    return NextResponse.json({ error: "phone or email is required" }, { status: 400 });
  }

  return NextResponse.json({ guests: lookupSolutionGuestsByContact({ phone: body.phone, email: body.email }) });
}
