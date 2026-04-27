import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Bot,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Hotel,
  MessageSquareText,
  Settings,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { reservationsForAdmin } from "@/lib/hotel/tools";

const automationCards = [
  {
    title: "Booking assistant",
    status: "Active",
    detail: "Checks room availability and asks for confirmation before writing reservations.",
    icon: CalendarCheck,
  },
  {
    title: "Self check-in",
    status: "Active",
    detail: "Looks up reservations by phone, email, or booking ID and marks eligible guests checked in.",
    icon: CheckCircle2,
  },
  {
    title: "Self checkout",
    status: "Active",
    detail: "Closes checked-in stays and returns itemized summary cards.",
    icon: CircleDollarSign,
  },
];

const setupSteps = [
  "Customize the hotel name, location, room types, and brand colors.",
  "Connect inventory and reservations to Google Sheets or the hotel's PMS.",
  "Set front-desk rules for check-in windows, refunds, cancellations, and human handoff.",
  "Publish the hotel site and give staff access to this admin dashboard.",
];

const adminFeatureCards = [
  { icon: BedDouble, title: "Inventory", body: "Room types, rates, availability" },
  { icon: MessageSquareText, title: "Guest site", body: "Chat, cards, hotel branding" },
];

export default function AdminPage() {
  const reservations = reservationsForAdmin();

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative overflow-hidden">
        <SiteHeader ctaLabel="Sign up" />

        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-16 pt-10 sm:px-8">
          <div className="mb-8 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <div className="liquid-glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/[0.78]">
                <Hotel className="h-4 w-4" />
                Hotel operator dashboard
              </div>
              <h1
                className="max-w-4xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Build the hotel website and automate the front desk.
              </h1>
              <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/[0.62] sm:text-lg">
                This is where a hotel manages the BookMe-powered guest site, reservation tools, and automation rules.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition hover:scale-[1.03]"
              >
                View guest site
                <ArrowRight className="h-4 w-4" />
              </Link>
              <button className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium text-white transition hover:scale-[1.03]">
                <Settings className="h-4 w-4" />
                Configure hotel
              </button>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Reservations", String(reservations.length), "Live demo records"],
              ["Automations", "3", "Booking, check-in, checkout"],
              ["Data source", "Mock", "Google Sheets next"],
            ].map(([label, value, detail]) => (
              <div key={label} className="liquid-glass rounded-[1.5rem] p-5">
                <p className="text-sm text-white/[0.55]">{label}</p>
                <p className="mt-2 text-4xl font-medium text-white">{value}</p>
                <p className="mt-1 text-sm text-white/[0.55]">{detail}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/25 px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/[0.45]">
              Automation
            </p>
            <h2
              className="mt-3 text-5xl font-normal leading-none tracking-[-1.2px] text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              The workflows hotels actually need.
            </h2>
          </div>

          <div className="grid gap-4">
            {automationCards.map((card) => (
              <article key={card.title} className="liquid-glass flex gap-4 rounded-[1.5rem] p-5">
                <div className="liquid-glass grid h-12 w-12 shrink-0 place-items-center rounded-2xl">
                  <card.icon className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="font-medium text-white">{card.title}</h3>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-white/[0.72]">
                      {card.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-white/[0.58]">{card.detail}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="liquid-glass overflow-hidden rounded-[1.5rem] shadow-card">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5" />
                <span className="text-sm font-medium text-white">Reservations</span>
              </div>
              <span className="text-xs text-white/[0.55]">Mock data</span>
            </div>
            <div className="divide-y divide-white/10">
              {reservations.map((row) => (
                <div key={row[0]} className="grid grid-cols-5 gap-3 px-5 py-4 text-sm">
                  {row.map((cell, index) => (
                    <span
                      key={`${row[0]}-${cell}`}
                      className={index === 0 ? "font-medium text-white" : "text-white/[0.55]"}
                    >
                      {cell}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="liquid-glass rounded-[1.5rem] p-5">
              <div className="mb-4 flex items-center gap-3">
                <Bot className="h-5 w-5" />
                <h3 className="font-medium text-white">Client setup path</h3>
              </div>
              <ol className="space-y-3 text-sm leading-6 text-white/[0.58]">
                {setupSteps.map((step, index) => (
                  <li key={step} className="flex gap-3">
                    <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-white/10 text-xs text-white">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {adminFeatureCards.map(({ icon: Icon, title, body }) => (
                <div key={title} className="liquid-glass rounded-[1.5rem] p-5">
                  <Icon className="mb-4 h-5 w-5 text-white" />
                  <h3 className="font-medium text-white">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-white/[0.58]">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
