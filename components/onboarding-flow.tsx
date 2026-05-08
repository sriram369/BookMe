"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Hotel, MessageSquareText, Send } from "lucide-react";
import { hotelSystems } from "@/lib/onboarding-data";
import type { HotelConfig } from "@/lib/hotel/config-store";
import type { OwnerProposal } from "@/lib/onboarding/proposal";

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
  "Where do your bookings live today?",
  "What room types, counts, and base rates should we start with?",
  "What is your normal check-in window?",
  "What phone number should BookMe use when it needs staff help?",
];

function parseRooms(answer: string) {
  const parsed = answer
    .split(/[,;\n]/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      const numbers = part.match(/\d+/g) ?? [];
      const rate = numbers[numbers.length - 1] ?? "3499";
      const count = numbers.length > 1 ? (numbers[0] ?? "1") : "1";
      const type =
        part
          .replace(/\b\d+\b/g, "")
          .replace(/\brooms?\b/gi, "")
          .replace(/\brate\b/gi, "")
          .trim() || "Room Type";

      return { type, count, rate };
    });

  return parsed.length ? parsed : defaultRooms;
}

export function OnboardingFlow() {
  const [hotelName, setHotelName] = useState("");
  const [city, setCity] = useState("");
  const [sourceSystem, setSourceSystem] = useState("Google Sheets or Excel");
  const [rooms, setRooms] = useState(defaultRooms);
  const [checkinWindow, setCheckinWindow] = useState("");
  const [escalationContact, setEscalationContact] = useState("");
  const [proposal, setProposal] = useState<OwnerProposal | null>(null);
  const [savedHotel, setSavedHotel] = useState<HotelConfig | null>(null);
  const [isWorking, setIsWorking] = useState(false);
  const [formError, setFormError] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [chatMessages, setChatMessages] = useState<OnboardingMessage[]>([
    {
      role: "assistant",
      content:
        "Welcome. I will set up the guest website, reservation source, room inventory, check-in rules, and staff handoff. What is your hotel name?",
    },
  ]);

  const totalRooms = useMemo(() => rooms.reduce((sum, room) => sum + Number(room.count || 0), 0), [rooms]);
  const isComplete = questionIndex >= onboardingQuestions.length;

  const summaryRows = [
    ["Hotel", hotelName || "Not answered yet"],
    ["Location", city || "Not answered yet"],
    ["Reservations live in", sourceSystem || "Not answered yet"],
    ["Room inventory", `${totalRooms} rooms across ${rooms.length} types`],
    ["Check-in window", checkinWindow || "Not answered yet"],
    ["Staff handoff", escalationContact || "Not answered yet"],
  ];

  function applyChatAnswer(answer: string, index: number) {
    if (index === 0) {
      setHotelName(answer);
      return "Got it. Which city or locality is it in?";
    }

    if (index === 1) {
      setCity(answer);
      return "Where do your bookings live today? You can pick a common source below or type your own.";
    }

    if (index === 2) {
      const matchedSystem = hotelSystems.find((system) =>
        answer.toLowerCase().includes(system.toLowerCase().split(" ")[0]),
      );
      setSourceSystem(matchedSystem ?? answer);
      return "Now tell me room types, counts, and base rates. Example: Deluxe AC 24 rooms 3499, Executive King 12 rooms 4999.";
    }

    if (index === 3) {
      setRooms(parseRooms(answer));
      return "What is your normal check-in window? Example: 12:00 PM to 11:00 PM.";
    }

    if (index === 4) {
      setCheckinWindow(answer);
      return "What phone number should BookMe use when it needs staff help?";
    }

    setEscalationContact(answer);
    return "Perfect. I summarized the setup on the right. Generate the owner quote when you are ready.";
  }

  function sendChatMessage(messageText = chatInput) {
    const answer = messageText.trim();
    if (!answer || isComplete) return;

    const assistantReply = applyChatAnswer(answer, questionIndex);
    setQuestionIndex((current) => Math.min(current + 1, onboardingQuestions.length));
    setChatMessages((current) => [
      ...current,
      { role: "owner", content: answer },
      { role: "assistant", content: assistantReply },
    ]);
    setChatInput("");
  }

  async function generateProposal() {
    setFormError("");
    setIsWorking(true);
    try {
      const response = await fetch("/api/onboarding/proposal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName,
          city,
          sourceSystem,
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
      setIsWorking(false);
    }
  }

  async function saveSetup() {
    setFormError("");
    setIsWorking(true);
    try {
      const activeProposal = proposal;
      const response = await fetch("/api/hotels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelName,
          city,
          checkinWindow,
          escalationContact,
          gstin: "Optional for pilot",
          sourceSystem,
          roomTypes: rooms,
          totalRooms,
          proposal: activeProposal,
        }),
      });

      const data = (await response.json()) as { hotel?: HotelConfig; errors?: string[]; error?: string };
      if (!response.ok) {
        setFormError(data.errors?.join(" ") || data.error || "Could not save hotel setup.");
        return;
      }

      setSavedHotel(data.hotel ?? null);
    } catch {
      setFormError("Could not save the hotel setup. Try again.");
    } finally {
      setIsWorking(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="liquid-glass rounded-[2rem] p-6 sm:p-8">
        <div className="max-w-4xl">
          <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/[0.72]">
            Hotel owner onboarding
          </p>
          <h1
            className="text-5xl font-normal leading-[0.95] tracking-[-2px] text-white sm:text-7xl"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            Set up the guest website, then quote the pilot.
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.62]">
            BookMe asks the owner for the hotel profile, reservation source, room inventory, check-in rules, and staff handoff. Then it summarizes the setup and recommends a practical pilot price.
          </p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        <div className="liquid-glass overflow-hidden rounded-[1.5rem]">
          <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
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

          <div className="min-h-[440px] space-y-3 p-5">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={
                  message.role === "owner"
                    ? "ml-auto max-w-[82%] rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-zinc-950"
                    : "max-w-[82%] rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm leading-6 text-white"
                }
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="border-t border-white/10 p-5">
            {questionIndex === 2 ? (
              <div className="mb-3 flex flex-wrap gap-2">
                {hotelSystems.map((system) => (
                  <button
                    key={system}
                    type="button"
                    onClick={() => sendChatMessage(system)}
                    className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-white/[0.72] transition hover:bg-white/10 hover:text-white"
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
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-2"
            >
              <input
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                disabled={isComplete}
                placeholder={isComplete ? "Setup captured. Generate quote on the right." : onboardingQuestions[questionIndex]}
                className="min-h-11 flex-1 bg-transparent px-3 text-sm text-white outline-none placeholder:text-white/[0.45] disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isComplete}
                className="grid h-11 w-11 place-items-center rounded-xl bg-white text-zinc-950 transition hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-45"
                aria-label="Send onboarding answer"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>

        <aside className="space-y-5">
          <section className="liquid-glass rounded-[1.5rem] p-5">
            <div className="mb-5 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-zinc-950">
                <Hotel className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-medium text-white">Setup summary</h2>
                <p className="text-xs text-white/[0.5]">What BookMe will build for this hotel</p>
              </div>
            </div>

            <div className="space-y-3">
              {summaryRows.map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-white/10 bg-white/[0.04] p-3">
                  <p className="text-xs text-white/[0.42]">{label}</p>
                  <p className="mt-1 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-3">
              <p className="text-xs text-white/[0.42]">Room types</p>
              <div className="mt-2 space-y-2">
                {rooms.map((room) => (
                  <div key={`${room.type}-${room.count}-${room.rate}`} className="flex justify-between gap-3 text-sm text-white/[0.68]">
                    <span>{room.type}</span>
                    <span className="whitespace-nowrap">{room.count} rooms · ₹{room.rate}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="liquid-glass rounded-[1.5rem] p-5">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/[0.45]">Owner quote</p>
            {proposal ? (
              <div className="mt-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-medium text-white">{proposal.recommendedPlan}</h2>
                    <p className="mt-1 text-sm text-white/[0.5]">{proposal.setupFee}</p>
                  </div>
                  <p className="text-xl font-medium text-white">{proposal.monthlyPrice}</p>
                </div>
                <p className="mt-4 text-sm leading-6 text-white/[0.62]">{proposal.summary}</p>
              </div>
            ) : (
              <p className="mt-3 text-sm leading-6 text-white/[0.58]">
                Finish the chat, then BookMe will recommend Pilot, Growth, or Managed based on room count and connector complexity.
              </p>
            )}

            <div className="mt-5 flex flex-col gap-3">
              <button
                type="button"
                onClick={generateProposal}
                disabled={isWorking || !isComplete}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isWorking ? "Working..." : "Generate quote"}
                <ArrowRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={saveSetup}
                disabled={isWorking || !proposal}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save hotel setup
                <Check className="h-4 w-4" />
              </button>
            </div>

            {formError ? (
              <div className="mt-4 rounded-2xl border border-red-200/20 bg-red-200/[0.08] p-3 text-sm leading-6 text-red-50">
                {formError}
              </div>
            ) : null}

            {savedHotel ? (
              <div className="mt-4 rounded-2xl border border-emerald-200/20 bg-emerald-200/[0.08] p-4">
                <p className="text-sm font-medium text-emerald-50">Saved {savedHotel.hotelName}</p>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <a href={`/admin?hotel=${savedHotel.slug}`} className="rounded-full bg-white px-4 py-2.5 text-center text-sm font-medium text-zinc-950">
                    Open admin
                  </a>
                  <a href={`/demo?hotel=${savedHotel.slug}`} className="rounded-full border border-white/15 px-4 py-2.5 text-center text-sm font-medium text-white">
                    Open guest site
                  </a>
                </div>
              </div>
            ) : null}
          </section>
        </aside>
      </section>
    </div>
  );
}
