import Link from "next/link";
import { ArrowLeft, Check, CreditCard, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { getConfigStatus } from "@/lib/auth/config";

export default function CheckoutPage() {
  const config = getConfigStatus();
  const paymentReady = config.payments.configured;

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative min-h-screen overflow-hidden">
        <SiteHeader ctaLabel="Open demo" ctaHref="/demo?hotel=sriram-hotel" />
        <div className="relative z-10 mx-auto max-w-5xl px-6 pb-20 pt-8 sm:px-8">
          <Link href="/onboarding" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to onboarding
          </Link>

          <section className="liquid-glass rounded-[2rem] p-6 sm:p-8">
            <p className="mb-4 inline-flex rounded-full bg-white/10 px-3 py-1.5 text-sm font-medium text-white/[0.72]">
              BookMe pilot checkout
            </p>
            <div className="grid gap-8 lg:grid-cols-[1fr_360px] lg:items-start">
              <div>
                <h1
                  className="text-5xl font-normal leading-[0.95] tracking-[-2px] text-white sm:text-7xl"
                  style={{ fontFamily: "'Instrument Serif', serif" }}
                >
                  Start with the Pilot plan.
                </h1>
                <p className="mt-5 max-w-2xl text-base leading-7 text-white/[0.62]">
                  This is the payment wall after owner onboarding. For the class demo, live payments are disabled unless Razorpay test credentials are configured.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    "Guest web AI front desk",
                    "Google Sheets backend",
                    "Booking, check-in, checkout",
                    "Admin dashboard and safe payment handoff",
                  ].map((item) => (
                    <div key={item} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.05] p-3 text-sm text-white/[0.72]">
                      <Check className="h-4 w-4 text-emerald-100" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <aside className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
                <div className="mb-5 flex items-center justify-between">
                  <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-zinc-950">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/[0.65]">
                    {paymentReady ? "Payment ready" : "Demo mode"}
                  </span>
                </div>
                <h2 className="text-2xl font-medium text-white">Pilot</h2>
                <p className="mt-2 text-sm text-white/[0.5]">For one demo property</p>
                <p className="mt-5 text-3xl font-medium text-white">₹9,999/mo</p>
                <p className="mt-1 text-sm text-white/[0.5]">₹14,999 setup</p>

                <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="flex gap-3">
                    <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-100" />
                    <p className="text-sm leading-6 text-white/[0.62]">
                      {paymentReady
                        ? "Razorpay is configured. A production checkout can be enabled here."
                        : "Razorpay is not configured, so BookMe will not collect payment in this demo."}
                    </p>
                  </div>
                </div>

                <Link
                  href="/admin?hotel=sriram-hotel"
                  className="mt-5 flex w-full items-center justify-center rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.02]"
                >
                  Continue to admin demo
                </Link>
              </aside>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
