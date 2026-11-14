"use client";

import { useState } from "react";
import Link from "next/link";
import ImageInspector from "@/components/ImageInspector";
import FileInspector from "@/components/FileInspector";
import TextInspector from "@/components/TextInspector";

type Tab = "image" | "file" | "text";

const TABS: { id: Tab; label: string; description: string }[] = [
  {
    id: "image",
    label: "Image",
    description: "EXIF, IPTC, XMP, C2PA, and AI source metadata in JPG, PNG, and WebP files.",
  },
  {
    id: "file",
    label: "PDF, Video, Audio",
    description: "Document fields, encoder strings, and provenance markers in PDF, video, and audio files.",
  },
  {
    id: "text",
    label: "Text",
    description: "A feedback report on writing patterns. No rewriting, only measurement and explanation.",
  },
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

      <section className="mt-8">
        <div role="tablist" aria-label="Content type to check" className="grid gap-3 sm:grid-cols-3">
          {TABS.map((item) => (
            <button
              key={item.id}
              role="tab"
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
              className={`rounded-xl border p-4 text-left transition ${
                tab === item.id
                  ? "border-emerald-600 bg-emerald-50 ring-1 ring-emerald-600"
                  : "border-slate-200 bg-white hover:border-slate-400"
              }`}
            >
              <span className="font-semibold text-slate-900">{item.label}</span>
              <span className="mt-1 block text-sm text-slate-600">{item.description}</span>
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
