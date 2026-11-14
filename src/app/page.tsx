"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import ImageInspector from "@/components/ImageInspector";
import FileInspector from "@/components/FileInspector";
import TextInspector from "@/components/TextInspector";

type Tab = "image" | "file" | "text";

const TABS: { id: Tab; label: string; description: string; icon: ReactNode }[] = [
  {
    id: "image",
    label: "Image",
    description: "EXIF, IPTC, XMP, C2PA, and AI source metadata in JPG, PNG, and WebP files.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <circle cx="9" cy="10" r="1.6" />
        <path d="M4 18l5.5-5 3.5 3L17 12l3 3" />
      </svg>
    ),
  },
  {
    id: "file",
    label: "PDF, Video, Audio",
    description: "Document fields, encoder strings, and provenance markers in PDF, video, and audio files.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4" />
        <path d="M9.5 12h6M9.5 15.5h6" />
      </svg>
    ),
  },
  {
    id: "text",
    label: "Text",
    description: "A feedback report on writing patterns, with sentence highlighting and a workspace where you edit the text yourself.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
        <path d="M5 5h14M5 9.5h14M5 14h9M5 18.5h12" />
      </svg>
    ),
  },
];

const STEPS = [
  { number: 1, title: "Choose a type", text: "Image, file, or text." },
  { number: 2, title: "Paste or upload", text: "Everything stays on your device." },
  { number: 3, title: "See the report", text: "Scores, highlights, and reasons in plain language." },
];

const PROMISES = ["Everything runs locally in your browser", "No uploads, no accounts", "Detection and reporting only"];

export default function Home() {
  const [tab, setTab] = useState<Tab>("image");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="relative overflow-hidden rounded-3xl bg-slate-950 px-6 py-10 text-white shadow-2xl shadow-slate-950/20 sm:px-10 sm:py-14">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(560px 300px at 88% -10%, rgba(52,211,153,0.35), transparent 65%), radial-gradient(480px 260px at -5% 110%, rgba(13,148,136,0.28), transparent 60%)",
          }}
        />
        <div className="relative max-w-3xl">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-300 uppercase">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-emerald-400" />
            Detection and reporting only
          </p>
          <h1 className="mt-5 text-4xl font-bold tracking-tight text-balance sm:text-5xl">
            See what provenance and AI signals are hiding in your content
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
            CrawlAI inspects an image, a file, or a piece of text and reports what it finds in
            plain language: Content Credentials, metadata, generator markers, and writing
            patterns, with the reasons shown next to every score.
          </p>
          <ul className="mt-6 flex flex-wrap gap-2.5">
            {PROMISES.map((promise) => (
              <li
                key={promise}
                className="flex items-center gap-2 rounded-full bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-100 ring-1 ring-white/15"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" className="h-4 w-4 text-emerald-400" aria-hidden="true">
                  <path d="M4.5 12.5l5 5L19.5 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {promise}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-sm leading-6 text-slate-400">
            Honest by design: this tool only inspects and reports. It does not remove, alter,
            clean, or rewrite anything, and no result here proves who created a piece of content.{" "}
            <Link
              href="/how-it-works"
              className="font-medium text-emerald-300 underline decoration-emerald-400/50 underline-offset-4 transition hover:text-emerald-200 focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:outline-none"
            >
              Read how it works
            </Link>
            .
          </p>
        </div>
      </section>

      <section aria-label="How to use CrawlAI" className="mt-8">
        <ol className="grid gap-4 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="panel group flex items-start gap-3.5 p-5 transition duration-300 hover:-translate-y-0.5"
            >
              <span className="brand-tile flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-slate-950">
                {step.number}
              </span>
              <span>
                <span className="block font-semibold text-slate-900">
                  Step {step.number}: {step.title}
                </span>
                <span className="mt-0.5 block text-sm leading-6 text-slate-600">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-8">
        <div role="tablist" aria-label="Content type to check" className="grid gap-4 sm:grid-cols-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`min-h-24 rounded-2xl border p-5 text-left transition duration-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                tab === item.id
                  ? "border-emerald-600 bg-emerald-50/80 shadow-lg shadow-emerald-600/10 ring-1 ring-emerald-600"
                  : "border-slate-200/80 bg-white shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition ${
                    tab === item.id
                      ? "brand-tile text-slate-950"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="text-lg font-semibold tracking-tight text-slate-900">{item.label}</span>
              </span>
              <span className="mt-3 block text-sm leading-6 text-slate-600">{item.description}</span>
            </button>
          ))}
        </div>

        <div className="panel mt-6 p-4 sm:p-7">
          {tab === "image" && <ImageInspector />}
          {tab === "file" && <FileInspector />}
          {tab === "text" && <TextInspector />}
        </div>
      </section>
    </div>
  );
}
