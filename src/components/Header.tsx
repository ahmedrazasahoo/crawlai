import Link from "next/link";

export function LogoMark({ size = "md" }: { size?: "md" | "sm" }) {
  const box = size === "md" ? "h-10 w-10 rounded-xl" : "h-8 w-8 rounded-lg";
  const glyph = size === "md" ? "h-5.5 w-5.5" : "h-4.5 w-4.5";
  return (
    <span
      aria-hidden="true"
      className={`brand-tile flex shrink-0 items-center justify-center text-slate-950 ${box}`}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className={glyph}>
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="M15.3 15.3L21 21" strokeLinecap="round" />
        <path d="M7.8 10.5h5.4M10.5 7.8v5.4" strokeLinecap="round" strokeWidth="1.6" />
      </svg>
    </span>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-emerald-300/15 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white shadow-lg shadow-slate-950/20 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2.5 rounded-lg focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 focus-visible:outline-none"
        >
          <LogoMark />
          <span className="leading-tight">
            <span className="block text-lg font-bold tracking-tight">CrawlAI</span>
            <span className="block text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              Provenance checker
            </span>
          </span>
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-300 shadow-[0_0_18px_-6px_rgba(52,211,153,0.7)] md:flex">
            <span aria-hidden="true" className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            Runs 100% locally
          </span>
          <nav aria-label="Main" className="flex items-center gap-1 text-sm sm:gap-2">
            <Link
              href="/"
              className="min-h-11 rounded-full px-3.5 py-2.5 font-medium text-slate-200 transition-all hover:bg-white/10 hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              Check content
            </Link>
            <Link
              href="/how-it-works"
              className="min-h-11 rounded-full px-3.5 py-2.5 font-medium text-slate-200 transition-all hover:bg-white/10 hover:text-white hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              How it works
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
