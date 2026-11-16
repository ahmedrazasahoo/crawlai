"use client";

import { useCallback, useState } from "react";
import {
  AI_GENERATOR_NAMES,
  GENERAL_CAVEAT,
  PROVENANCE_INDICATORS,
  arrayBufferToLatin1,
  cleanPrintable,
  detectFormat,
  formatFileSize,
  scanIndicators,
  snippetAround,
  type FieldRow,
} from "@/lib/byteScan";
import { FileDropZone, MetadataTable, ReportSummaryStrip, VerdictCard } from "./ReportBits";

interface FileReport {
  fileName: string;
  size: string;
  format: string;
  kind: string;
  rows: FieldRow[];
  c2paFound: boolean;
  aiFound: boolean;
  aiDetail: string;
}

function pdfField(raw: string, key: string): string | null {
  const pattern = new RegExp(`/${key}\\s*\\(([^\\)]{0,300})\\)`);
  const match = raw.match(pattern);
  if (match) return cleanPrintable(match[1]);
  const hexPattern = new RegExp(`/${key}\\s*<([0-9A-Fa-f\\s]{4,600})>`);
  const hexMatch = raw.match(hexPattern);
  if (hexMatch) {
    const hex = hexMatch[1].replace(/\s+/g, "");
    let text = "";
    for (let i = 0; i + 3 < hex.length; i += 2) {
      text += String.fromCharCode(parseInt(hex.slice(i, i + 2), 16));
    }
    return cleanPrintable(text) || null;
  }
  return null;
}

