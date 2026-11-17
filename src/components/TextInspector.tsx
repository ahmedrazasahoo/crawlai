"use client";

import { useMemo, useRef, useState } from "react";
import {
  analyzeText,
  replaceSentence,
  tokenizeWords,
  type TextAnalysis,
} from "@/lib/textAnalyzer";

export default function TextInspector() {
  const [text, setText] = useState("");
  const [originalText, setOriginalText] = useState("");
  const [workingText, setWorkingText] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const analysis = useMemo(
    () => (workingText ? analyzeText(workingText) : null),
    [workingText]
  );
  const originalAnalysis = useMemo(
    () => (originalText ? analyzeText(originalText) : null),
    [originalText]
  );
  const liveWordCount = useMemo(() => tokenizeWords(text).length, [text]);
  const flagged = analysis
    ? analysis.sentences.filter((s) => s.level !== "human").sort((a, b) => b.score - a.score)
    : [];
  const hasEdits = originalText !== "" && workingText !== originalText;
  const selectedSentence =
    analysis && selectedIndex !== null
      ? (analysis.sentences[selectedIndex] ?? null)
      : null;

  function handleAnalyze() {
    if (!text.trim()) return;
    setAnalyzing(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setOriginalText(text);
      setWorkingText(text);
      setSelectedIndex(null);
      setDraft("");
      setCopied(false);
      setAnalyzing(false);
    }, 400);
  }

  function handleClear() {
    setText("");
    setOriginalText("");
    setWorkingText("");
    setSelectedIndex(null);
    setDraft("");
    setCopied(false);
    setAnalyzing(false);
    if (timer.current) clearTimeout(timer.current);
  }

  function selectSentence(index: number) {
    if (!analysis) return;
    const sentence = analysis.sentences[index];
    if (!sentence) return;
    setSelectedIndex(index);
    setDraft(sentence.text);
  }

  function applyMyEdit() {
    if (selectedIndex === null || !analysis) return;
    const current = analysis.sentences[selectedIndex];
    if (!current || draft === current.text) return;
    const nextText = replaceSentence(workingText, selectedIndex, draft);
    setWorkingText(nextText);
    const nextAnalysis = analyzeText(nextText);
    const nextSentence = nextAnalysis.sentences[selectedIndex];
    if (nextSentence) {
      setSelectedIndex(selectedIndex);
      setDraft(nextSentence.text);
    } else {
      setSelectedIndex(null);
      setDraft("");
    }
  }

  function undoDraftChanges() {
    if (!selectedSentence) return;
    setDraft(selectedSentence.text);
  }

  function resetToOriginal() {
    if (!originalText || !hasEdits) return;
    setWorkingText(originalText);
    if (selectedIndex !== null && originalAnalysis) {
      const sentence = originalAnalysis.sentences[selectedIndex];
      if (sentence) {
        setDraft(sentence.text);
      } else {
        setSelectedIndex(null);
        setDraft("");
      }
    }
  }

  async function copyFinalText() {
    if (!workingText) return;
    try {
      await navigator.clipboard.writeText(workingText);
    } catch {
      const scratch = document.createElement("textarea");
      scratch.value = workingText;
      scratch.style.position = "fixed";
      scratch.style.opacity = "0";
      document.body.appendChild(scratch);
      scratch.select();
      document.execCommand("copy");
      document.body.removeChild(scratch);
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
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
    <div className="grid items-start gap-6 lg:grid-cols-2">
      <section className="panel p-5 sm:p-6" aria-label="Your text">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="icon-tile h-10 w-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M5 5h14M5 9.5h14M5 14h9M5 18.5h12" strokeLinecap="round" />
            </svg>
          </span>
          <label htmlFor="text-input" className="text-lg font-semibold tracking-tight text-slate-900">
            Your text
          </label>
        </div>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Paste or type the text you want checked..."
          className="mt-4 w-full rounded-2xl border border-slate-300 bg-white p-4 text-base text-slate-900 shadow-[inset_0_2px_8px_rgba(15,23,42,0.06)] transition outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:shadow-[inset_0_2px_8px_rgba(15,23,42,0.04),0_0_0_4px_rgba(16,185,129,0.15)]"
        />
        <div className="mt-1 flex justify-end text-xs text-slate-500" aria-live="polite">
          {liveWordCount} {liveWordCount === 1 ? "word" : "words"}
          {liveWordCount > 0 && liveWordCount < 50
            ? " (under 50 words, confidence will be low)"
            : ""}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={text.trim().length === 0 || analyzing}
            className="min-h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl hover:shadow-emerald-600/30 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
          >
            {analyzing ? "Analyzing..." : "Analyze text"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={text.length === 0 && !workingText}
            className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="panel p-5 sm:p-6" aria-label="Result">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="icon-tile h-10 w-10">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
              <path d="M4 20V10M10 20V4M16 20v-8M21 20H3" strokeLinecap="round" />
            </svg>
          </span>
          <h3 className="text-lg font-semibold tracking-tight text-slate-900">Result</h3>
        </div>

        {analyzing && (
          <p role="status" className="mt-4 text-sm text-slate-700">
            Analyzing sentence patterns, phrases, and readability...
          </p>
        )}

        {!analysis && !analyzing && (
          <p className="mt-4 text-sm text-slate-600">
            Your result will appear here after you analyze text.
          </p>
        )}

        {analysis && !analyzing && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 text-xs">
              <span
                className={`rounded-full px-2.5 py-1 font-semibold ring-1 ${
                  analysis.overall.aiScore >= 65
                    ? "bg-red-50 text-red-800 ring-red-200"
                    : analysis.overall.aiScore >= 40
                      ? "bg-amber-50 text-amber-800 ring-amber-200"
                      : "bg-emerald-50 text-emerald-800 ring-emerald-200"
                }`}
              >
                Verdict: {analysis.overall.verdict}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700 ring-1 ring-slate-200">
                Confidence: {analysis.overall.confidence}
                {analysis.overall.confidence === "Low" ? " (short text, treat with care)" : ""}
              </span>
              {hasEdits && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800 ring-1 ring-emerald-200">
                  Showing your edited copy
                </span>
              )}
            </div>

            {hasEdits && originalAnalysis && (
              <p className="mt-3 text-sm text-slate-700" aria-live="polite">
                Showing your edited copy. Original score was{" "}
                {originalAnalysis.overall.aiScore}%, now {analysis.overall.aiScore}%.
              </p>
            )}

            <div className="mt-5 flex flex-col items-center gap-6 sm:flex-row">
              <Donut aiScore={analysis.overall.aiScore} />
              <div className="w-full flex-1 space-y-4">
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-xs font-semibold tracking-wider text-red-800 uppercase">
                      AI-pattern
                    </span>
                    <span className="text-4xl font-bold tracking-tight text-red-600">
                      {analysis.overall.aiScore}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-4 w-full overflow-hidden rounded-full bg-red-100 shadow-[inset_0_1px_3px_rgba(185,28,28,0.18)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-red-400 to-red-600 transition-all duration-500"
                      style={{ width: `${analysis.overall.aiScore}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-end justify-between gap-3">
                    <span className="text-xs font-semibold tracking-wider text-emerald-800 uppercase">
                      Human-pattern
                    </span>
                    <span className="text-4xl font-bold tracking-tight text-emerald-600">
                      {analysis.overall.humanScore}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-4 w-full overflow-hidden rounded-full bg-emerald-100 shadow-[inset_0_1px_3px_rgba(4,120,87,0.18)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-500"
                      style={{ width: `${analysis.overall.humanScore}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-4 rounded-2xl border border-amber-300/80 bg-gradient-to-b from-amber-50 to-amber-50/60 p-3 text-sm font-medium text-amber-900 shadow-sm">
              Estimate only. No detector can give a correct or proven percentage, and this score
              must not be used as proof of authorship.
            </p>

            <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-sm text-slate-700">
              <span>
                Words: <strong className="text-slate-900">{analysis.wordCount}</strong>
              </span>
              <span>
                Sentences: <strong className="text-slate-900">{analysis.sentenceCount}</strong>
              </span>
              <span>
                Flagged sentences:{" "}
                <strong className="text-slate-900">{flagged.length}</strong>
              </span>
            </div>

            {flagged.length > 0 && (
              <div className="mt-5">
                <h4 className="text-sm font-semibold text-slate-900">
                  Top flagged sentences
                </h4>
                <ol className="mt-3 space-y-3">
                  {flagged.slice(0, 5).map((sentence) => (
                    <li
                      key={sentence.index}
                      className={`rounded-2xl border border-l-4 p-4 shadow-sm ${
                        sentence.level === "high"
                          ? "border-red-200 border-l-red-500 bg-gradient-to-b from-red-50 to-red-50/50"
                          : "border-amber-200 border-l-amber-500 bg-gradient-to-b from-amber-50 to-amber-50/50"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold text-white ${
                            sentence.level === "high" ? "bg-red-600" : "bg-amber-500"
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
                      <div className="mt-3 flex gap-2.5 rounded-xl bg-white/75 px-3 py-2.5 ring-1 ring-slate-900/5">
                        <span aria-hidden="true" className="mt-0.5 shrink-0 text-amber-500">
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4.5 w-4.5">
                            <path d="M9.5 18.5h5M10.5 21h3" strokeLinecap="round" />
                            <path
                              d="M12 3.5a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.2 1.1 2.2h5c0-1 .4-1.6 1.1-2.2A6 6 0 0 0 12 3.5z"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </span>
                        <p className="text-sm text-slate-700">
                          <strong className="text-slate-900">Suggestion:</strong>{" "}
                          {sentence.improvement}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectSentence(sentence.index)}
                        aria-pressed={selectedIndex === sentence.index}
                        className={`mt-3 min-h-11 rounded-xl px-4 py-2 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                          selectedIndex === sentence.index
                            ? "bg-gradient-to-b from-slate-900 to-slate-950 text-white shadow-md hover:-translate-y-0.5"
                            : "border border-slate-300 bg-white text-slate-700 shadow-sm hover:-translate-y-0.5 hover:border-slate-400 hover:shadow"
                        }`}
                      >
                        Edit this sentence myself
                      </button>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {selectedSentence && (
              <div className="mt-5 rounded-3xl border border-emerald-200 bg-gradient-to-b from-emerald-50/90 via-slate-50 to-slate-50 p-4 shadow-[0_14px_34px_-22px_rgba(5,150,105,0.55)] sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-slate-900">
                    <span aria-hidden="true" className="icon-tile h-8 w-8 rounded-lg">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
                        <path d="M16.8 4.2a2.3 2.3 0 0 1 3.3 3.3L9 18.6 4.5 19.8 5.7 15.3z" strokeLinejoin="round" />
                        <path d="M14.5 6.5l3 3" strokeLinecap="round" />
                      </svg>
                    </span>
                    Edit sentence {selectedSentence.index + 1} of {analysis.sentences.length}
                  </h4>
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

                <div className="mt-3 flex gap-2.5 rounded-xl bg-white/80 px-3 py-2.5 ring-1 ring-emerald-900/5">
                  <span aria-hidden="true" className="mt-0.5 shrink-0 text-amber-500">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4.5 w-4.5">
                      <path d="M9.5 18.5h5M10.5 21h3" strokeLinecap="round" />
                      <path
                        d="M12 3.5a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.2 1.1 2.2h5c0-1 .4-1.6 1.1-2.2A6 6 0 0 0 12 3.5z"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <p className="text-sm text-slate-700">
                    <strong className="text-slate-900">Suggestion:</strong>{" "}
                    {selectedSentence.improvement}
                  </p>
                </div>

                <p className="mt-3 text-sm font-medium text-slate-900">
                  CrawlAI never writes text for you. You type your own replacement in your own
                  words.
                </p>

                <label
                  htmlFor="sentence-edit-box"
                  className="mt-3 block text-sm font-medium text-slate-900"
                >
                  Your replacement, in your own words
                </label>
                <textarea
                  id="sentence-edit-box"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={4}
                  className="mt-1 w-full rounded-2xl border border-slate-300 bg-white p-3 text-sm text-slate-900 shadow-[inset_0_2px_8px_rgba(15,23,42,0.06)] transition outline-none placeholder:text-slate-400 focus:border-emerald-500 focus:shadow-[inset_0_2px_8px_rgba(15,23,42,0.04),0_0_0_4px_rgba(16,185,129,0.15)]"
                />
                <div className="mt-1 flex justify-end text-xs text-slate-500" aria-live="polite">
                  {tokenizeWords(draft).length}{" "}
                  {tokenizeWords(draft).length === 1 ? "word" : "words"} in your replacement
                </div>

                <div className="mt-3 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={applyMyEdit}
                    disabled={draft === selectedSentence.text}
                    className="min-h-11 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-600/25 transition-all hover:-translate-y-0.5 hover:from-emerald-500 hover:to-teal-500 hover:shadow-xl hover:shadow-emerald-600/30 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                  >
                    Apply my edit
                  </button>
                  <button
                    type="button"
                    onClick={undoDraftChanges}
                    disabled={draft === selectedSentence.text}
                    className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-white hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                  >
                    Undo changes in this box
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  Applying swaps only this sentence in your working copy. Nothing is uploaded,
                  and your original pasted text stays untouched until you reset or clear.
                </p>
              </div>
            )}

            <div className="mt-5 rounded-3xl border border-slate-200 bg-gradient-to-b from-white to-slate-50/70 p-4 shadow-sm sm:p-5">
              <h4 className="flex items-center gap-2.5 text-sm font-semibold tracking-tight text-slate-900">
                <span aria-hidden="true" className="icon-tile h-8 w-8 rounded-lg">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
                    <path d="M6 3.5h8L18.5 8v12.5h-12.5z" strokeLinejoin="round" />
                    <path d="M13.5 3.5v5h5" strokeLinejoin="round" />
                  </svg>
                </span>
                Your final text
              </h4>
              <p className="mt-1.5 text-xs text-slate-500">
                This is your working copy: your original text plus only the edits you typed
                yourself above.
              </p>
              <div className="mt-3 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-3.5 text-sm whitespace-pre-wrap text-slate-900 shadow-[inset_0_2px_10px_rgba(15,23,42,0.05)]">
                {workingText}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={copyFinalText}
                  className="min-h-11 rounded-xl bg-gradient-to-b from-slate-900 to-slate-950 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/25 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  Copy my final text
                </button>
                <button
                  type="button"
                  onClick={downloadFinalText}
                  className="min-h-11 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                >
                  Download my final text (.txt)
                </button>
                <button
                  type="button"
                  onClick={resetToOriginal}
                  disabled={!hasEdits}
                  className="min-h-11 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent"
                >
                  Reset to my original text
                </button>
                <span role="status" aria-live="polite" className="text-sm font-medium text-emerald-700">
                  {copied ? "Copied" : ""}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={downloadReport}
              className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-slate-400 hover:shadow focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className="h-4 w-4">
                <path d="M12 4v11" strokeLinecap="round" />
                <path d="M7 11l5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M4.5 19.5h15" strokeLinecap="round" />
              </svg>
              Download report (.txt)
            </button>
          </div>
        )}
      </section>
    </div>
  );
}

function Donut({ aiScore }: { aiScore: number }) {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const aiLength = (aiScore / 100) * circumference;
  return (
    <div
      className="relative h-36 w-36 shrink-0"
      role="img"
      aria-label={`AI pattern ${aiScore} percent, human pattern ${100 - aiScore} percent`}
    >
      <div
        aria-hidden="true"
        className="absolute inset-3 rounded-full bg-gradient-to-tr from-emerald-300/35 via-teal-200/20 to-red-300/35 blur-xl"
      />
      <svg viewBox="0 0 120 120" className="relative h-36 w-36 -rotate-90 drop-shadow-sm">
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
    lines.push(`  Suggestion: ${s.improvement}`);
  }
  lines.push("", "Text as analyzed:", "", original, "");
  return lines.join("\n");
}
