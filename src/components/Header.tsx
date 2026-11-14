import Link from "next/link";

export default function Header() {
  return (
    <header className="bg-slate-950 text-white">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 font-bold text-slate-950">
            C
          </span>
          <span className="text-xl font-semibold tracking-tight">CrawlAI</span>
        </Link>
        <nav className="flex items-center gap-4 text-sm sm:gap-6">
          <Link href="/" className="text-slate-200 transition hover:text-white">
            Check content
          </Link>
          <Link href="/how-it-works" className="text-slate-200 transition hover:text-white">
            How it works
          </Link>
        </nav>
      </div>
    </header>
  );
}
