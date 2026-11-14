"use client";

import { useMemo, useRef, useState } from "react";
import { analyzeText, tokenizeWords, type TextAnalysis } from "@/lib/textAnalyzer";
import type { MlResult } from "@/lib/mlDetector";

const AI_LIKE_SAMPLE =
  "Furthermore, it is important to note that technology plays a crucial role in our daily lives. Moreover, in today's fast-paced world, it is essential to delve into the wide range of benefits that technology offers. Additionally, technology has transformed the landscape of communication in many significant ways. In conclusion, it is important to note that technology is a pivotal part of the modern world, and its impact will continue to grow in the future.";

const HUMAN_LIKE_SAMPLE =
  "I replaced the cracked seal on my 2019 Civic last Tuesday. Took 40 minutes, one 12 mm wrench, and a rag I have owned since college. The leak stopped straight away. My neighbour Tom swears the old seal was the factory one from 2011, and honestly the part number stamped on it, 47B, makes me think he is right. Cost me 6 dollars and a scraped knuckle.";

const METHODS = [
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
    name: "Transformers.js",
    url: "https://github.com/huggingface/transformers.js",
    method: "Runs Hugging Face classification models inside the browser with ONNX and WebAssembly, which powers the optional ML check below.",
  },
];

type MlState =
  | { status: "idle" }
  | { status: "loading"; message: string }
  | { status: "done"; result: MlResult }
  | { status: "error"; message: string };

