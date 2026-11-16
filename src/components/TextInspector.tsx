"use client";

import { useMemo, useRef, useState } from "react";
import {
  analyzeText,
  replaceSentence,
  tokenizeWords,
  type SentenceAnalysis,
  type TextAnalysis,
} from "@/lib/textAnalyzer";

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
    name: "chatgpt-comparison-detection (Hello-SimpleAI)",
    url: "https://github.com/Hello-SimpleAI/chatgpt-comparison-detection",
    method: "The HC3 dataset of human and ChatGPT answers, used to train RoBERTa style classifiers. Referenced for method ideas only, CrawlAI runs no external model.",
  },
  {
    name: "gpt-2-output-dataset (OpenAI)",
    url: "https://github.com/openai/gpt-2-output-dataset",
    method: "OpenAI's GPT-2 era detector research. Its classifier approach is a method reference only, and it is weak on modern model output.",
  },
  {
    name: "CrawlAI local engine (in this repo)",
    url: "https://github.com/ahmedrazasahoo/crawlai",
    method: "Every score on this page is computed by code that lives in this repository, in src/lib/textAnalyzer.ts, running on your own device. No text is sent to any outside service and no model is downloaded.",
  },
];

export default function TextInspector() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [workingText, setWorkingText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const editorRef = useRef<HTMLElement | null>(null);

  const analysis = useMemo(() => (workingText ? analyzeText(workingText) : null), [workingText]);
  const originalEstimate = useMemo(
    () => (submitted ? analyzeText(submitted).overall : null),
    [submitted]
  );
  const hasEdits = workingText !== "" && workingText !== submitted;
  const selectedSentence: SentenceAnalysis | null =
    analysis && selectedIndex !== null ? (analysis.sentences[selectedIndex] ?? null) : null;
  const liveWordCount = useMemo(() => tokenizeWords(text).length, [text]);

  function handleAnalyze(value: string) {
    if (!value.trim()) return;
    setAnalyzing(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSubmitted(value);
      setWorkingText(value);
      setSelectedIndex(null);
      setDraft("");
      setCopied(false);
      setAnalyzing(false);
    }, 400);
  }

  function handleClear() {
    setText("");
    setSubmitted("");
    setWorkingText("");
    setSelectedIndex(null);
    setDraft("");
    setCopied(false);
  }

  function selectSentence(index: number, scroll: boolean) {
    if (!analysis) return;
    const sentence = analysis.sentences[index];
    if (!sentence) return;
    setSelectedIndex(index);
    setDraft(sentence.text);
    if (scroll) {
      requestAnimationFrame(() => {
        editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }

  function applyMyEdit() {
    if (selectedIndex === null || !analysis) return;
    const current = analysis.sentences[selectedIndex];
    if (!current || draft === current.text) return;
    const next = replaceSentence(workingText, selectedIndex, draft);
    setWorkingText(next);
    setCopied(false);
    const nextAnalysis = analyzeText(next);
    const nextSentence = nextAnalysis.sentences[selectedIndex];
    if (nextSentence) {
      setDraft(nextSentence.text);
    } else if (nextAnalysis.sentences.length > 0) {
      const fallback = Math.min(selectedIndex, nextAnalysis.sentences.length - 1);
      setSelectedIndex(fallback);
      setDraft(nextAnalysis.sentences[fallback].text);
    } else {
      setSelectedIndex(null);
      setDraft("");
    }
  }

  function resetToOriginal() {
    setWorkingText(submitted);
    setSelectedIndex(null);
    setDraft("");
    setCopied(false);
  }

  async function copyFinalText() {
    if (!workingText) return;
    try {
      await navigator.clipboard.writeText(workingText);
    } catch {
      const area = document.createElement("textarea");
      area.value = workingText;
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }
    setCopied(true);
    if (copyTimer.current) clearTimeout(copyTimer.current);
    copyTimer.current = setTimeout(() => setCopied(false), 2500);
  }

  function downloadFinalText() {
    if (!workingText) return;
    const blob = new Blob([workingText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "crawlai-my-edited-text.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  function loadSample(sample: string) {
    setText(sample);
    handleAnalyze(sample);
  }

  function downloadReport() {
    if (!analysis || !workingText) return;
    const blob = new Blob([buildReportText(analysis, workingText)], {
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
          This gives you a feedback report. It never rewrites, paraphrases, or changes your text
          for you. After the report, an edit workspace lets you rewrite sentences yourself, in
          your own words, and see the estimate update. Everything runs in your browser.
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
          <section className="panel p-5 sm:p-6">
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
                {hasEdits && (
                  <span className="rounded-full bg-emerald-600 px-2.5 py-1 font-semibold text-white">
                    Showing your edited copy
                  </span>
                )}
              </div>
            </div>
            {hasEdits && originalEstimate && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 ring-1 ring-slate-200">
                Your original text scored {originalEstimate.aiScore}% AI-pattern. Your edited
                copy now scores {analysis.overall.aiScore}%. The change comes only from the edits
                you typed yourself.
              </p>
            )}

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
                      className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
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
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
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
            {analysis.longForm.isLongForm && (
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {[
                  {
                    label: "Specifics per 100 words",
                    value: String(analysis.longForm.specificityDensity),
                  },
                  {
                    label: "Repeated starters",
                    value: `${Math.round(analysis.longForm.sentenceStarterRepetition * 100)}%`,
                  },
                  {
                    label: "Medium sentences",
                    value: `${Math.round(analysis.longForm.mediumSentenceShare * 100)}%`,
                  },
                  {
                    label: "Abstract filler per 100",
                    value: String(analysis.longForm.abstractFillerDensity),
                  },
                  { label: "Headings", value: String(analysis.longForm.headingCount) },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-[#0b2447] px-3 py-2.5 text-white shadow-sm"
                  >
                    <p className="text-[11px] font-semibold tracking-wide text-sky-200 uppercase">
                      {stat.label}
                    </p>
                    <p className="mt-0.5 text-xl font-bold">{stat.value}</p>
                  </div>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={downloadReport}
              className="mt-4 min-h-11 rounded-lg border border-slate-950 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              Download report (.txt)
            </button>
          </section>

          <div className="grid gap-6 lg:grid-cols-5">
            <section className="panel p-5 sm:p-6 lg:col-span-3">
              <h3 className="font-semibold text-[#0b2447]">Sentence score flow</h3>
              <p className="mt-1 text-sm text-slate-600">
                Every sentence scored on its own, in reading order. Spikes above the red line are
                the strongest AI-pattern sentences. This is the fastest way to see where a long
                document drifts into generic patterns.
              </p>
              <div className="mt-3">
                <SentenceScoreChart sentences={analysis.sentences} />
              </div>
            </section>
            <section className="panel p-5 sm:p-6 lg:col-span-2">
              <h3 className="font-semibold text-[#0b2447]">What drives the score</h3>
              <p className="mt-1 text-sm text-slate-600">
                Each signal and the points it contributed, out of its own maximum. The bars add up
                to the overall estimate.
              </p>
              <div className="mt-4">
                <FeatureBars features={analysis.features} />
              </div>
            </section>
          </div>

          <section className="panel p-5 sm:p-6">
            <h3 className="font-semibold text-slate-900">Your data stays in this project</h3>
            <p className="mt-1 text-sm text-slate-600">
              This tool uses no third-party service, no outside API, and no downloaded model. All
              scoring code lives inside this repository, in src/lib/textAnalyzer.ts, and runs in
              your browser on your own device. Your text is never sent anywhere, never stored,
              and disappears when you close the tab.
            </p>
            <p className="mt-2 text-sm text-slate-600">
              The methods listed below are published research ideas. Their papers and open-source
              projects were used as references only, and the scoring here is original code written
              for this project.
            </p>
          </section>

          <div className="grid items-start gap-6 xl:grid-cols-2">
          <section className="panel p-5 sm:p-6">
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
            <p className="mt-2 text-xs text-slate-500">
              Tip: select any sentence to open it in the Edit and improve workspace below. You
              write the replacement yourself, CrawlAI only re-measures it.
            </p>
            <p className="mt-3 text-[15px] leading-8 text-slate-900">
              {analysis.sentences.map((sentence) => (
                <span
                  key={sentence.index}
                  role="button"
                  tabIndex={0}
                  aria-pressed={selectedIndex === sentence.index}
                  aria-label={`Select sentence ${sentence.index + 1} to edit it yourself. ${sentence.levelLabel}: ${sentence.score} percent`}
                  title={`${sentence.levelLabel}: ${sentence.score}%. Activate to edit this sentence yourself.`}
                  onClick={() => selectSentence(sentence.index, true)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      selectSentence(sentence.index, true);
                    }
                  }}
                  className={`mr-1 cursor-pointer rounded px-1 py-0.5 transition hover:ring-2 hover:ring-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none ${
                    selectedIndex === sentence.index
                      ? "ring-2 ring-slate-900"
                      : ""
                  } ${
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

            <div className="space-y-6">
          <section
            ref={editorRef}
            aria-label="Edit and improve workspace"
            className="panel scroll-mt-28 p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-2xl">
                <h3 className="text-lg font-semibold text-slate-900">
                  Edit and improve: your words, your edits
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  CrawlAI never writes, rewrites, or removes text for you. Pick a sentence, type
                  your own replacement in your own words, apply it, and the dashboard, highlighting,
                  and scores above update straight away so you can see what your edit changed.
                </p>
              </div>
              {hasEdits && (
                <span className="rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">
                  You have edited this copy
                </span>
              )}
            </div>

            <div className="mt-5">
              <p id="sentence-picker-label" className="text-sm font-medium text-slate-900">
                Choose a sentence to edit
              </p>
              <div role="group" aria-labelledby="sentence-picker-label" className="mt-2 flex flex-wrap gap-2">
                {analysis.sentences.map((sentence) => (
                  <button
                    key={sentence.index}
                    type="button"
                    onClick={() => selectSentence(sentence.index, false)}
                    aria-pressed={selectedIndex === sentence.index}
                    className={`flex min-h-11 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                      selectedIndex === sentence.index
                        ? "bg-slate-950 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`h-2.5 w-2.5 rounded-full ${
                        sentence.level === "high"
                          ? "bg-red-500"
                          : sentence.level === "mixed"
                            ? "bg-amber-500"
                            : "bg-emerald-500"
                      }`}
                    />
                    {sentence.index + 1} · {sentence.score}%
                  </button>
                ))}
              </div>
            </div>

            {selectedSentence ? (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-slate-900">
                    Sentence {selectedSentence.index + 1} of {analysis.sentences.length}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                      selectedSentence.level === "high"
                        ? "bg-red-600"
                        : selectedSentence.level === "mixed"
                          ? "bg-amber-500"
                          : "bg-emerald-600"
                    }`}
                  >
                    {selectedSentence.score}% · {selectedSentence.levelLabel}
                  </span>
                </div>

                <p className="mt-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">
                  Why it was flagged
                </p>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {selectedSentence.reasons.map((reason) => (
                    <li key={reason}>{reason}</li>
                  ))}
                </ul>
                <p className="mt-3 text-sm text-slate-700">
                  <strong>Strengthen it:</strong> {selectedSentence.improvement} Vary the rhythm
                  too: a short sentence after a long one often reads as more human.
                </p>

                <label
                  htmlFor="sentence-editor"
                  className="mt-4 block text-sm font-medium text-slate-900"
                >
                  Your replacement, in your own words
                </label>
                <textarea
                  id="sentence-editor"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white p-3.5 text-base text-slate-900 shadow-inner outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
                />
                <div className="mt-1 flex justify-end text-xs text-slate-500" aria-live="polite">
                  {tokenizeWords(draft).length}{" "}
                  {tokenizeWords(draft).length === 1 ? "word" : "words"} in your replacement
                </div>
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={applyMyEdit}
                    disabled={draft === selectedSentence.text}
                    className="min-h-11 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Apply my edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(selectedSentence.text)}
                    disabled={draft === selectedSentence.text}
                    className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Undo changes in this box
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Applying swaps only this sentence in your working copy. Nothing is uploaded, and
                  your original pasted text stays untouched until you reset or clear.
                </p>
              </div>
            ) : (
              <p className="mt-5 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-sm text-slate-600">
                No sentence selected yet. Use the numbered chips above, the Edit buttons in Where
                to look first, or select a sentence in the highlighted text.
              </p>
            )}

          </section>

          <section className="panel p-5 sm:p-6">
            <h3 className="font-semibold text-[#0b2447]">Your final text</h3>
            <p className="mt-1 text-sm text-slate-600">
              This preview is your working copy exactly as you edited it, word for word. CrawlAI
              added nothing to it. Copy it or download it when you are happy with your own edits.
            </p>
            <div className="mt-3 max-h-96 overflow-auto rounded-xl bg-slate-50 p-4 text-sm leading-7 whitespace-pre-wrap text-slate-800 ring-1 ring-slate-100">
              {workingText}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={copyFinalText}
                className="min-h-11 rounded-xl bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Copy my final text
              </button>
              <button
                type="button"
                onClick={downloadFinalText}
                className="min-h-11 rounded-xl border border-slate-950 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
              >
                Download my final text (.txt)
              </button>
              <button
                type="button"
                onClick={resetToOriginal}
                disabled={!hasEdits}
                className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Reset to my original text
              </button>
              <span role="status" aria-live="polite" className="text-sm font-medium text-emerald-700">
                {copied ? "Copied. Your edited text is on the clipboard." : ""}
              </span>
            </div>
          </section>
            </div>
          </div>

          <section className="panel p-5 sm:p-6">
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
                    <button
                      type="button"
                      onClick={() => selectSentence(sentence.index, true)}
                      className="mt-3 min-h-11 rounded-lg bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                    >
                      Edit this sentence myself
                    </button>
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
            <section className="panel p-5 sm:p-6">
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

            <section className="panel p-5 sm:p-6">
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
            <section className="panel p-5 sm:p-6">
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

            <section className="panel p-5 sm:p-6">
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

          <section className="panel p-5 sm:p-6">
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

      <section className="panel p-5 sm:p-6">
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

function SentenceScoreChart({ sentences }: { sentences: SentenceAnalysis[] }) {
  if (sentences.length === 0) {
    return <p className="text-sm text-slate-600">No sentences to chart.</p>;
  }
  const width = 720;
  const height = 230;
  const padL = 38;
  const padR = 46;
  const padT = 16;
  const padB = 30;
  const innerW = width - padL - padR;
  const innerH = height - padT - padB;
  const x = (i: number) =>
    padL + (sentences.length <= 1 ? innerW / 2 : (i / (sentences.length - 1)) * innerW);
  const y = (score: number) => padT + (1 - score / 100) * innerH;
  const line = sentences.map((snt, i) => `${x(i)},${y(snt.score)}`).join(" ");
  const areaPath =
    `M ${x(0)} ${y(sentences[0].score)} ` +
    sentences.map((snt, i) => `L ${x(i)} ${y(snt.score)}`).join(" ") +
    ` L ${x(sentences.length - 1)} ${padT + innerH} L ${x(0)} ${padT + innerH} Z`;
  const average = Math.round(
    sentences.reduce((sum, snt) => sum + snt.score, 0) / sentences.length
  );
  const peak = Math.max(...sentences.map((snt) => snt.score));
  const highCount = sentences.filter((snt) => snt.score >= 65).length;
  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label={`Line chart of sentence scores. Average ${average} percent, peak ${peak} percent, ${highCount} sentences in the high range.`}
      >
        <defs>
          <linearGradient id="score-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0b2447" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#0b2447" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {[0, 50, 100].map((value) => (
          <g key={value}>
            <line x1={padL} x2={padL + innerW} y1={y(value)} y2={y(value)} stroke="#e2e8f0" strokeWidth="1" />
            <text x={padL - 8} y={y(value) + 4} textAnchor="end" fontSize="11" fill="#64748b">
              {value}
            </text>
          </g>
        ))}
        <line x1={padL} x2={padL + innerW} y1={y(65)} y2={y(65)} stroke="#dc2626" strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={padL + innerW + 6} y={y(65) + 4} fontSize="11" fontWeight="600" fill="#dc2626">
          65 high
        </text>
        <line x1={padL} x2={padL + innerW} y1={y(40)} y2={y(40)} stroke="#d97706" strokeWidth="1.5" strokeDasharray="6 4" />
        <text x={padL + innerW + 6} y={y(40) + 4} fontSize="11" fontWeight="600" fill="#d97706">
          40 mixed
        </text>
        <path d={areaPath} fill="url(#score-area)" />
        <polyline points={line} fill="none" stroke="#0b2447" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
        {sentences.map((snt, i) =>
          snt.score >= 65 ? (
            <circle key={snt.index} cx={x(i)} cy={y(snt.score)} r="3.5" fill="#dc2626" />
          ) : null
        )}
        <text x={padL} y={height - 8} fontSize="11" fill="#64748b">
          Sentence 1
        </text>
        <text x={padL + innerW} y={height - 8} textAnchor="end" fontSize="11" fill="#64748b">
          Sentence {sentences.length}
        </text>
      </svg>
      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
        <span>
          Average sentence score: <strong className="text-slate-900">{average}%</strong>
        </span>
        <span>
          Peak: <strong className="text-slate-900">{peak}%</strong>
        </span>
        <span>
          High range sentences: <strong className="text-red-700">{highCount}</strong>
        </span>
      </div>
    </div>
  );
}

function FeatureBars({ features }: { features: TextAnalysis["features"] }) {
  const sorted = [...features].sort((a, b) => b.points - a.points);
  return (
    <div className="space-y-3.5">
      {sorted.map((feature) => {
        const ratio = feature.maxPoints === 0 ? 0 : feature.points / feature.maxPoints;
        const barColor =
          ratio >= 0.66
            ? "bg-gradient-to-r from-red-500 to-red-600"
            : ratio >= 0.33
              ? "bg-gradient-to-r from-amber-400 to-amber-500"
              : feature.points > 0
                ? "bg-gradient-to-r from-emerald-400 to-emerald-600"
                : "bg-slate-300";
        return (
          <div key={feature.id}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-sm font-medium text-slate-800">{feature.label}</span>
              <span className="text-sm font-semibold text-slate-900">
                {feature.points}
                <span className="font-normal text-slate-500"> / {feature.maxPoints}</span>
              </span>
            </div>
            <div className="mt-1 h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.max(2, ratio * 100)}%` }}
              />
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              {feature.displayValue}. {feature.detail}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function Donut({ aiScore }: { aiScore: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const aiLength = (aiScore / 100) * circumference;
  return (
    <div
      className="relative h-36 w-36 shrink-0 drop-shadow-sm"
      role="img"
      aria-label={`AI pattern ${aiScore} percent, human pattern ${100 - aiScore} percent`}
    >
      <svg viewBox="0 0 120 120" className="h-36 w-36 -rotate-90">
        <defs>
          <linearGradient id="donut-human" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="donut-ai" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f87171" />
            <stop offset="100%" stopColor="#dc2626" />
          </linearGradient>
        </defs>
        <circle cx="60" cy="60" r={radius} fill="none" strokeWidth="13" stroke="url(#donut-human)" />
        <circle
          cx="60"
          cy="60"
          r={radius}
          fill="none"
          strokeWidth="13"
          strokeLinecap="butt"
          strokeDasharray={`${aiLength} ${circumference}`}
          stroke="url(#donut-ai)"
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tight text-slate-900">{aiScore}%</span>
        <span className="text-[11px] font-medium tracking-wide text-slate-500 uppercase">
          AI-pattern
        </span>
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
    "Score contributions:",
    ...analysis.features.map(
      (f) => `  ${f.label}: ${f.points} of ${f.maxPoints} points (${f.displayValue})`
    ),
    "",
    "Sentence by sentence findings:",
  ];
  for (const s of analysis.sentences) {
    lines.push("");
    lines.push(`[${s.score}% ${s.levelLabel}] Sentence ${s.index + 1}: ${s.text}`);
    for (const reason of s.reasons) lines.push(`  Reason: ${reason}`);
    lines.push(`  Strengthen it: ${s.improvement}`);
  }
  lines.push("", "Text as analyzed (the working copy shown on screen, including any edits the user typed):", "", original, "");
  return lines.join("\n");
}

function flaggedSentences<T extends { level: string; score: number }>(sentences: T[]): T[] {
  return sentences.filter((s) => s.level !== "human").sort((a, b) => b.score - a.score);
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel p-4 sm:p-5">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
