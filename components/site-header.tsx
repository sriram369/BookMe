import Link from "next/link";

type SiteHeaderProps = {
  variant?: "product" | "hotel";
  ctaLabel?: string;
};

export function SiteHeader({ variant = "product", ctaLabel = "Try Demo" }: SiteHeaderProps) {
  const isHotel = variant === "hotel";

  return (
    <header className="relative z-10 mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-6">
      <Link
        href="/"
        className="display-font text-3xl tracking-tight text-white"
        aria-label="BookMe home"
      >
        {isHotel ? "Sriram Hotel" : "BookMe"}
        <sup className="text-xs">®</sup>
      </Link>

      <nav className="hidden items-center gap-7 text-sm text-white/60 md:flex">
        <Link href="/" className="text-white transition-colors hover:text-white">
          Home
        </Link>
        <Link href="/#product" className="transition-colors hover:text-white">
          Studio
        </Link>
        <Link href="/#workflow" className="transition-colors hover:text-white">
          About
        </Link>
        <Link href="/#proof" className="transition-colors hover:text-white">
          Journal
        </Link>
        <Link href="/demo" className="transition-colors hover:text-white">
          Reach Us
        </Link>
      </nav>

      <div className="flex items-center gap-2">
        <Link
          href="/admin"
          className="hidden rounded-full px-4 py-2.5 text-sm font-medium text-white/70 transition-colors hover:text-white sm:inline-flex"
        >
          Sign in
        </Link>
        <Link
          href="/admin"
          className="liquid-glass rounded-full px-6 py-2.5 text-sm font-medium text-white transition duration-300 hover:scale-[1.03]"
        >
          {ctaLabel}
        </Link>
      </div>
    </header>
  );
}
