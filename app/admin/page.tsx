import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  BedDouble,
  Bot,
  Building2,
  CalendarCheck,
  CheckCircle2,
  CircleDollarSign,
  ClipboardList,
  History,
  Hotel,
  KeyRound,
  MessageSquareText,
  PlugZap,
  Settings,
  ShieldCheck,
} from "lucide-react";
import { getServerSession } from "next-auth";
import { SiteHeader } from "@/components/site-header";
import { authOptions } from "@/lib/auth/options";
import { getBookMeAuthMode } from "@/lib/auth/config";
import { requireHotelAdminAccess } from "@/lib/auth/hotel-access";
import { AdminReservationsPanel } from "@/components/admin-reservations-panel";
import { adminDashboardDataAsync } from "@/lib/hotel/tools";
import { findHotelConfig, getHotelConfig } from "@/lib/hotel/config-store";
import { listConnectorBackends } from "@/lib/connectors";
import { listBookMeAuditEventsFromSupabase } from "@/lib/db/bookme";
import { notFound } from "next/navigation";

const automations = [
  {
    title: "Booking assistant",
    status: "Live",
    description: "Answers guest availability questions, quotes rates, and creates bookings only after confirmation.",
    icon: CalendarCheck,
  },
  {
    title: "Self check-in",
    status: "Live",
    description: "Finds the reservation, checks the guest state, and keeps staff in control before room release.",
    icon: KeyRound,
  },
  {
    title: "Self checkout",
    status: "Live",
    description: "Closes stays, updates room status, and gives the guest a clean checkout summary.",
    icon: CircleDollarSign,
  },
];

