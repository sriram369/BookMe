import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin, Send, Star } from "lucide-react";
import { DotLoader } from "@/components/dot-loader";
import { SiteHeader } from "@/components/site-header";
import { adminRows, demoMessages, reservationSummary } from "@/lib/demo-data";

export default function DemoPage() {
  return (
    <main className="min-h-screen bg-parchment">
      <section className="grain-surface relative min-h-screen">
        <div className="grain-overlay" />
        <SiteHeader variant="hotel" />

        <div className="mx-auto grid max-w-7xl gap-8 px-5 pb-16 pt-6 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
          <section className="pt-8">
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-moss">
              <ArrowLeft className="h-4 w-4" />
              Back to BookMe
            </Link>
            <div className="mb-6 flex items-center gap-2 text-sm font-medium text-sage">
              <MapPin className="h-4 w-4 text-brass" />
              Downtown Boston
            </div>
            <h1 className="max-w-xl text-5xl font-semibold leading-[0.98] tracking-normal text-ink sm:text-6xl">
              Welcome to Sriram Hotel.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-sage">
              Book a room, check in, or check out with our AI front desk. No line, no phone call, no app download.
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {["Book a stay", "Check in", "Check out"].map((action) => (
                <a
                  key={action}
                  href="#front-desk"
                  className="rounded-2xl border border-ink/8 bg-white/72 p-4 text-sm font-semibold text-ink shadow-card transition hover:-translate-y-0.5 hover:border-moss/25"
                >
                  {action}
                </a>
              ))}
            </div>

            <div className="mt-10 rounded-[1.5rem] border border-ink/8 bg-white/74 p-5 shadow-card backdrop-blur">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
                    Tonight
                  </p>
                  <h2 className="mt-1 text-xl font-semibold text-ink">King rooms from $145</h2>
                </div>
                <CalendarDays className="h-6 w-6 text-moss" />
              </div>
              <div className="mt-5 grid gap-3 text-sm text-sage sm:grid-cols-3">
                <span>Quiet floors</span>
                <span>Fast check-in</span>
                <span>Key at desk</span>
              </div>
            </div>
          </section>

          <section id="front-desk" className="rounded-[2rem] border border-white/80 bg-white/80 p-3 shadow-soft backdrop-blur-xl">
            <div className="overflow-hidden rounded-[1.55rem] border border-ink/8 bg-parchment">
              <div className="flex items-center justify-between border-b border-ink/8 bg-white/80 px-4 py-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brass">
                    AI front desk
                  </p>
                  <p className="text-sm font-semibold text-ink">Ask naturally</p>
                </div>
                <div className="flex items-center gap-1 rounded-full bg-brass/10 px-3 py-1 text-xs font-semibold text-brass">
                  <Star className="h-3.5 w-3.5 fill-brass" />
                  Demo
                </div>
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                {demoMessages.map((message) => (
                  <div
                    key={message.text}
                    className={
                      message.role === "guest"
                        ? "ml-auto max-w-[84%] rounded-2xl bg-ink px-4 py-3 text-sm leading-6 text-white"
                        : "max-w-[84%] rounded-2xl border border-ink/8 bg-white px-4 py-3 text-sm leading-6 text-ink shadow-card"
                    }
                  >
                    {message.text}
                  </div>
                ))}

                <div className="transition-pop rounded-2xl border border-moss/15 bg-white p-4 shadow-card">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sage">
                        Reservation confirmed
                      </p>
                      <h3 className="mt-1 text-2xl font-semibold text-ink">{reservationSummary.id}</h3>
                    </div>
                    <span className="rounded-full bg-moss/10 px-3 py-1 text-xs font-semibold text-moss">
                      {reservationSummary.status}
                    </span>
                  </div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-xl bg-cream px-3 py-2">
                      <dt className="text-sage">Guest</dt>
                      <dd className="font-semibold text-ink">{reservationSummary.guest}</dd>
                    </div>
                    <div className="rounded-xl bg-cream px-3 py-2">
                      <dt className="text-sage">Room</dt>
                      <dd className="font-semibold text-ink">{reservationSummary.room}</dd>
                    </div>
                    <div className="rounded-xl bg-cream px-3 py-2">
                      <dt className="text-sage">Dates</dt>
                      <dd className="font-semibold text-ink">{reservationSummary.dates}</dd>
                    </div>
                    <div className="rounded-xl bg-cream px-3 py-2">
                      <dt className="text-sage">Total</dt>
                      <dd className="font-semibold text-ink">{reservationSummary.price}</dd>
                    </div>
                  </dl>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-white p-2">
                  <div className="flex min-h-11 flex-1 items-center px-3 text-sm text-sage">
                    Try: &quot;I want to check in with my phone number&quot;
                  </div>
                  <button className="grid h-11 w-11 place-items-center rounded-xl bg-moss text-white transition hover:bg-ink">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </section>

      <section className="border-t border-ink/8 bg-white px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">
              Demo admin
            </p>
            <h2 className="mt-3 text-4xl font-semibold text-ink">Reservations update behind the scenes.</h2>
            <p className="mt-4 text-base leading-7 text-sage">
              This is the operator view we will connect to mock data first, then Google Sheets.
            </p>
          </div>

          <div className="overflow-hidden rounded-[1.5rem] border border-ink/8 shadow-card">
            <div className="flex items-center justify-between bg-ink px-5 py-4 text-white">
              <span className="text-sm font-semibold">Reservations</span>
              <DotLoader />
            </div>
            <div className="divide-y divide-ink/8 bg-parchment">
              {adminRows.map((row) => (
                <div key={row[0]} className="grid grid-cols-5 gap-3 px-5 py-4 text-sm">
                  {row.map((cell, index) => (
                    <span
                      key={cell}
                      className={index === 0 ? "font-semibold text-ink" : "text-sage"}
                    >
                      {cell}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-ink px-5 py-14 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">
              Next step
            </p>
            <h2 className="mt-2 text-3xl font-semibold">Connect the real agent workflow.</h2>
          </div>
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5"
          >
            View BookMe landing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
