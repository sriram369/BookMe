import { NextResponse } from "next/server";
import { generateOwnerProposal } from "@/lib/onboarding/proposal";
import { validateOwnerProposalInput } from "@/lib/onboarding/validation";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const input = validateOwnerProposalInput(body);

  if (!input.ok) {
    return NextResponse.json({ error: "Invalid proposal input", errors: input.errors }, { status: 400 });
  }

  const proposal = await generateOwnerProposal(input.value);

  return NextResponse.json({ proposal });
}
