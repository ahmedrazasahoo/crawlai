import Link from "next/link";
import { LogoMark } from "./Header";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/80 bg-gradient-to-b from-white/70 via-white/60 to-emerald-50/50">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="flex items-center gap-2.5">
              <LogoMark size="sm" />
              <span className="font-bold tracking-tight text-slate-900">CrawlAI</span>
            </p>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              A detection and reporting tool only. CrawlAI inspects files and text on your device
              and reports what it finds. It does not change, clean, or rewrite your content, and
              the text edit workspace only ever applies words you type yourself.
            </p>
          </div>
          <nav aria-label="Footer" className="flex gap-2 text-sm">
            <Link
              href="/"
              className="min-h-11 rounded-full px-3.5 py-2.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              Check content
            </Link>
            <Link
              href="/how-it-works"
              className="min-h-11 rounded-full px-3.5 py-2.5 font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:outline-none"
            >
              How it works
            </Link>
          </nav>
        </div>
        <div className="mt-8 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-5 text-xs text-slate-500">
          <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800 shadow-sm ring-1 ring-emerald-200">
            <span aria-hidden="true" className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Privacy note: all checks run in your browser. Files you select are not uploaded to a
            server by this tool.
          </span>
        </div>
      </div>
    </footer>
  );
}
