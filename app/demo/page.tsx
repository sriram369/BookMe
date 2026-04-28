import Link from "next/link";
import { ArrowLeft, ArrowRight, CalendarDays, MapPin } from "lucide-react";
import { DotLoader } from "@/components/dot-loader";
import { FrontDeskChat } from "@/components/front-desk-chat";
import { SiteHeader } from "@/components/site-header";
import { adminRows } from "@/lib/demo-data";
import { findHotelConfig, getHotelConfig } from "@/lib/hotel/config-store";
import { notFound } from "next/navigation";

export default async function DemoPage({
  searchParams,
}: {
  searchParams?: { hotel?: string };
}) {
  const hotel = searchParams?.hotel
    ? await findHotelConfig(searchParams.hotel)
    : await getHotelConfig();
  if (!hotel) notFound();

  const rates = hotel.roomTypes.map((room) => Number(room.rate || 0)).filter(Number.isFinite);
  const lowestRate = rates.length ? Math.min(...rates) : 3499;
  const primaryRoomType = hotel.roomTypes[0]?.type ?? "Deluxe AC";

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative min-h-screen overflow-hidden">
        <SiteHeader variant="hotel" hotelName={hotel.hotelName} ctaLabel="Hotel Admin" ctaHref={`/admin?hotel=${hotel.slug}`} />

        <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-6 pb-24 pt-12 sm:px-8 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:pt-20">
          <section>
            <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to BookMe
            </Link>
            <div className="liquid-glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium text-white/[0.78]">
              <MapPin className="h-4 w-4 text-white" />
              {hotel.city}
            </div>
            <h1
              className="animate-fade-rise max-w-3xl text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl md:text-8xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Welcome to <em className="not-italic text-white/60">{hotel.hotelName}.</em>
            </h1>
            <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-white/[0.62] sm:text-lg">
              Book a room, check in, or check out with our AI front desk. No line, no phone call, no app download.
            </p>

            <div className="animate-fade-rise-delay-2 mt-12 grid gap-3 sm:grid-cols-3">
              {["Book a stay", "Check in", "Check out"].map((action) => (
                <a
                  key={action}
                  href="#front-desk"
                  className="liquid-glass rounded-full px-5 py-4 text-center text-sm font-medium text-white transition duration-300 hover:scale-[1.03]"
                >
                  {action}
                </a>
              ))}
            </div>

            <div className="liquid-glass mt-10 rounded-[1.5rem] p-5">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/[0.45]">
                    Tonight
                  </p>
                  <h2 className="mt-1 text-xl font-medium text-white">
                    {primaryRoomType} from ₹{lowestRate.toLocaleString("en-IN")}
                  </h2>
                </div>
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <div className="mt-5 grid gap-3 text-sm text-white/[0.58] sm:grid-cols-3">
                <span>{hotel.checkinWindow}</span>
                <span>{hotel.sourceSystem}</span>
                <span>Staff handoff ready</span>
              </div>
            </div>
          </section>

          <FrontDeskChat hotelSlug={hotel.slug} hotelName={hotel.hotelName} />
        </div>
      </section>

      <section className="border-t border-white/10 bg-black/25 px-5 py-16 sm:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1fr]">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/[0.45]">
              Demo admin
            </p>
            <h2
              className="mt-3 text-5xl font-normal leading-none tracking-[-1.2px] text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Reservations update behind the scenes.
            </h2>
            <p className="mt-4 text-base leading-7 text-white/[0.58]">
              This is the operator view we will connect to mock data first, then Google Sheets.
            </p>
          </div>

          <div className="liquid-glass overflow-hidden rounded-[1.5rem] shadow-card">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4 text-white">
              <span className="text-sm font-medium">Reservations</span>
              <DotLoader />
            </div>
            <div className="divide-y divide-white/10">
              {adminRows.map((row) => (
                <div key={row[0]} className="grid grid-cols-5 gap-3 px-5 py-4 text-sm">
                  {row.map((cell, index) => (
                    <span
                      key={cell}
                      className={index === 0 ? "font-medium text-white" : "text-white/[0.55]"}
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

      <section className="bg-black/40 px-5 py-14 text-white sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/[0.45]">
              Next step
            </p>
            <h2
              className="mt-2 text-4xl font-normal tracking-[-1px]"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Connect the real agent workflow.
            </h2>
          </div>
          <Link
            href="/"
            className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.03]"
          >
            View BookMe landing
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
