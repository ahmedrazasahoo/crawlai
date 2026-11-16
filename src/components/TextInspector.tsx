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
        <label htmlFor="text-input" className="text-lg font-semibold text-slate-900">
          Your text
        </label>
        <textarea
          id="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={14}
          placeholder="Paste or type the text you want checked..."
          className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-4 text-base text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
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
            className="min-h-11 rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {analyzing ? "Analyzing..." : "Analyze text"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={text.length === 0 && !workingText}
            className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </section>

      <section className="panel p-5 sm:p-6" aria-label="Result">
        <h3 className="text-lg font-semibold text-slate-900">Result</h3>

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
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                Verdict: {analysis.overall.verdict}
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-700">
                Confidence: {analysis.overall.confidence}
                {analysis.overall.confidence === "Low" ? " (short text, treat with care)" : ""}
              </span>
              {hasEdits && (
                <span className="rounded-full bg-emerald-100 px-2.5 py-1 font-medium text-emerald-800">
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
                      className={`rounded-lg border p-4 ${
                        sentence.level === "high"
                          ? "border-red-200 bg-red-50"
                          : "border-amber-200 bg-amber-50"
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
                      <button
                        type="button"
                        onClick={() => selectSentence(sentence.index)}
                        aria-pressed={selectedIndex === sentence.index}
                        className={`mt-3 min-h-11 rounded-lg px-4 py-2 text-sm font-medium transition focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 ${
                          selectedIndex === sentence.index
                            ? "bg-slate-950 text-white hover:bg-slate-800"
                            : "border border-slate-300 bg-white text-slate-700 hover:border-slate-500"
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
              <div className="mt-5 rounded-lg border border-slate-300 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-sm font-semibold text-slate-900">
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

                <p className="mt-3 text-sm text-slate-700">
                  <strong className="text-slate-900">Strengthen it:</strong>{" "}
                  {selectedSentence.improvement}
                </p>

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
                  className="mt-1 w-full rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
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
                    className="min-h-11 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Apply my edit
                  </button>
                  <button
                    type="button"
                    onClick={undoDraftChanges}
                    disabled={draft === selectedSentence.text}
                    className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
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

            <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
              <h4 className="text-sm font-semibold text-slate-900">Your final text</h4>
              <p className="mt-1 text-xs text-slate-500">
                This is your working copy: your original text plus only the edits you typed
                yourself above.
              </p>
              <div className="mt-3 max-h-64 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm whitespace-pre-wrap text-slate-900">
                {workingText}
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={copyFinalText}
                  className="min-h-11 rounded-lg bg-slate-950 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  Copy my final text
                </button>
                <button
                  type="button"
                  onClick={downloadFinalText}
                  className="min-h-11 rounded-lg border border-slate-950 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
                >
                  Download my final text (.txt)
                </button>
                <button
                  type="button"
                  onClick={resetToOriginal}
                  disabled={!hasEdits}
                  className="min-h-11 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-500 focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="mt-5 min-h-11 rounded-lg border border-slate-950 bg-white px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-slate-100 focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2"
            >
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
  lines.push("", "Text as analyzed:", "", original, "");
  return lines.join("\n");
}