export default function FileInspector() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<FileReport | null>(null);

  const inspect = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const raw = arrayBufferToLatin1(buffer);
      const lowerName = file.name.toLowerCase();
      const isPdf = file.type === "application/pdf" || lowerName.endsWith(".pdf");
      const isVideo =
        file.type.startsWith("video/") || /\.(mp4|mov|m4v|webm)$/.test(lowerName);
      const isAudio =
        file.type.startsWith("audio/") || /\.(mp3|wav|m4a|ogg|flac)$/.test(lowerName);
      const kind = isPdf ? "PDF document" : isVideo ? "Video file" : isAudio ? "Audio file" : "File";

      const rows: FieldRow[] = [];

      if (isPdf) {
        for (const key of ["Producer", "Creator", "Title", "Author", "Subject", "Keywords", "CreationDate", "ModDate"]) {
          const value = pdfField(raw, key);
          if (value) rows.push({ field: `/${key}`, value });
        }
        const xmpIndex = raw.indexOf("<x:xmpmeta");
        if (xmpIndex !== -1) {
          rows.push({
            field: "XMP metadata packet",
            value: cleanPrintable(raw.slice(xmpIndex, xmpIndex + 800)).slice(0, 500),
          });
        }
        const header = raw.slice(0, 20).match(/%PDF-[0-9.]+/);
        if (header) rows.push({ field: "PDF header", value: header[0] });
      } else {
        const probes = [
          "Lavf",
          "Lavc",
          "encoder",
          "Encoder",
          "major_brand",
          "minor_version",
          "compatible_brands",
          "creation_time",
          "com.apple.quicktime",
          "HandBrake",
          "ffmpeg",
          "iTunSMPB",
          "TXXX",
          "TSSE",
          "WXXX",
        ];
        for (const probe of probes) {
          const snippet = snippetAround(raw, probe, 50);
          if (snippet) rows.push({ field: `Byte scan: ${probe}`, value: snippet });
        }
        if (raw.includes("ftyp")) {
          const snippet = snippetAround(raw, "ftyp", 30);
          if (snippet) rows.push({ field: "Container box: ftyp", value: snippet });
        }
        if (raw.includes("ID3")) {
          rows.push({ field: "ID3 tag", value: "An ID3 metadata block is present at the start of the file" });
        }
        if (raw.slice(0, 4) === "RIFF") {
          rows.push({ field: "RIFF header", value: "RIFF container, commonly used by WAV files" });
        }
      }

      const provenanceHits = scanIndicators(raw, PROVENANCE_INDICATORS);
      const generatorHits = scanIndicators(raw, AI_GENERATOR_NAMES);
      for (const hit of provenanceHits) {
        rows.push({
          field: `Provenance indicator: ${hit.indicator}`,
          value: `Found ${hit.count} time${hit.count === 1 ? "" : "s"} in the file bytes`,
        });
      }
      for (const hit of generatorHits) {
        rows.push({
          field: `Generator name: ${hit.indicator}`,
          value: `Found ${hit.count} time${hit.count === 1 ? "" : "s"} in the file bytes`,
        });
      }

      const c2paFound = provenanceHits.some((h) =>
        ["c2pa", "contentcredentials", "jumbf"].includes(h.indicator.toLowerCase())
      );
      const aiFound =
        generatorHits.length > 0 ||
        provenanceHits.some((h) => /trainedalgorithmicmedia|digitalsourcetype/i.test(h.indicator));

      setReport({
        fileName: file.name,
        size: formatFileSize(file.size),
        format: detectFormat(file),
        kind,
        rows,
        c2paFound,
        aiFound,
        aiDetail: aiFound
          ? "An AI generator name or an AI source type marker was found in the bytes scanned here. Check the table below for the exact strings."
          : "No AI generator name and no AI source type marker was found in the bytes scanned here.",
      });
    } catch {
      setError("Something went wrong while reading that file. Try a PDF, MP4, MOV, MP3, or WAV file.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <FileDropZone
        accept=".pdf,.mp4,.mov,.m4v,.mp3,.wav,.m4a,application/pdf,video/mp4,video/quicktime,audio/mpeg,audio/wav"
        label="Drop a PDF, video, or audio file here"
        hint="Supported: PDF, MP4, MOV, MP3, and WAV. The report lists document fields, container and encoder strings, and any provenance markers found in the bytes."
        onFile={inspect}
        dragging={dragging}
        setDragging={setDragging}
      />
      {loading && <p className="text-sm text-slate-600">Reading the file on your device...</p>}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}
      {report && (
        <div className="space-y-6">
          {(() => {
            const checks = [
              report.c2paFound,
              report.aiFound,
              report.rows.length > 0,
              report.rows.some(
                (row) =>
                  row.field.startsWith("Provenance indicator") ||
                  row.field.startsWith("Generator name")
              ),
            ];
            const findings = checks.filter(Boolean).length;
            return (
              <ReportSummaryStrip
                checksRun={checks.length}
                findingsFound={findings}
                cleanChecks={checks.length - findings}
              />
            );
          })()}
          <div className="panel p-4 sm:p-5">
            <p className="font-semibold text-slate-900">File summary</p>
            <dl className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">File name</dt>
                <dd className="text-right break-all text-slate-800">{report.fileName}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Type</dt>
                <dd className="text-slate-800">{report.kind}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Size</dt>
                <dd className="text-slate-800">{report.size}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-slate-500">Format</dt>
                <dd className="text-slate-800">{report.format}</dd>
              </div>
            </dl>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">Provenance verdict</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <VerdictCard
                title="Content Credentials (C2PA)"
                found={report.c2paFound}
                detail={
                  report.c2paFound
                    ? "A Content Credentials (C2PA) marker was found in this file. A tool recorded provenance information in it."
                    : "No Content Credentials (C2PA) marker, such as a c2pa or jumbf box, was found in the bytes scanned here."
                }
              />
              <VerdictCard title="AI source metadata" found={report.aiFound} detail={report.aiDetail} />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
              <p className="font-semibold">What this scan can and cannot do</p>
              <p className="mt-1">
                This scan reads readable metadata and container strings. It cannot check an invisible
                in-content watermark such as SynthID in video frames or audio. Only the watermark
                owner&apos;s own detector can check that kind of mark.
              </p>
              <p className="mt-2">{GENERAL_CAVEAT}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">Fields and strings found</h3>
            <MetadataTable
              rows={report.rows}
              emptyText="No document fields, encoder strings, or provenance markers from the built in list were found in this file."
            />
          </div>
        </div>
      )}
    </div>
  );
}
