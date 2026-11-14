export const AI_GENERATOR_NAMES = [
  "DALL-E",
  "DALLE",
  "Midjourney",
  "Stable Diffusion",
  "Firefly",
  "Gemini",
  "Imagen",
  "OpenAI",
  "Adobe Firefly",
  "Adobe",
  "ChatGPT",
  "Google AI",
  "Runway",
  "Pika",
  "Sora",
] as const;

export const PROVENANCE_INDICATORS = [
  "c2pa",
  "contentcredentials",
  "Content Credentials",
  "jumbf",
  "JUMBF",
  "SynthID",
  "synthid",
  "TrainedAlgorithmicMedia",
  "DigitalSourceType",
  "digitalSourceType",
  "http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia",
  "trainedAlgorithmicMedia",
  "compositeWithTrainedAlgorithmicMedia",
  "algorithmicMedia",
] as const;

export interface IndicatorHit {
  indicator: string;
  count: number;
}

export interface FieldRow {
  field: string;
  value: string;
}

export function arrayBufferToLatin1(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let result = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    result += String.fromCharCode(...chunk);
  }
  return result;
}

export function countOccurrences(haystack: string, needle: string): number {
  if (!needle) return 0;
  let count = 0;
  let index = haystack.indexOf(needle);
  while (index !== -1) {
    count++;
    index = haystack.indexOf(needle, index + needle.length);
  }
  return count;
}

export function scanIndicators(
  raw: string,
  indicators: readonly string[]
): IndicatorHit[] {
  const hits: IndicatorHit[] = [];
  for (const indicator of indicators) {
    const count = countOccurrences(raw, indicator);
    if (count > 0) hits.push({ indicator, count });
  }
  return hits;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function cleanPrintable(value: string): string {
  return value.replace(/[^\x20-\x7E]+/g, " ").replace(/\s+/g, " ").trim();
}

export function snippetAround(raw: string, needle: string, radius = 60): string | null {
  const index = raw.indexOf(needle);
  if (index === -1) return null;
  const start = Math.max(0, index - radius);
  const end = Math.min(raw.length, index + needle.length + radius);
  return cleanPrintable(raw.slice(start, end));
}

export function stringifyMetadataValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(stringifyMetadataValue).join(", ");
  if (typeof Uint8Array !== "undefined" && value instanceof Uint8Array) {
    return `Binary data, ${value.byteLength} bytes`;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function flattenMetadata(
  obj: Record<string, unknown> | null | undefined,
  prefix = ""
): FieldRow[] {
  if (!obj) return [];
  const rows: FieldRow[] = [];
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) continue;
    const field = prefix ? `${prefix}.${key}` : key;
    if (
      typeof value === "object" &&
      !(value instanceof Date) &&
      !Array.isArray(value) &&
      !(typeof Uint8Array !== "undefined" && value instanceof Uint8Array)
    ) {
      rows.push(...flattenMetadata(value as Record<string, unknown>, field));
    } else {
      const text = stringifyMetadataValue(value);
      if (text) rows.push({ field, value: text.slice(0, 500) });
    }
  }
  return rows;
}

export function detectFormat(file: File): string {
  if (file.type) return file.type;
  const ext = file.name.split(".").pop()?.toLowerCase();
  return ext ? `Unknown MIME, extension .${ext}` : "Unknown";
}

export const SYNTHID_NOTE =
  "No C2PA or metadata found does NOT prove the image is human-made, and SynthID is an invisible in-pixel watermark that metadata scanning cannot confirm or rule out. Only Google's SynthID detector can check it.";

export const GENERAL_CAVEAT =
  "This report is inspection only. It lists what was found in the file or text. A missing marker is not proof of human authorship, and a present marker is context, not a final judgment on its own.";
