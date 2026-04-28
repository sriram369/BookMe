"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  BedDouble,
  Bot,
  CheckCircle2,
  FileSpreadsheet,
  Hotel,
  KeyRound,
  MessageSquareText,
  PlugZap,
  ShieldCheck,
} from "lucide-react";
import type { SolutionDashboard } from "@/lib/solution/types";

type ChatMessage = {
  role: "owner" | "assistant";
  content: string;
};

function StatusPill({ status }: { status: string }) {
  const tone = status === "connected" || status === "Checked In"
    ? "bg-emerald-300/15 text-emerald-100"
    : status === "needs_credentials" || status === "Manual Review"
      ? "bg-amber-300/15 text-amber-100"
      : "bg-white/10 text-white";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status.replaceAll("_", " ")}</span>;
}

export function SolutionOwnerConsole({ initialDashboard }: { initialDashboard: SolutionDashboard }) {
  const [dashboard, setDashboard] = useState(initialDashboard);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Tell me how your hotel runs today: rooms, rates, Google Sheet or PMS, check-in rules, and what staff should review.",
    },
  ]);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setDashboard(initialDashboard);
  }, [initialDashboard]);

  async function sendMessage() {
    const content = input.trim();
    if (!content || isSending) return;

    setInput("");
    setIsSending(true);
    setMessages((current) => [...current, { role: "owner", content }]);

    try {
      const response = await fetch("/api/solution/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: content }),
      });
      const data = (await response.json()) as { reply?: string; dashboard?: SolutionDashboard };
      if (data.dashboard) setDashboard(data.dashboard);
      setMessages((current) => [
        ...current,
        { role: "assistant", content: data.reply ?? "Saved. I updated the setup state." },
      ]);
    } catch {
      setMessages((current) => [
        ...current,
        { role: "assistant", content: "I could not save that message. Please try again." },
      ]);
    } finally {
      setIsSending(false);
    }
  }

  const arrivals = dashboard.reservations.filter((reservation) => reservation.checkin <= new Date().toISOString().slice(0, 10));
  const checkedIn = dashboard.reservations.filter((reservation) => reservation.status === "Checked In");
  const idQueue = dashboard.reservations.filter((reservation) => reservation.idCaptureStatus !== "captured");

  return (
    <div className="space-y-6">
      <section className="liquid-glass rounded-[2rem] p-6 sm:p-8">
        <div className="grid gap-8 xl:grid-cols-[0.9fr_1.1fr] xl:items-end">
          <div>
            <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/[0.72]">
              Paid-client Solution
            </p>
            <h1
              className="max-w-4xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Set up the hotel once. Let BookMe run check-in.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.62]">
              This is the owner workspace for real clients: onboarding chat, connector health, room setup, guest status, ID capture logs, and staff-visible audit history.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            {[
              ["Arrivals", arrivals.length, "today and active"],
              ["Checked in", checkedIn.length, "with staff-visible status"],
              ["ID queue", idQueue.length, "needs capture/review"],
            ].map(([label, value, detail]) => (
              <div key={label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-5">
                <p className="text-sm text-white/[0.55]">{label}</p>
                <p className="mt-2 text-3xl font-medium text-white">{value}</p>
                <p className="mt-1 text-xs text-white/[0.5]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[0.82fr_1.18fr]">
        <div className="liquid-glass rounded-[1.5rem] p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-zinc-950">
              <MessageSquareText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="font-medium text-white">Owner setup chat</h2>
              <p className="text-xs text-white/[0.5]">Rooms, rates, rules, connectors, paid setup add-ons</p>
            </div>
          </div>

          <div className="max-h-[390px] space-y-3 overflow-y-auto pr-1">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-[1.25rem] px-4 py-3 text-sm leading-6 ${
                  message.role === "owner"
                    ? "ml-8 bg-white text-zinc-950"
                    : "mr-8 border border-white/10 bg-white/[0.05] text-white/[0.72]"
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>

          <div className="mt-4 flex gap-2">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") sendMessage();
              }}
              placeholder="e.g. We use Google Sheets and have 42 rooms..."
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isSending}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-white text-zinc-950 transition hover:scale-[1.03] disabled:opacity-60"
              aria-label="Send setup message"
            >
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="liquid-glass rounded-[1.5rem] p-5">
            <div className="mb-5 flex items-center gap-3">
              <PlugZap className="h-5 w-5 text-white" />
              <div>
                <h2 className="font-medium text-white">MCP-style connector setup</h2>
                <p className="text-xs text-white/[0.5]">Sheets now, PMS/OTA/WhatsApp next</p>
              </div>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {dashboard.connectors.map((connector) => (
                <article key={connector.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4 w-4 text-white" />
                      <h3 className="text-sm font-medium text-white">{connector.name}</h3>
                    </div>
                    <StatusPill status={connector.status} />
                  </div>
                  <p className="text-xs leading-5 text-white/[0.55]">{connector.description}</p>
                  <p className="mt-3 text-xs text-white/[0.42]">Sync: {connector.lastSync}</p>
                </article>
              ))}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              ["Hotel", dashboard.hotel.hotelName, dashboard.hotel.location, Hotel],
              ["Rooms", String(dashboard.hotel.totalRooms), dashboard.hotel.checkinWindow, BedDouble],
              ["ID rule", "Required", dashboard.hotel.idRule, ShieldCheck],
            ].map(([label, value, detail, Icon]) => (
              <article key={String(label)} className="liquid-glass rounded-[1.5rem] p-5">
                <Icon className="mb-4 h-5 w-5 text-white" />
                <p className="text-sm text-white/[0.55]">{String(label)}</p>
                <h3 className="mt-2 text-xl font-medium text-white">{String(value)}</h3>
                <p className="mt-2 text-xs leading-5 text-white/[0.5]">{String(detail)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="liquid-glass overflow-hidden rounded-[1.5rem]">
          <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
            <KeyRound className="h-5 w-5" />
            <div>
              <h2 className="text-sm font-medium text-white">Guest check-in status</h2>
              <p className="text-xs text-white/[0.5]">Connected to `/welcome_customer` flow</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-white/[0.42]">
                <tr>
                  <th className="px-5 py-3 font-medium">Booking</th>
                  <th className="px-5 py-3 font-medium">Guest</th>
                  <th className="px-5 py-3 font-medium">Room</th>
                  <th className="px-5 py-3 font-medium">ID</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {dashboard.reservations.map((reservation) => (
                  <tr key={reservation.bookingId}>
                    <td className="px-5 py-4 font-medium text-white">{reservation.bookingId}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-white">{reservation.guestName}</p>
                      <p className="text-xs text-white/[0.45]">{reservation.email}</p>
                    </td>
                    <td className="px-5 py-4 text-white/[0.64]">{reservation.roomType} {reservation.roomNumber}</td>
                    <td className="px-5 py-4 text-white/[0.64]">{reservation.idPhotoName ?? reservation.idCaptureStatus}</td>
                    <td className="px-5 py-4"><StatusPill status={reservation.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="liquid-glass rounded-[1.5rem] p-5">
          <div className="mb-5 flex items-center gap-3">
            <Bot className="h-5 w-5 text-white" />
            <div>
              <h2 className="font-medium text-white">Audit log</h2>
              <p className="text-xs text-white/[0.5]">Owner, guest, and system events</p>
            </div>
          </div>
          <div className="space-y-3">
            {dashboard.auditLog.slice(0, 6).map((event) => (
              <div key={event.id} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-100" />
                  <p className="text-sm font-medium text-white">{event.title}</p>
                </div>
                <p className="text-xs leading-5 text-white/[0.55]">{event.detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
