"use client";

import { useState } from "react";
import { ArrowRight, CheckCircle2, FileImage, KeyRound, Search, ShieldCheck } from "lucide-react";
import type { SolutionReservation, WelcomeLookupResult } from "@/lib/solution/types";

export function SolutionWelcomeFlow() {
  const [identifier, setIdentifier] = useState("9876543210");
  const [reservation, setReservation] = useState<SolutionReservation | null>(null);
  const [message, setMessage] = useState("Enter your registered mobile number, email, or booking ID.");
  const [idFileName, setIdFileName] = useState("");
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function lookup() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/solution/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", identifier }),
      });
      const data = (await response.json()) as WelcomeLookupResult;
      setMessage(data.message);
      setReservation(data.reservation ?? null);
    } catch {
      setMessage("We could not lookup the reservation right now. Please ask the front desk.");
    } finally {
      setIsLoading(false);
    }
  }

  async function finishCheckIn() {
    if (!reservation) return;
    setIsLoading(true);
    try {
      const response = await fetch("/api/solution/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "capture_id",
          bookingId: reservation.bookingId,
          fileName: idFileName,
          consent,
        }),
      });
      const data = (await response.json()) as WelcomeLookupResult;
      setMessage(data.message);
      setReservation(data.reservation ?? reservation);
    } catch {
      setMessage("We could not complete check-in. Staff review is required.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
      <section className="liquid-glass rounded-[2rem] p-6 sm:p-8">
        <div className="mb-8 grid h-12 w-12 place-items-center rounded-2xl bg-white text-zinc-950">
          <KeyRound className="h-6 w-6" />
        </div>
        <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/[0.72]">
          Welcome customer
        </p>
        <h1
          className="max-w-3xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Check in with your registered number.
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.62]">
          BookMe verifies your reservation, captures physical ID metadata for hotel staff, then marks the check-in status in the owner console.
        </p>

        <div className="mt-8 rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-4">
          <p className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-white/[0.45]">Hotel rule</p>
          <div className="flex gap-3">
            <ShieldCheck className="mt-1 h-5 w-5 shrink-0 text-white" />
            <p className="text-sm leading-6 text-white/[0.62]">
              A physical ID photo is required before room release. The image itself is a production storage concern; this MVP logs metadata and check-in status.
            </p>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div className="liquid-glass rounded-[1.5rem] p-5">
          <div className="mb-5 flex items-center gap-3">
            <Search className="h-5 w-5 text-white" />
            <div>
              <h2 className="font-medium text-white">Find reservation</h2>
              <p className="text-xs text-white/[0.5]">Mobile number, email, or booking ID</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="min-w-0 flex-1 rounded-full border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-white outline-none focus:border-white/30"
              placeholder="9876543210"
            />
            <button
              type="button"
              onClick={lookup}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.02] disabled:opacity-60"
            >
              Lookup
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <p className="mt-4 rounded-[1.25rem] border border-white/10 bg-black/20 p-4 text-sm leading-6 text-white/[0.62]">
            {message}
          </p>
        </div>

        {reservation ? (
          <div className="liquid-glass rounded-[1.5rem] p-5">
            <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/[0.45]">Reservation</p>
                <h2 className="mt-2 text-2xl font-medium text-white">{reservation.guestName}</h2>
                <p className="mt-1 text-sm text-white/[0.55]">{reservation.bookingId} · Room {reservation.roomNumber}</p>
              </div>
              <span className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white">{reservation.status}</span>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ["Room type", reservation.roomType],
                ["Check-in", reservation.checkin],
                ["Check-out", reservation.checkout],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs text-white/[0.45]">{label}</p>
                  <p className="mt-1 text-sm font-medium text-white">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
              <label className="mb-4 flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/10 bg-black/20 px-4 py-6 text-sm font-medium text-white transition hover:bg-white/[0.08]">
                <FileImage className="h-5 w-5" />
                {idFileName || "Take/upload physical ID photo"}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => setIdFileName(event.target.files?.[0]?.name ?? "")}
                />
              </label>

              <label className="flex items-start gap-3 text-sm leading-6 text-white/[0.62]">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  className="mt-1"
                />
                I consent to the hotel capturing my physical ID photo for check-in verification and staff review.
              </label>

              <button
                type="button"
                onClick={finishCheckIn}
                disabled={isLoading || !idFileName}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <CheckCircle2 className="h-4 w-4" />
                Complete check-in
              </button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
