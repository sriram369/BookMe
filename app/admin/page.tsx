import Link from "next/link";
import {
  ArrowRight,
  BedDouble,
  Bot,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  Hotel,
  KeyRound,
  MessageSquareText,
  PlugZap,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { adminDashboardData } from "@/lib/hotel/tools";

const automations = [
  {
    title: "Booking assistant",
    status: "Live",
    description: "Checks availability, quotes rates, and waits for explicit confirmation.",
    icon: CalendarCheck,
  },
  {
    title: "Self check-in",
    status: "Live",
    description: "Verifies reservations by phone, email, or booking ID before issuing the room.",
    icon: KeyRound,
  },
  {
    title: "Self checkout",
    status: "Live",
    description: "Closes checked-in stays and returns a receipt-style summary card.",
    icon: CircleDollarSign,
  },
];

const setupCards = [
  {
    title: "Brand the guest site",
    body: "Hotel name, location, hero copy, room highlights, and guest action buttons.",
    icon: Building2,
  },
  {
    title: "Connect reservation data",
    body: "Start with Google Sheets, then swap the same tool layer to a hotel PMS.",
    icon: PlugZap,
  },
  {
    title: "Set front-desk rules",
    body: "Check-in windows, cancellation handoff, refunds, payment boundaries, and escalation.",
    icon: ShieldCheck,
  },
];

function StatusPill({ status }: { status: string }) {
  const tone =
    status === "Checked In" || status === "Live"
      ? "bg-emerald-300/15 text-emerald-100"
      : status === "Confirmed" || status === "Available"
        ? "bg-white/10 text-white"
        : "bg-sky-300/15 text-sky-100";

  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>{status}</span>;
}

export default function AdminPage() {
  const dashboard = adminDashboardData();

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative overflow-hidden">
        <SiteHeader ctaLabel="Sign up" />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-6 pb-14 pt-8 sm:px-8 lg:grid-cols-[260px_1fr]">
          <aside className="liquid-glass h-max rounded-[1.5rem] p-4">
            <div className="mb-6 flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-zinc-950">
                <Hotel className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-white">{dashboard.hotel.name}</p>
                <p className="text-xs text-white/[0.55]">{dashboard.hotel.location}</p>
              </div>
            </div>

            <nav className="space-y-1 text-sm">
              {[
                ["Overview", ClipboardList],
                ["Reservations", CalendarCheck],
                ["Inventory", BedDouble],
                ["Automation", Bot],
                ["Settings", Settings],
              ].map(([label, Icon]) => (
                <a
                  key={String(label)}
                  href={`#${String(label).toLowerCase()}`}
                  className="flex items-center gap-3 rounded-2xl px-3 py-2.5 text-white/[0.62] transition hover:bg-white/10 hover:text-white"
                >
                  {/* Static tuple keeps this nav concise. */}
                  <Icon className="h-4 w-4" />
                  {String(label)}
                </a>
              ))}
            </nav>

            <Link
              href="/demo"
              className="liquid-glass mt-6 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white transition hover:scale-[1.02]"
            >
              View guest site
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>

          <div className="space-y-6">
            <section id="overview" className="liquid-glass rounded-[2rem] p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/[0.72]">
                    Hotel admin workspace
                  </p>
                  <h1
                    className="max-w-4xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Operate the AI front desk from one place.
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.62]">
                    Configure the hotel site, monitor reservations, manage inventory, and control which workflows BookMe can complete.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <button className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.03]">
                    <Settings className="h-4 w-4" />
                    Configure hotel
                  </button>
                  <button className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.03]">
                    Connect Sheets
                    <PlugZap className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {dashboard.metrics.map((metric) => (
                  <div key={metric.label} className="rounded-[1.25rem] border border-white/10 bg-white/[0.05] p-5">
                    <p className="text-sm text-white/[0.55]">{metric.label}</p>
                    <p className="mt-2 text-3xl font-medium text-white">{metric.value}</p>
                    <p className="mt-1 text-xs text-white/[0.5]">{metric.detail}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="automation" className="grid gap-4 lg:grid-cols-3">
              {automations.map((automation) => (
                <article key={automation.title} className="liquid-glass rounded-[1.5rem] p-5">
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="liquid-glass grid h-11 w-11 place-items-center rounded-2xl">
                      <automation.icon className="h-5 w-5" />
                    </div>
                    <StatusPill status={automation.status} />
                  </div>
                  <h2 className="font-medium text-white">{automation.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-white/[0.58]">{automation.description}</p>
                </article>
              ))}
            </section>

            <section id="reservations" className="liquid-glass overflow-hidden rounded-[1.5rem]">
              <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <ClipboardList className="h-5 w-5" />
                  <div>
                    <h2 className="text-sm font-medium text-white">Reservations</h2>
                    <p className="text-xs text-white/[0.5]">Guest state written by BookMe tools</p>
                  </div>
                </div>
                <span className="text-xs text-white/[0.55]">{dashboard.hotel.dataSource}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-white/10 text-xs uppercase tracking-[0.16em] text-white/[0.42]">
                    <tr>
                      <th className="px-5 py-3 font-medium">Booking</th>
                      <th className="px-5 py-3 font-medium">Guest</th>
                      <th className="px-5 py-3 font-medium">Room</th>
                      <th className="px-5 py-3 font-medium">Dates</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {dashboard.reservations.map((reservation) => (
                      <tr key={reservation.bookingId}>
                        <td className="px-5 py-4 font-medium text-white">{reservation.bookingId}</td>
                        <td className="px-5 py-4">
                          <p className="font-medium text-white">{reservation.guestName}</p>
                          <p className="text-xs text-white/[0.45]">{reservation.contact}</p>
                        </td>
                        <td className="px-5 py-4 text-white/[0.64]">{reservation.room}</td>
                        <td className="px-5 py-4 text-white/[0.64]">{reservation.dates}</td>
                        <td className="px-5 py-4">
                          <StatusPill status={reservation.status} />
                        </td>
                        <td className="px-5 py-4 text-white">{reservation.total}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="inventory" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="liquid-glass overflow-hidden rounded-[1.5rem]">
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                  <BedDouble className="h-5 w-5" />
                  <div>
                    <h2 className="text-sm font-medium text-white">Room inventory</h2>
                    <p className="text-xs text-white/[0.5]">Rates and availability exposed to the agent</p>
                  </div>
                </div>
                <div className="divide-y divide-white/10">
                  {dashboard.inventory.map((room) => (
                    <div key={room.roomId} className="grid gap-3 px-5 py-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-medium text-white">{room.label}</p>
                          <StatusPill status={room.status} />
                        </div>
                        <p className="mt-1 text-xs text-white/[0.5]">
                          {room.roomType} · Floor {room.floor} · {room.view} · Up to {room.maxGuests} guests
                        </p>
                      </div>
                      <p className="text-white">{room.rate}/night</p>
                    </div>
                  ))}
                </div>
              </div>

              <div id="settings" className="space-y-4">
                {setupCards.map((card) => (
                  <article key={card.title} className="liquid-glass rounded-[1.5rem] p-5">
                    <card.icon className="mb-4 h-5 w-5 text-white" />
                    <h3 className="font-medium text-white">{card.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-white/[0.58]">{card.body}</p>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>
    </main>
  );
}

