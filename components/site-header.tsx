import Link from "next/link";

type SiteHeaderProps = {
  variant?: "product" | "hotel";
};

export function SiteHeader({ variant = "product" }: SiteHeaderProps) {
  const isHotel = variant === "hotel";

  return (
    <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8">
      <Link href="/" className="flex items-center gap-3" aria-label="BookMe home">
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-ink text-sm font-semibold text-cream">
          B
        </span>
        <span>
          <span className="block text-sm font-semibold tracking-wide text-ink">
            {isHotel ? "Sriram Hotel" : "BookMe"}
          </span>
          <span className="block text-xs text-sage">
            {isHotel ? "Powered by BookMe" : "AI front desk"}
          </span>
        </span>
      </Link>

      <nav className="hidden items-center gap-7 text-sm text-sage md:flex">
        <Link href="/#product" className="transition hover:text-ink">
          Product
        </Link>
        <Link href="/#workflow" className="transition hover:text-ink">
          Workflow
        </Link>
        <Link href="/demo" className="transition hover:text-ink">
          Demo hotel
        </Link>
        <Link href="/#proof" className="transition hover:text-ink">
          Proof
        </Link>
      </nav>

      <Link
        href="/demo"
        className="rounded-full bg-moss px-4 py-2 text-sm font-semibold text-white shadow-card transition hover:-translate-y-0.5 hover:bg-ink"
      >
        Try demo
      </Link>
    </header>
  );
}
