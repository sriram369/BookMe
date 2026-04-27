import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Hotel,
  MessageSquareText,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { ProductConsole } from "@/components/product-console";
import { SiteHeader } from "@/components/site-header";
import { operatorStats, trustItems, workflowCards } from "@/lib/demo-data";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-parchment">
      <section className="grain-surface relative">
        <div className="grain-overlay" />
        <SiteHeader />

        <div className="mx-auto grid w-full max-w-7xl gap-10 px-5 pb-20 pt-10 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:pb-24 lg:pt-14">
          <div className="max-w-2xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-moss/15 bg-white/72 px-3 py-2 text-sm font-medium text-moss shadow-card">
              <Sparkles className="h-4 w-4 text-brass" />
              Built for independent hotels
            </div>

            <h1 className="max-w-[780px] text-balance text-5xl font-semibold leading-[0.96] tracking-normal text-ink sm:text-6xl lg:text-7xl">
              The AI front desk for independent hotels.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-sage">
              Let guests book, check in, and check out through one calm, tool-grounded conversation.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-ink px-6 py-3 text-sm font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-moss"
              >
                Try the demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#workflow"
                className="inline-flex items-center justify-center rounded-full border border-ink/10 bg-white/70 px-6 py-3 text-sm font-semibold text-ink transition hover:-translate-y-0.5 hover:border-moss/30"
              >
                See workflows
              </a>
            </div>
          </div>

          <ProductConsole />
        </div>
      </section>

      <section id="proof" className="border-y border-ink/8 bg-white/60">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 sm:grid-cols-3 sm:px-8">
          {operatorStats.map((stat) => (
            <div key={stat.label} className="rounded-2xl border border-ink/8 bg-parchment px-5 py-4">
              <p className="text-3xl font-semibold text-ink">{stat.value}</p>
              <p className="mt-1 text-sm font-semibold text-ink">{stat.label}</p>
              <p className="mt-1 text-sm text-sage">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">
              Product
            </p>
            <h2 className="mt-3 text-4xl font-semibold tracking-normal text-ink">
              Not a chatbot. A front-desk transaction system.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-2xl border border-ink/8 bg-white p-4 shadow-card">
                <item.icon className="h-5 w-5 text-moss" />
                <span className="text-sm font-semibold text-ink">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-cream px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brass">
                Workflow
              </p>
              <h2 className="mt-3 max-w-2xl text-4xl font-semibold tracking-normal text-ink">
                Three front-desk jobs, one guest conversation.
              </h2>
            </div>
            <Link href="/demo" className="inline-flex items-center gap-2 text-sm font-semibold text-moss">
              Open Sriram Hotel demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {workflowCards.map((card, index) => (
              <article
                key={card.title}
                className="transition-slide rounded-[1.5rem] border border-ink/8 bg-white p-6 shadow-card"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="mb-6 grid h-12 w-12 place-items-center rounded-2xl bg-moss/10 text-moss">
                  <card.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-ink">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-sage">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="rounded-[2rem] border border-ink/8 bg-ink p-8 text-cream shadow-soft">
          <div className="mb-8 flex items-center gap-3">
            <Hotel className="h-8 w-8 text-brass" />
            <div>
              <p className="text-sm font-semibold text-white">Sriram Hotel</p>
              <p className="text-sm text-cream/70">Demo client template</p>
            </div>
          </div>
          <h2 className="max-w-xl text-4xl font-semibold tracking-normal text-white">
            One website for the hotel. One reusable template for future clients.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-cream/72">
            The demo hotel shows exactly what a medium-sized property would give guests: room context, clear actions, and an AI front desk that completes the workflow.
          </p>
        </div>

        <div className="grid gap-4">
          {[
            ["BookMe landing", "Sells the product to hotel operators."],
            ["Hotel demo site", "Shows the guest-facing install for one client."],
            ["Admin console", "Shows reservations, inventory, and later eval scores."],
          ].map(([title, body]) => (
            <div key={title} className="flex gap-4 rounded-2xl border border-ink/8 bg-white p-5 shadow-card">
              <Check className="mt-1 h-5 w-5 shrink-0 text-moss" />
              <div>
                <h3 className="font-semibold text-ink">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-sage">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-ink/8 bg-white px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-sage md:flex-row">
          <p className="font-semibold text-ink">BookMe</p>
          <div className="flex flex-wrap gap-5">
            <span className="inline-flex items-center gap-2">
              <MessageSquareText className="h-4 w-4" />
              Guest automation
            </span>
            <span className="inline-flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Demo-ready evals
            </span>
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              Tool-grounded answers
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
