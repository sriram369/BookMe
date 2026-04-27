import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  Hotel,
  MessageSquareText,
  ShieldCheck,
} from "lucide-react";
import { ProductConsole } from "@/components/product-console";
import { SiteHeader } from "@/components/site-header";
import { VideoBackground } from "@/components/video-background";
import { operatorStats, trustItems, workflowCards } from "@/lib/demo-data";

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[hsl(var(--background))] text-white">
      <section className="video-hero">
        <VideoBackground />
        <SiteHeader ctaLabel="Sign up" />

        <div className="relative z-10 mx-auto grid w-full max-w-7xl gap-10 px-6 pb-40 pt-24 sm:px-8 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:pb-40 lg:pt-32">
          <div className="max-w-2xl">
            <div className="liquid-glass mb-6 inline-flex items-center rounded-full px-4 py-2 text-sm font-medium text-white/80">
              Built for independent hotels
            </div>

            <h1
              className="animate-fade-rise max-w-[860px] text-balance text-5xl font-normal leading-[0.95] tracking-[-2.46px] text-white sm:text-7xl md:text-8xl"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              The AI front desk for <em className="not-italic text-white/60">independent hotels.</em>
            </h1>
            <p className="animate-fade-rise-delay mt-8 max-w-2xl text-base leading-relaxed text-white/[0.62] sm:text-lg">
              Let guests book, check in, and check out through one calm, tool-grounded conversation.
            </p>

            <div className="animate-fade-rise-delay-2 mt-12 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/demo"
                className="liquid-glass inline-flex cursor-pointer items-center justify-center gap-2 rounded-full px-14 py-5 text-base font-medium text-white transition duration-300 hover:scale-[1.03]"
              >
                Try the demo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#workflow"
                className="liquid-glass inline-flex items-center justify-center rounded-full px-8 py-5 text-base font-medium text-white/80 transition duration-300 hover:scale-[1.03] hover:text-white"
              >
                See workflows
              </a>
            </div>
          </div>

          <ProductConsole />
        </div>
      </section>

      <section id="proof" className="border-y border-white/10 bg-black/25">
        <div className="mx-auto grid max-w-7xl gap-4 px-5 py-5 sm:grid-cols-3 sm:px-8">
          {operatorStats.map((stat) => (
            <div key={stat.label} className="liquid-glass rounded-2xl px-5 py-4">
              <p className="text-3xl font-medium text-white">{stat.value}</p>
              <p className="mt-1 text-sm font-medium text-white">{stat.label}</p>
              <p className="mt-1 text-sm text-white/[0.55]">{stat.detail}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="product" className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.7fr_1fr] lg:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/[0.45]">
              Product
            </p>
            <h2
              className="mt-3 text-5xl font-normal leading-none tracking-[-1.2px] text-white"
              style={{ fontFamily: "'Instrument Serif', serif" }}
            >
              Not a chatbot. A front-desk transaction system.
            </h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {trustItems.map((item) => (
              <div key={item.label} className="liquid-glass flex items-center gap-3 rounded-2xl p-4">
                <item.icon className="h-5 w-5 text-white" />
                <span className="text-sm font-medium text-white/[0.82]">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="bg-black/20 px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/[0.45]">
                Workflow
              </p>
              <h2
                className="mt-3 max-w-2xl text-5xl font-normal leading-none tracking-[-1.2px] text-white"
                style={{ fontFamily: "'Instrument Serif', serif" }}
              >
                Three front-desk jobs, one guest conversation.
              </h2>
            </div>
            <Link href="/demo" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
              Open Sriram Hotel demo
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {workflowCards.map((card, index) => (
              <article
                key={card.title}
                className="liquid-glass transition-slide rounded-[1.5rem] p-6"
                style={{ animationDelay: `${index * 90}ms` }}
              >
                <div className="liquid-glass mb-6 grid h-12 w-12 place-items-center rounded-2xl text-white">
                  <card.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-medium text-white">{card.title}</h3>
                <p className="mt-3 text-sm leading-6 text-white/[0.58]">{card.body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-5 py-20 sm:px-8 lg:grid-cols-[1fr_0.9fr] lg:items-center">
        <div className="liquid-glass rounded-[2rem] p-8 text-white shadow-soft">
          <div className="mb-8 flex items-center gap-3">
            <Hotel className="h-8 w-8 text-white" />
            <div>
              <p className="text-sm font-medium text-white">Sriram Hotel</p>
              <p className="text-sm text-white/[0.55]">Demo client template</p>
            </div>
          </div>
          <h2
            className="max-w-xl text-5xl font-normal leading-none tracking-[-1.2px] text-white"
            style={{ fontFamily: "'Instrument Serif', serif" }}
          >
            One website for the hotel. One reusable template for future clients.
          </h2>
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/60">
            The demo hotel shows exactly what a medium-sized property would give guests: room context, clear actions, and an AI front desk that completes the workflow.
          </p>
        </div>

        <div className="grid gap-4">
          {[
            ["BookMe landing", "Sells the product to hotel operators."],
            ["Hotel demo site", "Shows the guest-facing install for one client."],
            ["Admin console", "Shows reservations, inventory, and later eval scores."],
          ].map(([title, body]) => (
            <div key={title} className="liquid-glass flex gap-4 rounded-2xl p-5">
              <Check className="mt-1 h-5 w-5 shrink-0 text-white" />
              <div>
                <h3 className="font-medium text-white">{title}</h3>
                <p className="mt-1 text-sm leading-6 text-white/[0.58]">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-white/10 bg-black/30 px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-5 text-sm text-white/[0.55] md:flex-row">
          <p className="display-font text-2xl text-white">BookMe</p>
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
