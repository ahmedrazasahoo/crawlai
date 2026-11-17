"use client";

import { useState, type ReactNode } from "react";
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

export default function Home() {
  const [tab, setTab] = useState<Tab>("image");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <header className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Crawl
          <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            AI
          </span>
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Everything runs locally in your browser. Files and text never leave your device.
        </p>
        <div
          aria-hidden="true"
          className="mt-3 h-1 w-24 rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent"
        />
      </header>

      <section>
        <div
          role="tablist"
          aria-label="Content type to check"
          className="grid gap-3 rounded-[2rem] bg-white/50 p-2.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] ring-1 ring-slate-200/70 backdrop-blur-sm sm:grid-cols-3 sm:gap-4 sm:p-3"
        >
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`min-h-24 rounded-3xl border p-5 text-left transition-all duration-300 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:outline-none ${
                tab === item.id
                  ? "-translate-y-0.5 border-emerald-600 bg-gradient-to-b from-emerald-50 to-white shadow-xl shadow-emerald-600/15 ring-1 ring-emerald-600"
                  : "border-slate-200/70 bg-white/80 shadow-sm hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-lg hover:shadow-slate-900/5"
              }`}
            >
              <span className="flex items-center gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl transition-all duration-300 ${
                    tab === item.id
                      ? "brand-tile text-slate-950"
                      : "bg-slate-100 text-slate-500 ring-1 ring-slate-900/5"
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
