# CrawlAI

CrawlAI is a detection and reporting tool for provenance and AI signals in content. It inspects
images, PDF, video, and audio files, and gives a measurement based feedback report for text.

CrawlAI only inspects and reports. It does not remove, strip, alter, or rewrite anything, and it
does not change any file you check with it.

## What it does

- Image tab: drag and drop or pick a JPG, PNG, or WebP file. The report shows file name, size,
  dimensions, format, every EXIF, IPTC, and XMP metadata field found, a byte scan for provenance
  indicators such as c2pa, contentcredentials, and jumbf, and a verdict card for Content
  Credentials (C2PA) and AI source metadata.
- File tab: pick a PDF, MP4, MOV, MP3, or WAV file. For PDFs it reports fields such as Producer,
  Creator, and Title plus any XMP packet. For video and audio it reports container and encoder
  strings and any C2PA marker found in the bytes.
- Text tab: paste text and get word and sentence counts, burstiness, lexical diversity, repeated
  3 word phrases, formulaic phrase matches, and an approximate Flesch readability score, each with
  an explanation. The text is never rewritten.

All processing runs client side in the browser. Files never leave the device.

## Important limits

- No C2PA or metadata found does not prove a file is human made.
- SynthID is an invisible in pixel or in wave watermark. A metadata scan cannot confirm or rule
  it out. Only Google's SynthID detector can check it.
- Text pattern scores describe writing style. They do not prove authorship.

See the /how-it-works page in the app for a fuller explainer.

## Development

```bash
npm install
npm run dev
npm test
npm run build
```

Built with Next.js (App Router), TypeScript, Tailwind CSS, and exifr for image metadata parsing.
Tests use Vitest and cover the text analyzer in src/lib/textAnalyzer.ts.
