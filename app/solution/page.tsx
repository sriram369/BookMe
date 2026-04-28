import Link from "next/link";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SolutionOwnerConsole } from "@/components/solution-owner-console";
import { solutionDashboard } from "@/lib/solution/store";

export const dynamic = "force-dynamic";

export default function SolutionPage() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative overflow-hidden">
        <SiteHeader ctaLabel="Open Solution" ctaHref="/solution" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 sm:px-8">
          <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
            <Link href="/" className="inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Back to BookMe
            </Link>
            <Link href="/welcome_customer" className="liquid-glass inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.03]">
              Open welcome customer
              <ExternalLink className="h-4 w-4" />
            </Link>
          </div>
          <SolutionOwnerConsole initialDashboard={solutionDashboard()} />
        </div>
      </section>
    </main>
  );
}
