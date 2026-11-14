import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "How it works: CrawlAI",
  description:
    "How CrawlAI checks Content Credentials (C2PA), SynthID, EXIF, IPTC, XMP, and text patterns, and why detection is not proof.",
};

const METHOD_SOURCES = [
  {
    name: "Fast-DetectGPT",
    url: "https://github.com/baoguangsheng/fast-detect-gpt",
    method: "Fast conditional probability curvature check, from an ICLR 2024 paper.",
  },
  {
    name: "Binoculars",
    url: "https://github.com/ahans30/Binoculars",
    method: "Compares perplexity across two language models as a ratio, from an ICML 2024 paper.",
  },
  {
    name: "DetectGPT",
    url: "https://github.com/eric-mitchell/detect-gpt",
    method: "The original probability curvature method: AI text tends to sit at a local peak of model probability.",
  },
  {
    name: "chatgpt-detector-roberta (Hello-SimpleAI)",
    url: "https://huggingface.co/Hello-SimpleAI/chatgpt-detector-roberta",
    method: "A RoBERTa classifier fine tuned on the HC3 human and ChatGPT comparison dataset.",
  },
  {
    name: "roberta-base-openai-detector (OpenAI)",
    url: "https://huggingface.co/openai-community/roberta-base-openai-detector",
    method: "A RoBERTa classifier from the GPT-2 era. Weak on modern models, and labelled as such wherever it is used here.",
  },
  {
    name: "CrawlAI local engine (in this repo)",
    url: "https://github.com/ahmedrazasahoo/crawlai",
    method: "All analysis code lives in this repository and runs on the visitor device. No outside service is called and no model is downloaded.",
  },
];

const SECTIONS = [
  {
    title: "Content Credentials and C2PA",
    body: [
      "C2PA is an open standard for recording where a file came from and what happened to it. Tools that support it attach a signed record, often called Content Credentials, to the file.",
      "In images, that record usually lives in a data block based on JUMBF. CrawlAI looks for plain markers such as c2pa, contentcredentials, and jumbf in the file, and reports if it finds them.",
      "A found credential tells you a tool recorded provenance information. It does not, on its own, tell you the full story of the image. A missing credential tells you even less, because many tools never add one and many platforms take metadata off files when they process them.",
    ],
  },
  {
    title: "SynthID",
    body: [
      "SynthID is a watermark system from Google DeepMind. For images and video, the mark is woven into the pixels themselves. For audio, it is woven into the sound wave. For text, it can shape word choices in a subtle way.",
      "That design is the point: the mark is not stored as a normal metadata field, so a metadata scan like this one cannot see it, confirm it, or rule it out.",
      "Only Google's own SynthID detector can check for a SynthID mark. If a report here says no metadata was found, that says nothing about SynthID either way.",
    ],
  },
  {
    title: "EXIF, IPTC, and XMP metadata",
    body: [
      "EXIF is the metadata family cameras use for settings, dates, device models, and sometimes location. IPTC is a news and photo industry standard for captions, credits, and source fields. XMP is a flexible Adobe format that many editors and generators write into.",
      "Fields that matter for provenance include Software or CreatorTool, which names the tool that last wrote the file, and DigitalSourceType, an IPTC field that can record that the source was trained algorithmic media, which means AI generated content.",
      "CrawlAI reads these fields with the exifr library in your browser and lists every field it finds, so you can judge the values yourself instead of trusting a single score.",
    ],
  },
  {
    title: "PDF, video, and audio files",
    body: [
      "PDF files carry an information dictionary with fields such as Producer, Creator, Title, and Author, and they can also carry an XMP metadata packet. CrawlAI extracts and lists those fields.",
      "Video and audio files carry container and encoder strings, such as the encoder library name, brand boxes, and creation tags. CrawlAI scans for those strings and for any C2PA marker boxes in the file bytes.",
      "This is a readable strings scan. It does not decode every frame or sample, and it cannot check an in-content watermark in video or audio.",
    ],
  },
  {
    title: "Text patterns and detector limits",
    body: [
      "For text, CrawlAI measures simple, explainable patterns: sentence length variation, often called burstiness, word diversity, repeated phrases, stock formulaic phrases, and an approximate readability score.",
      "Commercial AI detectors use related signals plus trained models, and their scores are often presented as a percentage. Research has repeatedly shown those scores can flag human writing, in particular short, formal, technical, or non native English writing, and can miss edited generated writing.",
      "That is why CrawlAI gives you the measurements and what each one means, instead of a single AI or human verdict. No score here, or anywhere, proves who wrote a piece of text from the text alone.",
    ],
  },
  {
    title: "Open-source detector methods and sources",
    body: [
      "CrawlAI's main text score is original code written for this tool. Its design takes method ideas from published open research: perplexity style predictability, burstiness, and classifier style phrase and stylometry signals. No code was copied from those projects.",
      "Fast-DetectGPT (ICLR 2024) speeds up probability curvature checking. Binoculars (ICML 2024) compares perplexity across two models as a ratio. DetectGPT is the original probability curvature method. The RoBERTa detectors from Hello-SimpleAI and OpenAI are trained classifiers, Those projects were used as research references only.",
      "CrawlAI itself calls no outside service. Every score is computed by original code inside this repository, running locally in the browser, so user text and files never leave the device and no model is downloaded.",
    ],
  },
  {
    title: "What CrawlAI does not do",
    body: [
      "CrawlAI is a reporting tool. It does not remove metadata, watermarks, or credentials from any file. It does not rewrite, paraphrase, or polish text. The file you inspect is never changed by this tool.",
      "If you publish content, the useful response to a report is transparency and quality: check your facts, credit your sources, keep your own drafts and source files, and say how a piece was made when readers would reasonably want to know.",
    ],
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 sm:py-12">
      <p className="text-sm font-semibold tracking-wide text-emerald-700 uppercase">Explainer</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
        How CrawlAI checks content, and what it cannot prove
      </h1>
      <p className="mt-3 text-base text-slate-600 sm:text-lg">
        Detection is not proof. This page explains each signal CrawlAI looks at, where it lives in a
        file, and where the limits are, so you can read a report with the right level of confidence.
      </p>

      <div className="mt-6 rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-900">
        <p className="font-semibold">The short version</p>
        <p className="mt-1">
          A provenance marker that is found is real information about the file. A marker that is not
          found proves almost nothing, because markers can be absent for many ordinary reasons.
          Text pattern scores are writing feedback, not evidence about an author.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title} className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-slate-950">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 32)} className="mt-3 text-sm leading-6 text-slate-700 sm:text-base">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>

      <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
        <h2 className="text-xl font-semibold text-slate-950">Source projects</h2>
        <ul className="mt-3 space-y-3">
          {METHOD_SOURCES.map((item) => (
            <li key={item.name} className="text-sm sm:text-base">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-700 underline"
              >
                {item.name}
              </a>
              <span className="text-slate-600">: {item.method}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 rounded-2xl bg-slate-950 p-6 text-white">
        <h2 className="text-lg font-semibold">Try a check</h2>
        <p className="mt-2 text-sm text-slate-300">
          Pick an image, a PDF, a video, an audio file, or a piece of text, and see exactly what
          CrawlAI finds in it, on your own device.
        </p>
        <Link
          href="/"
          className="mt-4 inline-block rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
        >
          Go to the checker
        </Link>
      </div>
    </div>
  );
}
