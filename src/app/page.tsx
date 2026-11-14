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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
        <path d="M6 3h8l4 4v14H6z" />
        <path d="M14 3v4h4" />
        <path d="M9.5 12h6M9.5 15.5h6" />
      </svg>
    ),
  },
  {
    id: "text",
    label: "Text",
    description: "A feedback report on writing patterns, with sentence highlighting. No rewriting, only measurement and explanation.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
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

export default function Home() {
  const [tab, setTab] = useState<Tab>("image");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-12">
      <section className="max-w-3xl">
        <p className="text-sm font-semibold tracking-wide text-emerald-700 uppercase">
          Detection and reporting only
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
          What provenance and AI signals are in your content?
        </h1>
        <p className="mt-3 text-base text-slate-600 sm:text-lg">
          Upload an image or a file, or paste text, and CrawlAI reports what it finds in plain
          language: Content Credentials, metadata, generator markers, and writing patterns.
        </p>
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p>
            <strong className="text-slate-900">Private by design:</strong> every check runs in your
            browser on this device. Your files and text are not uploaded to a server.
          </p>
          <p className="mt-2">
            <strong className="text-slate-900">Honest by design:</strong> this tool only inspects
            and reports. It does not remove, alter, clean, or rewrite anything, and no result here
            proves who created a piece of content.{" "}
            <Link href="/how-it-works" className="font-medium text-emerald-700 underline">
              Read how it works
            </Link>
            .
          </p>
        </div>
      </section>

      <section aria-label="How to use CrawlAI" className="mt-8">
        <ol className="grid gap-3 sm:grid-cols-3">
          {STEPS.map((step) => (
            <li
              key={step.number}
              className="flex items-start gap-3 rounded-xl border border-slate-200 bg-white p-4"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-950 text-sm font-bold text-white">
                {step.number}
              </span>
              <span>
                <span className="block font-semibold text-slate-900">
                  Step {step.number}: {step.title}
                </span>
                <span className="mt-0.5 block text-sm text-slate-600">{step.text}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6">
        <div role="tablist" aria-label="Content type to check" className="grid gap-3 sm:grid-cols-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`min-h-24 rounded-xl border p-5 text-left transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                tab === item.id
                  ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <span className="flex items-center gap-3">
                <span className={tab === item.id ? "text-emerald-700" : "text-slate-500"}>
                  {item.icon}
                </span>
                <span className="text-lg font-semibold text-slate-900">{item.label}</span>
              </span>
              <span className="mt-2 block text-sm text-slate-600">{item.description}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          {tab === "image" && <ImageInspector />}
          {tab === "file" && <FileInspector />}
          {tab === "text" && <TextInspector />}
        </div>
      </section>
    </div>
  );
}