const setupCards = [
  {
    title: "Guest website",
    body: "Hotel name, location, room highlights, check-in window, and guest action buttons.",
    icon: Building2,
  },
  {
    title: "Reservation source",
    body: "Google Sheets is the live source for bookings and room inventory in this pilot.",
    icon: PlugZap,
  },
  {
    title: "Staff rules",
    body: "Check-in windows, ID review, cancellation handoff, refunds, payments, and escalation rules.",
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

function formatEventTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatConnectorTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function AccessDenied({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative min-h-screen overflow-hidden">
        <SiteHeader ctaLabel="Sign in" ctaHref="/signin" />
        <div className="relative z-10 mx-auto flex max-w-3xl flex-col px-6 py-24 sm:px-8">
          <div className="liquid-glass rounded-[1.5rem] p-6 sm:p-8">
            <div className="mb-5 grid h-12 w-12 place-items-center rounded-2xl bg-red-300/15 text-red-100">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <h1
              className="text-4xl font-normal tracking-[-1px] text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              {title}
            </h1>
            <p className="mt-4 text-sm leading-6 text-white/[0.62]">{body}</p>
            <Link
              href="/signin"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.03]"
            >
              Sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams?: { hotel?: string };
}) {
  const hotelConfig = searchParams?.hotel
    ? await findHotelConfig(searchParams.hotel)
    : await getHotelConfig();
  if (!hotelConfig) notFound();

  const authMode = getBookMeAuthMode();
  const session = authMode === "oauth" ? await getServerSession(authOptions) : null;
  const access = await requireHotelAdminAccess({
    hotelSlug: hotelConfig.slug,
    userEmail: session?.user?.email,
    authMode,
  });

  if (!access.ok) {
    const needsSetup = access.reason === "membership_store_unavailable";
    return (
      <AccessDenied
        title={needsSetup ? "Admin access is not configured." : "You do not have access to this hotel."}
        body={
          needsSetup
            ? "Supabase hotel memberships are required when OAuth is enabled. Apply the latest schema and add an owner/admin membership for this hotel."
            : "Ask the hotel owner to add your email as an owner, admin, or staff member before opening this workspace."
        }
      />
    );
  }

  const dashboard = await adminDashboardDataAsync(hotelConfig);
  const [connectors, auditEvents] = await Promise.all([
    Promise.all(listConnectorBackends().map((connector) => connector.health())),
    listBookMeAuditEventsFromSupabase({ hotelSlug: hotelConfig.slug, limit: 8 }),
  ]);
  const liveConnector = connectors.find((connector) => connector.status === "ok");
  const visibleConnectors = liveConnector
    ? connectors.filter((connector) => connector.status === "ok")
    : connectors;

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative overflow-hidden">
        <SiteHeader
          ctaLabel="View guest site"
          ctaHref={dashboard.hotel.guestSite}
          showAuthLinks={false}
          showMarketingNav={false}
        />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-6 px-6 pb-14 pt-8 sm:px-8 lg:grid-cols-[260px_minmax(0,1fr)]">
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
                ["Activity", History],
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
              href={dashboard.hotel.guestSite}
              className="liquid-glass mt-6 flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium text-white transition hover:scale-[1.02]"
            >
              View guest site
              <ArrowRight className="h-4 w-4" />
            </Link>
          </aside>

          <div className="min-w-0 space-y-6">
            <section id="overview" className="liquid-glass rounded-[2rem] p-6 sm:p-8">
              <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
                <div>
                  <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/[0.72]">
                    Hotel owner dashboard
                  </p>
                  <h1
                    className="max-w-4xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                  >
                    Manage your guest front desk from one place.
                  </h1>
                  <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.62]">
                    See bookings, room availability, guest payments, and AI-handled actions without opening a spreadsheet during the front-desk rush.
                  </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                  <a
                    href="#settings"
                    className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.03]"
                  >
                    <Settings className="h-4 w-4" />
                    Edit hotel setup
                  </a>
                  <a
                    href="#data-connection"
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.03]"
                  >
                    View data connection
                    <PlugZap className="h-4 w-4" />
                  </a>
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

              {dashboard.hotel.proposal ? (
                <div className="mt-6 rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/[0.45]">
                        Active quote
                      </p>
                      <h2 className="mt-2 text-2xl font-medium text-white">
                        {dashboard.hotel.proposal.recommendedPlan}
                      </h2>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-xl font-medium text-white">{dashboard.hotel.proposal.monthlyPrice}</p>
                      <p className="text-xs text-white/[0.5]">{dashboard.hotel.proposal.setupFee}</p>
                    </div>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-white/[0.6]">{dashboard.hotel.proposal.summary}</p>
                </div>
              ) : null}
            </section>

            <section id="data-connection" className="grid gap-4 lg:grid-cols-2">
              {visibleConnectors.map((connector) => (
                <article key={connector.id} className="liquid-glass rounded-[1.5rem] p-5">
                  <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.18em] text-white/[0.45]">
                        Data connection
                      </p>
                      <h2 className="mt-1 font-medium text-white">{connector.name}</h2>
                    </div>
                    <StatusPill
                      status={
                        connector.status === "ok"
                          ? "Live"
                          : connector.status === "not_configured"
                            ? "Setup needed"
                            : "Error"
                      }
                    />
                  </div>
                  <p className="text-sm leading-6 text-white/[0.58]">
                    {connector.status === "ok"
                      ? `${connector.name} is connected and feeding reservations, inventory, and status updates into BookMe.`
                      : connector.status === "not_configured"
                        ? `${connector.name} is not connected yet. Add credentials when this hotel is ready for that source.`
                        : `${connector.name} needs attention before it can be used for this hotel.`}
                  </p>
                  <p className="mt-3 text-xs text-white/[0.42]">Last checked {formatConnectorTime(connector.checkedAt)}</p>
                </article>
              ))}
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

            <section id="activity" className="liquid-glass overflow-hidden rounded-[1.5rem]">
              <div className="flex flex-col justify-between gap-3 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5" />
                  <div>
                    <h2 className="text-sm font-medium text-white">Recent activity</h2>
                    <p className="text-xs text-white/[0.5]">Guest actions and staff-visible updates</p>
                  </div>
                </div>
                <span className="text-xs text-white/[0.55]">
                  {auditEvents.length > 0 ? `${auditEvents.length} latest events` : "Live pilot summary"}
                </span>
              </div>

              {auditEvents.length > 0 ? (
                <div className="divide-y divide-white/10">
                  {auditEvents.map((event) => (
                    <div key={event.id} className="grid gap-3 px-5 py-4 text-sm lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-medium text-white">{event.eventType}</p>
                          <StatusPill status={event.status} />
                          {event.toolName ? (
                            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs text-white/[0.68]">
                              {event.toolName}
                            </span>
                          ) : null}
                        </div>
                        <p className="mt-1 text-sm leading-6 text-white/[0.58]">
                          {event.message ?? "No message captured."}
                        </p>
                        <p className="mt-1 text-xs text-white/[0.42]">
                          {event.workflow ?? "workflow"} · {event.bookingId ?? "no booking ID"} · {event.actorType}
                        </p>
                      </div>
                      <time className="text-xs text-white/[0.48]" dateTime={event.createdAt}>
                        {formatEventTime(event.createdAt)}
                      </time>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="divide-y divide-white/10">
                  {[
                    {
                      title: "Guest website is live",
                      detail: `${dashboard.hotel.name} guests can book, check in, and check out from the hosted guest site.`,
                      status: "Live",
                    },
                    {
                      title: "Reservation data synced",
                      detail: `${dashboard.reservations.length} reservations and ${dashboard.inventory.length} rooms are visible to BookMe.`,
                      status: "Ready",
                    },
                    {
                      title: "Staff handoff is enabled",
                      detail: "Payment issues, refunds, disputes, and exceptions stay with hotel staff.",
                      status: "Ready",
                    },
                  ].map((event) => (
                    <div key={event.title} className="grid gap-3 px-5 py-4 text-sm lg:grid-cols-[1fr_auto] lg:items-center">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-medium text-white">{event.title}</p>
                          <StatusPill status={event.status} />
                        </div>
                        <p className="mt-1 text-sm leading-6 text-white/[0.58]">{event.detail}</p>
                      </div>
                      <span className="text-xs text-white/[0.48]">Now</span>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <AdminReservationsPanel hotelSlug={hotelConfig.slug} reservations={dashboard.reservations} />

            <section id="inventory" className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="liquid-glass overflow-hidden rounded-[1.5rem]">
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                  <BedDouble className="h-5 w-5" />
                  <div>
                    <h2 className="text-sm font-medium text-white">Room inventory</h2>
                    <p className="text-xs text-white/[0.5]">Current room status and rates used for guest quotes</p>
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
