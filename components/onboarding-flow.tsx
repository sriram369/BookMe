"use client";

import { useMemo, useState } from "react";
import {
  ArrowRight,
  Camera,
  Check,
  FileSpreadsheet,
  Hotel,
  IndianRupee,
  MessageSquareText,
  PlugZap,
  Send,
  Upload,
} from "lucide-react";
import { hotelSystems, indiaAutomationRules, onboardingSteps, pricingPlans } from "@/lib/onboarding-data";
import type { OwnerProposal } from "@/lib/onboarding/proposal";
import type { HotelConfig } from "@/lib/hotel/config-store";

const defaultRooms = [
  { type: "Deluxe AC", count: "24", rate: "3499" },
  { type: "Executive King", count: "12", rate: "4999" },
  { type: "Family Suite", count: "6", rate: "7499" },
];

type OnboardingMessage = {
  role: "assistant" | "owner";
  content: string;
};

const onboardingQuestions = [
  "What is your hotel name?",
  "Which city or locality is it in?",
  "Where do your bookings live today: Google Sheets, PMS, OTA extranet, WhatsApp, or manual register?",
  "What room types, counts, and base rates should we start with?",
  "What is your normal check-in window?",
  "What phone number should BookMe use when it needs staff help?",
];

export function OnboardingFlow() {
  const [hotelName, setHotelName] = useState("Sriram Hotel Chennai");
  const [city, setCity] = useState("T. Nagar, Chennai");
  const [checkinWindow, setCheckinWindow] = useState("12:00 PM to 11:00 PM");
  const [escalationContact, setEscalationContact] = useState("+91 98765 43210");
  const [gstin, setGstin] = useState("Optional for pilot");
  const [activeSystem, setActiveSystem] = useState("Google Sheets or Excel");
  const [rooms, setRooms] = useState(defaultRooms);
  const [photoName, setPhotoName] = useState("");
  const [proposal, setProposal] = useState<OwnerProposal | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [formError, setFormError] = useState("");
  const [savedHotel, setSavedHotel] = useState<HotelConfig | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<OnboardingMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome. I will set up the hotel website, reservation source, room inventory, automation rules, and owner dashboard. What is your hotel name?",
    },
  ]);

  const totalRooms = useMemo(
    () => rooms.reduce((sum, room) => sum + Number(room.count || 0), 0),
    [rooms],
  );

  async function generateProposal() {
    setFormError("");
    setIsGenerating(true);
    try {
      const response = await fetch("/api/onboarding/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName,
          city,
          sourceSystem: activeSystem,
          totalRooms,
          roomTypes: rooms,
        }),
      });

      const data = (await response.json()) as { proposal?: OwnerProposal; errors?: string[]; error?: string };
      if (!response.ok) {
        setFormError(data.errors?.join(" ") || data.error || "Could not generate proposal.");
        return;
      }

      setProposal(data.proposal ?? null);
    } catch {
      setFormError("Could not reach the proposal service. Try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  async function saveSetup() {
    setFormError("");
    setIsGenerating(true);
    try {
      let activeProposal = proposal;

      if (!activeProposal) {
        const proposalResponse = await fetch("/api/onboarding/proposal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hotelName,
            city,
            sourceSystem: activeSystem,
            totalRooms,
            roomTypes: rooms,
          }),
        });
        const proposalData = (await proposalResponse.json()) as { proposal?: OwnerProposal; errors?: string[]; error?: string };
        if (!proposalResponse.ok) {
          setFormError(proposalData.errors?.join(" ") || proposalData.error || "Could not generate proposal.");
          return;
        }
        activeProposal = proposalData.proposal ?? null;
      }

      const response = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName,
          city,
          checkinWindow,
          escalationContact,
          gstin,
          sourceSystem: activeSystem,
          roomTypes: rooms,
          totalRooms,
          photoName,
          proposal: activeProposal,
        }),
      });
      const data = (await response.json()) as { hotel?: HotelConfig; errors?: string[]; error?: string };
      if (!response.ok) {
        setFormError(data.errors?.join(" ") || data.error || "Could not save hotel setup.");
        return;
      }

      setProposal(activeProposal);
      setSavedHotel(data.hotel ?? null);
    } catch {
      setFormError("Could not save the hotel setup. Try again.");
    } finally {
      setIsGenerating(false);
    }
  }

  function applyChatAnswer(answer: string, index: number) {
    if (index === 0) {
      setHotelName(answer);
      return `${answer}. Got it. Which city or locality is it in?`;
    }

    if (index === 1) {
      setCity(answer);
      return "Where do your bookings live today: Google Sheets, PMS, OTA extranet, WhatsApp, or manual register?";
    }

    if (index === 2) {
      const matchedSystem = hotelSystems.find((system) =>
        answer.toLowerCase().includes(system.toLowerCase().split(" ")[0]),
      );
      setActiveSystem(matchedSystem ?? answer);
      return "Now tell me the room types, counts, and base rates. Example: Deluxe AC 24 rooms 3499, Suite 6 rooms 7499.";
    }

    if (index === 3) {
      const parsedRooms = answer
        .split(/[,;\n]/)
        .map((part) => part.trim())
        .filter(Boolean)
        .map((part) => {
          const numbers = part.match(/\d+/g) ?? [];
          const rate = numbers[numbers.length - 1] ?? "3499";
          const count = numbers.length > 1 ? (numbers[0] ?? "1") : "1";
          const type = part
            .replace(/\b\d+\b/g, "")
            .replace(/\brooms?\b/gi, "")
            .replace(/\brate\b/gi, "")
            .trim() || "Room Type";

          return { type, count, rate };
        });

      if (parsedRooms.length) {
        setRooms(parsedRooms);
      }

      return "What is your normal check-in window? Example: 12:00 PM to 11:00 PM.";
    }

    if (index === 4) {
      setCheckinWindow(answer);
      return "What phone number should BookMe use when it needs staff help?";
    }

    setEscalationContact(answer);
    return "Setup draft is ready. Review the details below, then save the hotel setup to generate the admin dashboard and demo site.";
  }

  function sendChatMessage(messageText = chatInput) {
    const answer = messageText.trim();
    if (!answer) return;

    const assistantReply = applyChatAnswer(answer, questionIndex);
    const nextIndex = Math.min(questionIndex + 1, onboardingQuestions.length);
    setQuestionIndex(nextIndex);
    setChatMessages((current) => [
      ...current,
      { role: "owner", content: answer },
      { role: "assistant", content: assistantReply },
    ]);
    setChatInput("");
  }

  return (
    <div className="space-y-6">
      <section className="liquid-glass rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-end">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/[0.72]">
              India hotel onboarding
            </p>
            <h1
              className="max-w-4xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Connect the hotel, then let AI run the front desk.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.62]">
              BookMe starts by mapping the hotel owner&apos;s real workflow: where reservations live, what room types exist, what check-in rules apply, and when staff must take over.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {onboardingSteps.map((step, index) => (
              <article key={step.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <step.icon className="h-5 w-5 text-white" />
                  <span className="text-xs text-white/[0.42]">0{index + 1}</span>
                </div>
                <h2 className="text-sm font-medium text-white">{step.label}</h2>
                <p className="mt-2 text-xs leading-5 text-white/[0.55]">{step.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="liquid-glass rounded-[1.5rem] p-4">
          <div className="overflow-hidden rounded-[1.25rem] border border-white/10 bg-black/20">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="flex items-center gap-3">
                <MessageSquareText className="h-5 w-5 text-white" />
                <div>
                  <h2 className="text-sm font-medium text-white">Client onboarding chat</h2>
                  <p className="text-xs text-white/[0.5]">Answer naturally. BookMe fills the setup as you go.</p>
                </div>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/[0.65]">
                {Math.min(questionIndex + 1, onboardingQuestions.length)} / {onboardingQuestions.length}
              </span>
            </div>

            <div className="max-h-[430px] space-y-3 overflow-y-auto p-4">
              {chatMessages.map((message, index) => (
                <div
                  key={`${message.role}-${index}`}
                  className={
                    message.role === "owner"
                      ? "ml-auto max-w-[84%] rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-zinc-950"
                      : "max-w-[84%] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-white"
                  }
                >
                  {message.content}
                </div>
              ))}
            </div>

            <div className="border-t border-white/10 p-4">
              {questionIndex === 2 ? (
                <div className="mb-3 flex flex-wrap gap-2">
                  {hotelSystems.map((system) => (
                    <button
                      key={system}
                      type="button"
                      onClick={() => sendChatMessage(system)}
                      className="liquid-glass rounded-full px-3 py-2 text-left text-xs text-white/[0.72] transition hover:scale-[1.02] hover:text-white"
                    >
                      {system}
                    </button>
                  ))}
                </div>
              ) : null}

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  sendChatMessage();
                }}
                className="liquid-glass flex items-center gap-3 rounded-2xl p-2"
              >
                <input
                  value={chatInput}
                  onChange={(event) => setChatInput(event.target.value)}
                  placeholder={onboardingQuestions[questionIndex] ?? "Review below, then save setup"}
                  className="min-h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/[0.45]"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="liquid-glass grid h-11 w-11 place-items-center rounded-xl text-white transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-45"
                  aria-label="Send onboarding answer"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="liquid-glass rounded-[1.5rem] p-5">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/[0.45]">Live setup summary</p>
          <h2
            className="mt-3 text-4xl font-normal leading-none tracking-[-1px] text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            {hotelName}
          </h2>
          <div className="mt-5 grid gap-3 text-sm">
            {[
              ["Location", city],
              ["Bookings live in", activeSystem],
              ["Mapped rooms", `${totalRooms} across ${rooms.length} types`],
              ["Check-in window", checkinWindow],
              ["Staff handoff", escalationContact],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                <p className="text-xs text-white/[0.42]">{label}</p>
                <p className="mt-1 font-medium text-white">{value}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="liquid-glass rounded-[1.5rem] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-zinc-950">
              <Hotel className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-medium text-white">Property setup</h2>
              <p className="text-xs text-white/[0.5]">First fields the owner completes</p>
            </div>
          </div>

          <div className="grid gap-3">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/[0.5]">Hotel name</span>
              <input value={hotelName} onChange={(event) => setHotelName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/[0.5]">City / locality</span>
              <input value={city} onChange={(event) => setCity(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/[0.5]">Rooms</span>
              <input value={`${totalRooms} mapped rooms`} readOnly className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white/[0.65] outline-none" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/[0.5]">Check-in window</span>
              <input value={checkinWindow} onChange={(event) => setCheckinWindow(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/[0.5]">Escalation contact</span>
              <input value={escalationContact} onChange={(event) => setEscalationContact(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30" />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-white/[0.5]">GSTIN</span>
              <input value={gstin} onChange={(event) => setGstin(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none transition focus:border-white/30" />
            </label>
          </div>
        </div>

        <div className="liquid-glass rounded-[1.5rem] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-zinc-950">
              <PlugZap className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-medium text-white">Connect reservations</h2>
              <p className="text-xs text-white/[0.5]">What India hotels usually use today</p>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {hotelSystems.map((system) => (
              <button
                key={system}
                type="button"
                onClick={() => setActiveSystem(system)}
                className={`rounded-2xl px-4 py-3 text-left text-sm transition ${
                  activeSystem === system
                    ? "bg-white text-zinc-950"
                    : "border border-white/10 bg-white/[0.04] text-white/[0.66] hover:bg-white/[0.08] hover:text-white"
                }`}
              >
                {system}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-black/20 p-4">
            <div className="flex items-start gap-3">
              <FileSpreadsheet className="mt-0.5 h-5 w-5 shrink-0 text-white" />
              <p className="text-sm leading-6 text-white/[0.58]">
                MVP connector: Google Sheets with Reservations and Inventory tabs. PMS and OTA adapters should use the same internal tool contracts later.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <div className="liquid-glass rounded-[1.5rem] p-5">
          <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <div>
              <h2 className="font-medium text-white">Room inventory intake</h2>
              <p className="mt-1 text-xs text-white/[0.5]">Type rooms now, add AI photo extraction next</p>
            </div>
            <label className="liquid-glass inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white transition hover:scale-[1.02]">
              <Upload className="h-4 w-4" />
              Upload room photo
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(event) => setPhotoName(event.target.files?.[0]?.name ?? "")}
              />
            </label>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-white/[0.42]">
                <tr>
                  <th className="px-3 py-3 font-medium">Room type</th>
                  <th className="px-3 py-3 font-medium">Count</th>
                  <th className="px-3 py-3 font-medium">Base rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {rooms.map((room, index) => (
                  <tr key={index}>
                    <td className="px-3 py-3">
                      <input
                        value={room.type}
                        onChange={(event) => {
                          const next = [...rooms];
                          next[index] = { ...room, type: event.target.value };
                          setRooms(next);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white outline-none focus:border-white/30"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={room.count}
                        onChange={(event) => {
                          const next = [...rooms];
                          next[index] = { ...room, count: event.target.value };
                          setRooms(next);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white outline-none focus:border-white/30"
                      />
                    </td>
                    <td className="px-3 py-3">
                      <input
                        value={room.rate}
                        onChange={(event) => {
                          const next = [...rooms];
                          next[index] = { ...room, rate: event.target.value };
                          setRooms(next);
                        }}
                        className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3 py-2 text-white outline-none focus:border-white/30"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <p className="text-xs text-white/[0.5]">
              {photoName ? `Uploaded: ${photoName}` : "Photo extraction will read room boards, tariff sheets, and room photos."}
            </p>
            <button
              type="button"
              onClick={() => setRooms([...rooms, { type: "New Room Type", count: "1", rate: "2999" }])}
              className="rounded-full bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:scale-[1.02]"
            >
              Add room type
            </button>
          </div>
        </div>

        <div className="liquid-glass rounded-[1.5rem] p-5">
          <div className="mb-5 flex items-center gap-3">
            <Camera className="h-5 w-5 text-white" />
            <div>
              <h2 className="font-medium text-white">AI extraction queue</h2>
              <p className="text-xs text-white/[0.5]">Planned workflow for photos</p>
            </div>
          </div>
          {["Detect room type names", "Extract visible tariffs", "Ask owner to verify counts", "Write clean inventory rows"].map((item) => (
            <div key={item} className="mb-3 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-sm text-white/[0.65]">
              <Check className="h-4 w-4 text-emerald-100" />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {indiaAutomationRules.map((rule) => (
          <article key={rule.title} className="liquid-glass rounded-[1.5rem] p-5">
            <rule.icon className="mb-4 h-5 w-5 text-white" />
            <h3 className="font-medium text-white">{rule.title}</h3>
            <p className="mt-2 text-sm leading-6 text-white/[0.58]">{rule.body}</p>
          </article>
        ))}
      </section>

      <section className="liquid-glass rounded-[2rem] p-6 sm:p-8">
        <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/[0.45]">Pricing quote</p>
            <h2
              className="mt-3 text-5xl font-normal leading-none tracking-[-1.2px] text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Quote by complexity, not just rooms.
            </h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/[0.58]">
            For India, sell a low-friction pilot first. Raise price when WhatsApp, PMS, OTA, and managed support are included.
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <article key={plan.name} className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-medium text-white">{plan.name}</h3>
                  <p className="mt-1 text-xs text-white/[0.5]">{plan.note}</p>
                </div>
                <IndianRupee className="h-5 w-5 text-white" />
              </div>
              <p className="mt-5 text-3xl font-medium text-white">{plan.price}</p>
              <ul className="mt-5 space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex gap-3 text-sm text-white/[0.62]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-100" />
                    {feature}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        {proposal ? (
          <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/[0.45]">Recommended</p>
                <h3 className="mt-2 text-2xl font-medium text-white">{proposal.recommendedPlan}</h3>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-xl font-medium text-white">{proposal.monthlyPrice}</p>
                <p className="text-xs text-white/[0.5]">{proposal.setupFee}</p>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/[0.62]">{proposal.summary}</p>
            <div className="mt-5 grid gap-4 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-white/[0.45]">Rollout</p>
                {proposal.rollout.map((item) => (
                  <p key={item} className="mb-2 text-sm leading-6 text-white/[0.58]">{item}</p>
                ))}
              </div>
              <div>
                <p className="mb-3 text-xs font-medium uppercase tracking-[0.18em] text-white/[0.45]">Risks</p>
                {proposal.risks.map((item) => (
                  <p key={item} className="mb-2 text-sm leading-6 text-white/[0.58]">{item}</p>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        <button
          type="button"
          onClick={generateProposal}
          disabled={isGenerating}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isGenerating ? "Generating proposal..." : "Generate owner proposal"}
          <ArrowRight className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={saveSetup}
          disabled={isGenerating}
          className="ml-0 mt-3 inline-flex items-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60 sm:ml-3"
        >
          {isGenerating ? "Saving setup..." : "Save hotel setup"}
          <Check className="h-4 w-4" />
        </button>

        {formError ? (
          <div className="mt-5 rounded-[1.5rem] border border-red-200/20 bg-red-200/[0.08] p-4 text-sm leading-6 text-red-50">
            {formError}
          </div>
        ) : null}

        {savedHotel ? (
          <div className="mt-5 rounded-[1.5rem] border border-emerald-200/20 bg-emerald-200/[0.08] p-5">
            <p className="text-sm font-medium text-emerald-50">Saved {savedHotel.hotelName}</p>
            <p className="mt-1 text-sm text-white/[0.58]">
              Admin and demo are now reading this hotel config from the local BookMe store.
            </p>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <a href={`/admin?hotel=${savedHotel.slug}`} className="rounded-full bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-950">
                Open admin
              </a>
              <a href={`/demo?hotel=${savedHotel.slug}`} className="liquid-glass rounded-full px-4 py-2.5 text-center text-sm font-medium text-white">
                Open hotel demo
              </a>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
