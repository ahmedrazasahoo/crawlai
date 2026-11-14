"use client";

import { useCallback, useState } from "react";
import {
  AI_GENERATOR_NAMES,
  GENERAL_CAVEAT,
  PROVENANCE_INDICATORS,
  SYNTHID_NOTE,
  arrayBufferToLatin1,
  detectFormat,
  flattenMetadata,
  formatFileSize,
  scanIndicators,
  type FieldRow,
} from "@/lib/byteScan";
import { FileDropZone, MetadataTable, VerdictCard } from "./ReportBits";

interface ImageReport {
  fileName: string;
  size: string;
  format: string;
  dimensions: string;
  previewUrl: string;
  metadataRows: FieldRow[];
  c2paFound: boolean;
  c2paDetail: string;
  aiFound: boolean;
  aiDetail: string;
  software: string | null;
  indicatorRows: FieldRow[];
}

export default function ImageInspector() {
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [report, setReport] = useState<ImageReport | null>(null);

  const inspect = useCallback(async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const buffer = await file.arrayBuffer();
      const raw = arrayBufferToLatin1(buffer);

      let metadataRows: FieldRow[] = [];
      let parsed: Record<string, unknown> | undefined;
      try {
        const exifr = (await import("exifr")).default;
        parsed = (await exifr.parse(file, {
          tiff: true,
          exif: true,
          gps: true,
          interop: true,
          iptc: true,
          jfif: true,
          ihdr: true,
          xmp: true,
          icc: true,
          makerNote: false,
          userComment: false,
        })) as Record<string, unknown> | undefined;
        metadataRows = flattenMetadata(parsed);
      } catch {
        metadataRows = [];
      }

      const dimensions = await new Promise<string>((resolve) => {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = () => resolve(`${img.naturalWidth} x ${img.naturalHeight} pixels`);
        img.onerror = () => resolve("Could not read dimensions");
        img.src = url;
      });

      const provenanceHits = scanIndicators(raw, PROVENANCE_INDICATORS);
      const generatorHits = scanIndicators(raw, AI_GENERATOR_NAMES);
      const metaText = metadataRows.map((r) => `${r.field} ${r.value}`).join(" ").toLowerCase();

      const c2paTerms = ["c2pa", "contentcredentials", "jumbf", "content credentials"];
      const c2paFound =
        provenanceHits.some((h) => c2paTerms.includes(h.indicator.toLowerCase())) ||
        metaText.includes("c2pa");

      const aiTermsFound = new Set<string>();
      for (const hit of generatorHits) aiTermsFound.add(hit.indicator);
      for (const hit of provenanceHits) {
        if (/trainedalgorithmicmedia|digitalsourcetype|algorithmicmedia/i.test(hit.indicator)) {
          aiTermsFound.add(hit.indicator);
        }
      }
      if (metaText.includes("trainedalgorithmicmedia")) aiTermsFound.add("TrainedAlgorithmicMedia");
      const aiFound = aiTermsFound.size > 0;

      const softwareRow = metadataRows.find((r) =>
        /software|creatortool|creator tool|processingsoftware/i.test(r.field)
      );
      const previewUrl = URL.createObjectURL(file);

      const indicatorRows: FieldRow[] = [
        ...provenanceHits.map((h) => ({
          field: `Byte scan: ${h.indicator}`,
          value: `Found ${h.count} time${h.count === 1 ? "" : "s"} in the file bytes`,
        })),
        ...generatorHits.map((h) => ({
          field: `Byte scan: ${h.indicator}`,
          value: `Found ${h.count} time${h.count === 1 ? "" : "s"} in the file bytes`,
        })),
      ];

      setReport({
        fileName: file.name,
        size: formatFileSize(file.size),
        format: detectFormat(file),
        dimensions,
        previewUrl,
        metadataRows,
        c2paFound,
        c2paDetail: c2paFound
          ? "A Content Credentials (C2PA) marker was found in this file. That means a tool recorded provenance information in it. Open the source listed in the metadata table to learn more."
          : "No Content Credentials (C2PA) marker was found in the metadata or file bytes scanned here. See the important note below before drawing any conclusion.",
        aiFound,
        aiDetail: aiFound
          ? `AI related metadata was found: ${Array.from(aiTermsFound).join(", ")}. This suggests an AI tool or an AI source type was recorded for this image.`
          : "No AI generator name and no AI source type metadata was found in the fields scanned here.",
        software: softwareRow ? softwareRow.value : null,
        indicatorRows,
      });
    } catch {
      setError("Something went wrong while reading that image. Try a JPG, PNG, or WebP file.");
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="space-y-6">
      <FileDropZone
        accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
        label="Drop an image here, or choose one"
        hint="Supported formats: JPG, PNG, and WebP. The report covers EXIF, IPTC, and XMP metadata plus a byte scan for provenance markers."
        onFile={inspect}
        dragging={dragging}
        setDragging={setDragging}
      />
      {loading && <p className="text-sm text-slate-600">Reading the image on your device...</p>}
      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>
      )}
      {report && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={report.previewUrl}
              alt="Preview of the image you selected for inspection"
              className="max-h-64 w-full rounded-2xl border border-slate-200 object-contain shadow-sm"
            />
            <div className="panel p-4 sm:p-5">
              <p className="font-semibold text-slate-900">File summary</p>
              <dl className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">File name</dt>
                  <dd className="text-right break-all text-slate-800">{report.fileName}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Size</dt>
                  <dd className="text-slate-800">{report.size}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Format</dt>
                  <dd className="text-slate-800">{report.format}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Dimensions</dt>
                  <dd className="text-slate-800">{report.dimensions}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-slate-500">Software tag</dt>
                  <dd className="text-right break-all text-slate-800">
                    {report.software ?? "Not present"}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">Provenance verdict</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <VerdictCard
                title="Content Credentials (C2PA)"
                found={report.c2paFound}
                detail={report.c2paDetail}
              />
              <VerdictCard
                title="AI source metadata"
                found={report.aiFound}
                detail={report.aiDetail}
              />
            </div>
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-800">
              <p className="font-semibold">Important note about SynthID</p>
              <p className="mt-1">{SYNTHID_NOTE}</p>
              <p className="mt-2">{GENERAL_CAVEAT}</p>
            </div>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">Provenance indicators found in the bytes</h3>
            <MetadataTable
              rows={report.indicatorRows}
              emptyText="No provenance or generator indicators from the built in list were found in the file bytes."
            />
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-slate-900">All metadata fields found</h3>
            <MetadataTable
              rows={report.metadataRows}
              emptyText="No readable EXIF, IPTC, or XMP metadata fields were found in this image."
            />
          </div>
        </div>
      )}
    </div>
  );
}
