export type OwnerProposalInput = {
  hotelName: string;
  city: string;
  sourceSystem: string;
  totalRooms: number;
  roomTypes: Array<{
    type: string;
    count: string;
    rate: string;
  }>;
};

export type OwnerProposal = {
  recommendedPlan: "Pilot" | "Growth" | "Managed";
  monthlyPrice: string;
  setupFee: string;
  summary: string;
  rollout: string[];
  risks: string[];
};

function openRouterTimeoutSignal() {
  const timeoutMs = Number(process.env.OPENROUTER_TIMEOUT_MS ?? 15000);
  return AbortSignal.timeout(Number.isFinite(timeoutMs) && timeoutMs > 0 ? timeoutMs : 15000);
}

function fallbackProposal(input: OwnerProposalInput): OwnerProposal {
  const needsManaged = /hotelogix|cloudbeds|ezee|booking|agoda|makemytrip/i.test(input.sourceSystem);
  const plan = needsManaged ? "Managed" : input.totalRooms >= 50 ? "Growth" : "Pilot";

  return {
    recommendedPlan: plan,
    monthlyPrice: plan === "Pilot" ? "₹9,999/mo" : plan === "Growth" ? "₹24,999/mo" : "₹49,999+/mo",
    setupFee: plan === "Pilot" ? "₹14,999 one-time" : plan === "Growth" ? "₹29,999 one-time" : "Custom",
    summary: `${input.hotelName || "This hotel"} can start with BookMe as a web AI front desk connected to ${input.sourceSystem}. The first rollout should automate bookings, check-ins, and checkout summaries while sending refunds, disputes, and payment issues to staff.`,
    rollout: [
      "Week 1: map reservation sheet, room inventory, check-in rules, and escalation numbers.",
      "Week 2: launch guest web demo for booking, check-in, and checkout.",
      "Week 3: add WhatsApp handoff and tune prompts from live guest messages.",
    ],
    risks: [
      "Payments and refunds should stay out of AI automation until the hotel approves a payment provider.",
      "ID/KYC requirements must follow the property policy and local rules.",
      "PMS or OTA integrations need a separate connector review before production.",
    ],
  };
}

export async function generateOwnerProposal(input: OwnerProposalInput): Promise<OwnerProposal> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return fallbackProposal(input);
  }

  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: openRouterTimeoutSignal(),
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title": "BookMe",
      },
      body: JSON.stringify({
        model: process.env.OPENROUTER_MODEL ?? "openrouter/free",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "You price and scope BookMe for mid-market hotels in India. Return only compact JSON with recommendedPlan, monthlyPrice, setupFee, summary, rollout array, and risks array. Be practical and do not claim integrations are live unless the source system is Google Sheets.",
          },
          {
            role: "user",
            content: JSON.stringify(input),
          },
        ],
      }),
    });
  } catch {
    return fallbackProposal(input);
  }

  if (!response.ok) {
    return fallbackProposal(input);
  }

  let data: {
    choices?: Array<{ message?: { content?: string | null } }>;
  };
  try {
    data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string | null } }>;
    };
  } catch {
    return fallbackProposal(input);
  }

  try {
    const parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as Partial<OwnerProposal>;
    if (!parsed.recommendedPlan || !parsed.monthlyPrice || !parsed.summary) {
      return fallbackProposal(input);
    }

    return {
      recommendedPlan: parsed.recommendedPlan,
      monthlyPrice: parsed.monthlyPrice,
      setupFee: parsed.setupFee ?? "Custom",
      summary: parsed.summary,
      rollout: parsed.rollout?.slice(0, 4) ?? fallbackProposal(input).rollout,
      risks: parsed.risks?.slice(0, 4) ?? fallbackProposal(input).risks,
    };
  } catch {
    return fallbackProposal(input);
  }
}