export default function TextInspector() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [ml, setMl] = useState<MlState>({ status: "idle" });
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analysis = useMemo(() => (submitted ? analyzeText(submitted) : null), [submitted]);
  const liveWordCount = useMemo(() => tokenizeWords(text).length, [text]);

  function handleAnalyze(value: string) {
    if (!value.trim()) return;
    setAnalyzing(true);
    setMl({ status: "idle" });
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSubmitted(value);
      setAnalyzing(false);
    }, 400);
  }

  function handleClear() {
    setText("");
    setSubmitted("");
    setMl({ status: "idle" });
  }

  function loadSample(sample: string) {
    setText(sample);
    handleAnalyze(sample);
  }

  async function handleMlCheck() {
    if (!submitted) return;
    setMl({ status: "loading", message: "Preparing the model download..." });
    try {
      const mod = await import("@/lib/mlDetector");
      const result = await mod.runMlDetector(submitted, (message) =>
        setMl({ status: "loading", message })
      );
      setMl({ status: "done", result });
    } catch {
      setMl({
        status: "error",
        message:
          "The open-source ML model could not be loaded or run in this browser. This can happen when the model files are unavailable, the browser blocks the download, or the device is short on memory. The main heuristic report above is unaffected and stays the primary result.",
      });
    }
  }

  function downloadReport() {
    if (!analysis || !submitted) return;
    const blob = new Blob([buildReportText(analysis, submitted)], {
      type: "text/plain;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crawlai-text-report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="text-input" className="font-medium text-slate-900">
          Paste text to inspect
        </label>
        <p className="mt-1 text-sm text-slate-600">
          This gives you a feedback report only. It does not rewrite, paraphrase, or change your
          text in any way, and it runs entirely in your browser.
        </p>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={10}
          placeholder="Paste or type the text you want a feedback report for..."
          className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-4 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
        <div className="mt-1 flex justify-end text-xs text-slate-500" aria-live="polite">
          {liveWordCount} {liveWordCount === 1 ? "word" : "words"}
          {liveWordCount > 0 && liveWordCount < 50
            ? " (under 50 words, confidence will be low)"
            : ""}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => handleAnalyze(text)}
            disabled={text.trim().length === 0 || analyzing}
            className="min-h-11 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {analyzing ? "Analyzing..." : "Analyze text"}
          </button>
          <button
            type="button"
            onClick={() => loadSample(AI_LIKE_SAMPLE)}
            className="min-h-11 rounded-lg border border-red-300 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-900 transition hover:bg-red-100 focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-2"
          >
            Try a sample: AI-like
          </button>
          <button
            type="button"
            onClick={() => loadSample(HUMAN_LIKE_SAMPLE)}
            className="min-h-11 rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-sm font-medium text-emerald-900 transition hover:bg-emerald-100 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Try a sample: human-like
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={text.length === 0 && !submitted}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </div>

      {analyzing && (
        <div
          role="status"
          className="rounded-xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700"
        >
          Analyzing sentence patterns, phrases, and readability...
        </div>
      )}

      {!analysis && !analyzing && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
          <p className="font-medium text-slate-900">No report yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
            Paste at least a few sentences above and choose Analyze text, or use one of the Try a
            sample buttons to see a finished report right away. Longer text gives a steadier
            estimate.
          </p>
        </div>
      )}

      {analysis && (
        <div className="space-y-6">
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h3 className="font-semibold text-slate-900">Overall pattern estimate</h3>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  Verdict: {analysis.overall.verdict}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                  Confidence: {analysis.overall.confidence}
                  {analysis.overall.confidence === "Low" ? " (short text, treat with care)" : ""}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
              <Donut aiScore={analysis.overall.aiScore} />
              <div className="w-full flex-1 space-y-4">
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-medium text-red-800">AI-pattern</span>
                    <span className="text-4xl font-bold text-red-600">
                      {analysis.overall.aiScore}%
                    </span>
                  </div>
                  <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-red-100">
                    <div
                      className="h-full rounded-full bg-red-500"
                      style={{ width: `${analysis.overall.aiScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-sm font-medium text-emerald-800">Human-pattern</span>
                    <span className="text-4xl font-bold text-emerald-600">
                      {analysis.overall.humanScore}%
                    </span>
                  </div>
                  <div className="mt-1 h-4 w-full overflow-hidden rounded-full bg-emerald-100">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${analysis.overall.humanScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm font-medium text-amber-900">
              Estimate only. No detector can give a correct or proven percentage, and this score
              must not be used as proof of authorship.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              The estimate combines sentence length variation, formulaic phrase density, transition
              word density, lexical diversity, repeated phrases, sentence length uniformity, and
              punctuation variety. It describes style patterns only.
            </p>
            <button
              type="button"
              onClick={downloadReport}
              className="mt-4 min-h-11 rounded-lg border border-slate-950 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Download report (.txt)
            </button>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">
              Optional: open-source ML detector check
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              This runs a real RoBERTa detector model in your browser using Transformers.js. The
              model files download once from Hugging Face and are cached by your browser. The model
              was trained on older GPT-2 and ChatGPT era text, so treat its result as a weak extra
              signal, not as a verdict.
            </p>
            {ml.status !== "done" && (
              <button
                type="button"
                onClick={handleMlCheck}
                disabled={ml.status === "loading"}
                className="mt-3 min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-60"
              >
                {ml.status === "loading"
                  ? "Loading model..."
                  : "Run open-source ML detector (downloads model once)"}
              </button>
            )}
            {ml.status === "loading" && (
              <p role="status" className="mt-3 text-sm text-slate-700">
                {ml.message}
              </p>
            )}
            {ml.status === "error" && (
              <p className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                {ml.message}
              </p>
            )}
            {ml.status === "done" && (
              <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Model: {ml.result.model}
                </p>
                <p className="mt-2 text-3xl font-bold text-slate-900">
                  {ml.result.aiProbability}%{" "}
                  <span className="text-base font-medium text-slate-600">
                    AI probability from this model
                  </span>
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  Human probability from this model: {ml.result.humanProbability}%. Raw label:{" "}
                  {ml.result.label}.
                  {ml.result.truncated
                    ? " Long text was scored on its opening section only, because the model has an input limit."
                    : ""}
                </p>
                <p className="mt-2 text-sm text-amber-900">
                  Caveat: this model was trained on older GPT-2 and ChatGPT era text and is
                  unreliable on modern models. Its score is not proof of anything.
                </p>
                <button
                  type="button"
                  onClick={handleMlCheck}
                  className="mt-3 min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2"
                >
                  Run it again
                </button>
              </div>
            )}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <div className="sticky top-2 z-10 rounded-lg bg-white/95 py-1 backdrop-blur">
              <h3 className="font-semibold text-slate-900">Your text, sentence by sentence</h3>
              <div className="mt-2 flex flex-wrap gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-red-300" /> High AI-pattern (65
                  to 100)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-amber-300" /> Mixed (40 to 64)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-3 w-3 rounded bg-emerald-300" /> Human-like
                  (under 40)
                </span>
              </div>
            </div>
            <p className="mt-3 text-[15px] leading-8 text-slate-900">
              {analysis.sentences.map((sentence) => (
                <span
                  key={sentence.index}
                  title={`${sentence.levelLabel}: ${sentence.score}%`}
                  className={`mr-1 rounded px-1 py-0.5 ${
                    sentence.level === "high"
                      ? "bg-red-100"
                      : sentence.level === "mixed"
                        ? "bg-amber-100"
                        : "bg-emerald-100"
                  }`}
                >
                  {sentence.text}{" "}
                </span>
              ))}
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Where to look first</h3>
            <p className="mt-1 text-sm text-slate-600">
              Sentences with the strongest AI-like patterns, highest score first. Each one lists why
              it was flagged and a legitimate way to strengthen it with real detail. Nothing here
              rewrites your text for you.
            </p>
            {flaggedSentences(analysis.sentences).length === 0 ? (
              <p className="mt-3 text-sm text-slate-700">
                No sentences were flagged. Every sentence scored in the human-like range.
              </p>
            ) : (
              <ol className="mt-4 space-y-3">
                {flaggedSentences(analysis.sentences).map((sentence) => (
                  <li
                    key={sentence.index}
                    className={`rounded-lg border p-4 ${
                      sentence.level === "high"
                        ? "border-red-200 bg-red-50"
                        : "border-amber-200 bg-amber-50"
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          sentence.level === "high"
                            ? "bg-red-600 text-white"
                            : "bg-amber-500 text-white"
                        }`}
                      >
                        {sentence.score}% AI-pattern
                      </span>
                      <span className="text-xs text-slate-500">
                        Sentence {sentence.index + 1} of {analysis.sentences.length}
                      </span>
                    </div>
                    <p className="mt-2 text-sm text-slate-900">{sentence.text}</p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                      {sentence.reasons.map((reason) => (
                        <li key={reason}>{reason}</li>
                      ))}
                    </ul>
                    <p className="mt-2 text-sm text-slate-700">
                      <strong>Strengthen it:</strong> {sentence.improvement}
                    </p>
                  </li>
                ))}
              </ol>
            )}

            {analysis.sentences.some((s) => s.level === "human") && (
              <details className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <summary className="cursor-pointer text-sm font-semibold text-emerald-900">
                  These read as human-like (
                  {analysis.sentences.filter((s) => s.level === "human").length})
                </summary>
                <ul className="mt-3 space-y-2 text-sm text-slate-800">
                  {analysis.sentences
                    .filter((s) => s.level === "human")
                    .map((sentence) => (
                      <li key={sentence.index} className="flex flex-wrap gap-2">
                        <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-semibold text-white">
                          {sentence.score}%
                        </span>
                        <span>{sentence.text}</span>
                      </li>
                    ))}
                </ul>
              </details>
            )}
          </section>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Words" value={String(analysis.wordCount)} />
            <StatCard label="Sentences" value={String(analysis.sentenceCount)} />
            <StatCard label="Avg sentence length" value={`${analysis.avgSentenceLength} words`} />
            <StatCard
              label="Readability (Flesch)"
              value={analysis.fleschReadingEase === null ? "N/A" : String(analysis.fleschReadingEase)}
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">Burstiness: sentence length variation</h3>
              <p className="mt-2 text-sm text-slate-700">
                Score: <strong>{analysis.burstiness.label}</strong>
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Mean sentence length {analysis.burstiness.mean} words, standard deviation{" "}
                {analysis.burstiness.standardDeviation}, coefficient of variation{" "}
                {analysis.burstiness.coefficientOfVariation}.
              </p>
              <p className="mt-2 text-sm text-slate-600">
                What it means: writing detectors sometimes look at how much sentence lengths vary.
                Human writing often mixes short and long sentences, while very uniform lengths can
                look mechanical. This is a weak signal on its own. Formal, technical, and edited
                human writing can also be very uniform.
              </p>
              {analysis.sentenceLengths.length > 0 && (
                <p className="mt-2 text-xs break-all text-slate-500">
                  Sentence lengths in words: {analysis.sentenceLengths.join(", ")}
                </p>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">Lexical diversity</h3>
              <p className="mt-2 text-sm text-slate-700">
                <strong>{analysis.lexicalDiversity}</strong> ({analysis.uniqueWordCount} unique
                words out of {analysis.wordCount})
              </p>
              <p className="mt-2 text-sm text-slate-600">
                What it means: this is the share of words that are different from each other. Very
                low diversity can mean a lot of repetition. High diversity alone does not prove
                anything about who wrote the text.
              </p>
              <h4 className="mt-4 font-medium text-slate-900">Readability</h4>
              <p className="mt-1 text-sm text-slate-600">
                {analysis.fleschLabel}. The Flesch score is an approximate readability estimate
                based on sentence length and estimated syllables. It says nothing about authorship.
              </p>
            </section>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">Formulaic phrases found</h3>
              <p className="mt-1 text-sm text-slate-600">
                Total matches: {analysis.formulaicTotal}. These are common stock phrases that appear
                in a lot of generated and a lot of human writing. Finding them is not proof of AI
                authorship, it only shows the phrasing is generic.
              </p>
              {analysis.formulaicHits.length === 0 ? (
                <p className="mt-3 text-sm text-slate-700">
                  None of the phrases on the built in list were found.
                </p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {analysis.formulaicHits.map((hit) => (
                    <li key={hit.phrase} className="flex justify-between gap-4">
                      <span>&quot;{hit.phrase}&quot;</span>
                      <span className="text-slate-500">x{hit.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">Repeated 3 word phrases</h3>
              <p className="mt-1 text-sm text-slate-600">
                Phrases of three words that appear more than once. Repetition is normal for key
                terms, headings, and names, so read this list in context.
              </p>
              {analysis.repeatedTrigrams.length === 0 ? (
                <p className="mt-3 text-sm text-slate-700">No repeated 3 word phrases found.</p>
              ) : (
                <ul className="mt-3 space-y-1 text-sm text-slate-700">
                  {analysis.repeatedTrigrams.map((item) => (
                    <li key={item.phrase} className="flex justify-between gap-4">
                      <span>&quot;{item.phrase}&quot;</span>
                      <span className="text-slate-500">x{item.count}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>

          <section className="rounded-xl border border-amber-300 bg-amber-50 p-5">
            <h3 className="font-semibold text-amber-900">No score proves authorship</h3>
            <p className="mt-2 text-sm text-amber-900">
              These numbers describe style patterns in the text you pasted. They cannot prove that a
              person or an AI wrote it. Detector scores are known to flag human writing, especially
              short, formal, technical, or non native English writing, and to miss edited generated
              writing. Treat this report as writing feedback, not as a verdict on the author.
            </p>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold text-slate-900">Legitimate ways to improve this writing</h3>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
              <li>Add specific facts, numbers, dates, and names that you have checked yourself.</li>
              <li>Add first hand detail: what you did, saw, tested, or learned directly.</li>
              <li>Add citations or links to the sources behind key claims.</li>
              <li>Replace generic stock phrases with the exact thing you actually mean.</li>
              <li>Vary sentence and paragraph structure naturally as you edit for clarity.</li>
              <li>Read it aloud and fix any part that sounds unlike how you would explain it.</li>
            </ul>
          </section>
        </div>
      )}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold text-slate-900">Methods and sources</h3>
        <p className="mt-1 text-sm text-slate-600">
          CrawlAI&apos;s main score is original code. It combines perplexity style predictability
          proxies (common word choices and stock phrases), burstiness, and classifier style phrase
          and stylometry signals, taking method ideas from these open research projects. No code was
          copied from them.
        </p>
        <ul className="mt-3 space-y-3">
          {METHODS.map((item) => (
            <li key={item.name} className="text-sm">
              <a
                href={item.url}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-emerald-700 underline focus-visible:ring-2 focus-visible:ring-emerald-500"
              >
                {item.name}
              </a>
              <span className="text-slate-600">: {item.method}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Donut({ aiScore }: { aiScore: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const aiLength = (aiScore / 100) * circumference;
  return (
    <div className="relative h-32 w-32 shrink-0" role="img" aria-label={`AI pattern ${aiScore} percent, human pattern ${100 - aiScore} percent`}>
      <svg viewBox="0 0 120 120" className="h-32 w-32 -rotate-90">
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="14" className="stroke-emerald-400" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="14"
          strokeLinecap="butt"
          strokeDasharray={`${aiLength} ${circumference}`}
          className="stroke-red-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{aiScore}%</span>
        <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">AI-pattern</span>
      </div>
    </div>
  );
}

function buildReportText(analysis: TextAnalysis, original: string): string {
  const lines: string[] = [
    "CrawlAI text pattern report",
    `Generated: ${new Date().toISOString()}`,
    "",
    "IMPORTANT: This is an estimate based on writing patterns only. No detector can give a correct or proven percentage, and this report must not be used as proof of authorship.",
    "",
    `AI-pattern estimate: ${analysis.overall.aiScore}%`,
    `Human-pattern estimate: ${analysis.overall.humanScore}%`,
    `Verdict: ${analysis.overall.verdict}`,
    `Confidence: ${analysis.overall.confidence}`,
    "",
    `Words: ${analysis.wordCount}`,
    `Sentences: ${analysis.sentenceCount}`,
    `Average sentence length: ${analysis.avgSentenceLength} words`,
    `Burstiness (coefficient of variation): ${analysis.burstiness.coefficientOfVariation} (${analysis.burstiness.label})`,
    `Lexical diversity: ${analysis.lexicalDiversity} (${analysis.uniqueWordCount} unique words)`,
    `Readability (Flesch): ${analysis.fleschReadingEase ?? "N/A"} (${analysis.fleschLabel})`,
    `Formulaic phrase matches: ${analysis.formulaicTotal}`,
    "",
    "Sentence by sentence findings:",
  ];
  for (const s of analysis.sentences) {
    lines.push("");
    lines.push(`[${s.score}% ${s.levelLabel}] Sentence ${s.index + 1}: ${s.text}`);
    for (const reason of s.reasons) lines.push(`  Reason: ${reason}`);
    lines.push(`  Strengthen it: ${s.improvement}`);
  }
  lines.push("", "Original text as pasted:", "", original, "");
  return lines.join("\n");
}

function flaggedSentences<T extends { level: string; score: number }>(sentences: T[]): T[] {
  return sentences.filter((s) => s.level !== "human").sort((a, b) => b.score - a.score);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
