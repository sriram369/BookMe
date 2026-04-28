"use client";

import { Github, Mail, ShieldCheck } from "lucide-react";
import { signIn } from "next-auth/react";
import Link from "next/link";

type OAuthPanelProps = {
  mode: "signin" | "signup";
  callbackUrl?: string;
  providers: {
    google: boolean;
    github: boolean;
  };
};

export function OAuthPanel({ mode, callbackUrl = "/onboarding", providers }: OAuthPanelProps) {
  const action = mode === "signin" ? "Sign in" : "Sign up";
  const hasProviders = providers.google || providers.github;

  return (
    <div className="liquid-glass w-full max-w-md rounded-[2rem] p-6">
      <div className="mb-6">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-white/[0.45]">
          Hotel operator access
        </p>
        <h1
          className="mt-3 text-5xl font-normal leading-none tracking-[-1.2px] text-white"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          {action} to BookMe.
        </h1>
        <p className="mt-4 text-sm leading-6 text-white/[0.58]">
          Use OAuth for the hotel owner workspace. After login, operators continue into onboarding and connect their reservation data.
        </p>
      </div>

      <div className="space-y-3">
        {providers.google ? (
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.02]"
          >
            <Mail className="h-4 w-4" />
            Continue with Google
          </button>
        ) : null}
        {providers.github ? (
          <button
            type="button"
            onClick={() => signIn("github", { callbackUrl })}
            className="liquid-glass flex w-full items-center justify-center gap-3 rounded-full px-5 py-3 text-sm font-medium text-white transition hover:scale-[1.02]"
          >
            <Github className="h-4 w-4" />
            Continue with GitHub
          </button>
        ) : null}
        {!hasProviders ? (
          <Link
            href={callbackUrl}
            className="flex w-full items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-medium text-zinc-950 transition hover:scale-[1.02]"
          >
            <ShieldCheck className="h-4 w-4" />
            Continue in local demo mode
          </Link>
        ) : null}
      </div>

      <div className="mt-6 rounded-[1.25rem] border border-white/10 bg-white/[0.04] p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-emerald-100" />
          <p className="text-xs leading-5 text-white/[0.55]">
            {hasProviders
              ? "OAuth is enabled for configured providers. Signed-in operators can continue into onboarding and the owner workspace."
              : "OAuth provider keys are not configured, so protected owner routes are open for local demo access."}
          </p>
        </div>
      </div>
    </div>
  );
}
