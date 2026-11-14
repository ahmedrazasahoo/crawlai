import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50">
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="font-semibold text-slate-900">CrawlAI</p>
            <p className="mt-1 max-w-md text-sm text-slate-600">
              A detection and reporting tool only. CrawlAI inspects files and text on your device
              and reports what it finds. It does not change, clean, or rewrite your content.
            </p>
          </div>
          <nav className="flex gap-5 text-sm text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              Check content
            </Link>
            <Link href="/how-it-works" className="hover:text-slate-900">
              How it works
            </Link>
          </nav>
        </div>
        <p className="mt-6 text-xs text-slate-500">
          Privacy note: all checks run in your browser. Files you select are not uploaded to a
          server by this tool.
        </p>
      </div>
    </footer>
  );
}
