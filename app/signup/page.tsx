import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { OAuthPanel } from "@/components/oauth-panel";
import { SiteHeader } from "@/components/site-header";
import { getOAuthProviderStatus } from "@/lib/auth/config";

type SignUpPageProps = {
  searchParams?: {
    callbackUrl?: string;
  };
};

function getSafeCallbackUrl(callbackUrl?: string) {
  if (!callbackUrl?.startsWith("/") || callbackUrl.startsWith("//")) {
    return "/onboarding";
  }

  return callbackUrl;
}

export default function SignUpPage({ searchParams }: SignUpPageProps) {
  const providers = getOAuthProviderStatus();
  const callbackUrl = getSafeCallbackUrl(searchParams?.callbackUrl);

  return (
    <main className="min-h-screen bg-[hsl(var(--background))] text-white">
      <section className="demo-static-hero relative min-h-screen overflow-hidden">
        <SiteHeader ctaLabel="Sign up" />
        <div className="relative z-10 mx-auto flex max-w-7xl flex-col px-6 pb-20 pt-10 sm:px-8">
          <Link href="/" className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-white/70 transition-colors hover:text-white">
            <ArrowLeft className="h-4 w-4" />
            Back to BookMe
          </Link>
          <OAuthPanel mode="signup" callbackUrl={callbackUrl} providers={providers} />
        </div>
      </section>
    </main>
  );
}
