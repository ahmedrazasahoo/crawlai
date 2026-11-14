"use client";

import { useMemo, useState } from "react";
import { analyzeText } from "@/lib/textAnalyzer";

export default function TextInspector() {
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState("");
  const analysis = useMemo(() => (submitted ? analyzeText(submitted) : null), [submitted]);

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
          className="mt-3 w-full rounded-xl border border-slate-300 bg-white p-4 text-sm text-slate-900 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200"
        />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setSubmitted(text)}
            disabled={text.trim().length === 0}
            className="rounded-lg bg-slate-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Get feedback report
          </button>
          <span className="text-xs text-slate-500">
            {text.trim() ? `${text.length} characters typed` : "Add at least a few sentences for a useful report"}
          </span>
        </div>
      </div>

      {analysis && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Words" value={String(analysis.wordCount)} />
            <StatCard label="Sentences" value={String(analysis.sentenceCount)} />
            <StatCard
              label="Avg sentence length"
              value={`${analysis.avgSentenceLength} words`}
            />
            <StatCard
              label="Readability (Flesch)"
              value={
                analysis.fleschReadingEase === null ? "N/A" : String(analysis.fleschReadingEase)
              }
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
                <strong>{analysis.lexicalDiversity}</strong> ({analysis.uniqueWordCount} unique words
                out of {analysis.wordCount})
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
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-semibold tracking-wide text-slate-500 uppercase">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
    </div>
  );
}
