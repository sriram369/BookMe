import Link from "next/link";
import { ArrowLeft, Hotel } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SolutionOwnerConsole } from "@/components/solution-owner-console";
import { solutionDashboard } from "@/lib/solution/store";

export const dynamic = "force-dynamic";

export default function SolutionAdminPage() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative overflow-hidden">
        <SiteHeader ctaLabel="Guest check-in" ctaHref="/welcome_customer" />

        <div className="relative z-10 mx-auto max-w-7xl space-y-6 px-6 pb-16 pt-8 sm:px-8">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <Link
              href="/solution"
              className="liquid-glass inline-flex w-max items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium text-white transition hover:scale-[1.02]"
            >
              <ArrowLeft className="h-4 w-4" />
              Solution setup
            </Link>
            <Link
              href="/welcome_customer"
              className="inline-flex w-max items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-medium text-zinc-950 transition hover:scale-[1.02]"
            >
              <Hotel className="h-4 w-4" />
              Open guest welcome
            </Link>
          </div>

          <SolutionOwnerConsole initialDashboard={solutionDashboard()} />
        </div>
      </section>
    </main>
  );
}
