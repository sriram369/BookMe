import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SolutionWelcomeFlow } from "@/components/solution-welcome-flow";

export const dynamic = "force-dynamic";

export default function WelcomeCustomerPage() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative min-h-screen overflow-hidden">
        <SiteHeader variant="hotel" ctaLabel="Owner Console" ctaHref="/solution" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 sm:px-8">
          <Link href="/solution" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to Solution
          </Link>
          <SolutionWelcomeFlow />
        </div>
      </section>
    </main>
  );
}
