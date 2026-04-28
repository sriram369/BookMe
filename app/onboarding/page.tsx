import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OnboardingFlow } from "@/components/onboarding-flow";
import { SiteHeader } from "@/components/site-header";

export default function OnboardingPage() {
  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative overflow-hidden">
        <SiteHeader ctaLabel="Sign up" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 pb-20 pt-8 sm:px-8">
          <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to BookMe
          </Link>
          <OnboardingFlow />
        </div>
      </section>
    </main>
  );
}
