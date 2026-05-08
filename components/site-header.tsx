import Link from "next/link";

type SiteHeaderProps = {
  variant?: "product" | "hotel";
  ctaLabel?: string;
  ctaHref?: string;
  hotelName?: string;
  showAuthLinks?: boolean;
  showMarketingNav?: boolean;
};

export function SiteHeader({
  variant = "product",
  ctaLabel = "Try Demo",
  ctaHref = "/signup",
  hotelName = "Sriram Hotel",
  showAuthLinks = true,
  showMarketingNav = true,
}: SiteHeaderProps) {
  const isHotel = variant === "hotel";

  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6">
      <Link
        href="/"
        className="display-font text-3xl tracking-tight text-white"
        aria-label="BookMe home"
      >
        {isHotel ? hotelName : "BookMe"}
        <sup className="text-xs">®</sup>
      </Link>

      {showMarketingNav ? (
        <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
          <Link href="/" className="text-white transition-colors hover:text-white">
            Home
          </Link>
          <Link href="/demo" className="transition-colors hover:text-white">
            Demo
          </Link>
          <Link href="/solution" className="transition-colors hover:text-white">
            Solution
          </Link>
          <Link href="/onboarding" className="transition-colors hover:text-white">
            Onboarding
          </Link>
          <Link href="/#workflow" className="transition-colors hover:text-white">
            Workflows
          </Link>
          <Link href="/#pricing" className="transition-colors hover:text-white">
            Pricing
          </Link>
        </nav>
      ) : null}

      <div className="flex items-center gap-2">
        {showAuthLinks ? (
          <Link
            href="/signin"
            className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-flex"
          >
            Sign in
          </Link>
        ) : null}
        <Link
          href={ctaHref}
          className="liquid-glass rounded-full px-6 py-2.5 text-sm font-medium text-white transition duration-300 hover:scale-[1.03]"
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
