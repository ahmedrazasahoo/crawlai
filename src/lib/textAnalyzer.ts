export const FORMULAIC_PHRASES = [
  "in conclusion",
  "furthermore",
  "moreover",
  "delve",
  "delves",
  "delving",
  "tapestry",
  "it's important to note",
  "it is important to note",
  "in today's fast-paced world",
  "in todays fast-paced world",
  "in the ever-evolving",
  "ever-evolving landscape",
  "in summary",
  "overall",
  "additionally",
  "in addition",
  "notably",
  "crucial",
  "pivotal",
  "landscape",
  "realm",
  "furthermore,",
  "when it comes to",
  "at the end of the day",
  "a wide range of",
  "plays a crucial role",
  "plays a vital role",
  "it is worth noting",
  "needless to say",
  "in other words",
  "as a result",
  "on the other hand",
  "first and foremost",
  "last but not least",
] as const;

export interface PhraseHit {
  phrase: string;
  count: number;
}

export interface RepeatedPhrase {
  phrase: string;
  count: number;
}

export type PatternLevel = "high" | "mixed" | "human";

export type ConfidenceLevel = "Low" | "Medium" | "High";

export interface SentenceAnalysis {
  index: number;
  text: string;
  wordCount: number;
  score: number;
  level: PatternLevel;
  levelLabel: string;
  reasons: string[];
  improvement: string;
}

export interface OverallEstimate {
  aiScore: number;
  humanScore: number;
  confidence: ConfidenceLevel;
  verdict: string;
}

export interface TextAnalysis {
  overall: OverallEstimate;
  sentences: SentenceAnalysis[];
  wordCount: number;
  sentenceCount: number;
  characterCount: number;
  avgSentenceLength: number;
  sentenceLengths: number[];
  burstiness: {
    mean: number;
    standardDeviation: number;
    coefficientOfVariation: number;
    label: string;
  };
  lexicalDiversity: number;
  uniqueWordCount: number;
  repeatedTrigrams: RepeatedPhrase[];
  formulaicHits: PhraseHit[];
  formulaicTotal: number;
  fleschReadingEase: number | null;
  fleschLabel: string;
  syllableCount: number;
}

export function tokenizeWords(text: string): string[] {
  const matches = text.toLowerCase().match(/[a-z0-9']+/g);
  return matches ? matches : [];
}

export function splitSentences(text: string): string[] {
  return text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function estimateSyllables(word: string): number {
  const cleaned = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;
  const withoutSilentE = cleaned.replace(/(?:[^laeiouy]e|ed|es)$/, "");
  const vowelGroups = withoutSilentE.match(/[aeiouy]+/g);
  return Math.max(1, vowelGroups ? vowelGroups.length : 1);
}

export function burstinessScore(sentenceLengths: number[]): TextAnalysis["burstiness"] {
  if (sentenceLengths.length === 0) {
    return { mean: 0, standardDeviation: 0, coefficientOfVariation: 0, label: "No sentences found" };
  }
  const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
  const variance =
    sentenceLengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / sentenceLengths.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = mean === 0 ? 0 : standardDeviation / mean;
  let label = "High variation in sentence length";
  if (coefficientOfVariation < 0.3) label = "Low variation in sentence length";
  else if (coefficientOfVariation < 0.55) label = "Moderate variation in sentence length";
  return {
    mean: round2(mean),
    standardDeviation: round2(standardDeviation),
    coefficientOfVariation: round2(coefficientOfVariation),
    label,
  };
}

export function lexicalDiversity(words: string[]): { ratio: number; unique: number } {
  if (words.length === 0) return { ratio: 0, unique: 0 };
  const unique = new Set(words).size;
  return { ratio: round2(unique / words.length), unique };
}

export function findRepeatedTrigrams(words: string[]): RepeatedPhrase[] {
  const counts = new Map<string, number>();
  for (let i = 0; i + 2 < words.length; i++) {
    const phrase = words.slice(i, i + 3).join(" ");
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .filter(([, count]) => count > 1)
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase))
    .slice(0, 20);
}

export function findFormulaicPhrases(text: string): PhraseHit[] {
  const lower = text.toLowerCase();
  const hits: PhraseHit[] = [];
  for (const phrase of FORMULAIC_PHRASES) {
    if (phrase === "furthermore,") continue;
    let count = 0;
    let index = lower.indexOf(phrase);
    while (index !== -1) {
      count++;
      index = lower.indexOf(phrase, index + phrase.length);
    }
    if (count > 0) hits.push({ phrase, count });
  }
  return hits.sort((a, b) => b.count - a.count || a.phrase.localeCompare(b.phrase));
}

export function fleschLabel(score: number | null): string {
  if (score === null) return "Not enough text to estimate";
  if (score >= 90) return "Very easy to read";
  if (score >= 80) return "Easy to read";
  if (score >= 70) return "Fairly easy to read";
  if (score >= 60) return "Standard reading level";
  if (score >= 50) return "Fairly difficult to read";
  if (score >= 30) return "Difficult to read";
  return "Very difficult to read";
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

// Common transition words and openers that detectors often associate with
// generated text. Finding them is a style signal only, not proof.
export const TRANSITION_WORDS = [
  "furthermore",
  "moreover",
  "additionally",
  "in addition",
  "in conclusion",
  "in summary",
  "consequently",
  "therefore",
  "nevertheless",
  "on the other hand",
  "as a result",
  "overall",
  "notably",
  "thus",
  "hence",
  "in other words",
  "first and foremost",
  "it is important to note",
  "it's important to note",
] as const;

// Very common English words. A sentence built almost entirely from these,
// with few rare or specific words, tends to read as generic.
const COMMON_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "if", "while", "although", "because",
  "is", "are", "was", "were", "be", "been", "being", "it", "its", "this",
  "that", "these", "those", "of", "to", "in", "on", "for", "with", "as",
  "by", "at", "from", "into", "about", "over", "after", "before", "between",
  "through", "during", "can", "will", "would", "should", "could", "may",
  "might", "must", "we", "you", "they", "he", "she", "i", "have", "has",
  "had", "do", "does", "did", "not", "more", "most", "other", "some",
  "such", "no", "only", "own", "same", "so", "than", "too", "very", "just",
  "also", "each", "which", "their", "there", "when", "where", "who", "what",
  "how", "all", "any", "both", "few", "many", "much", "one", "our", "your",
  "his", "her", "them", "us", "him", "then", "once", "here", "out", "up",
  "down", "off", "again", "further", "now", "isn't", "are",
]);

export function splitSentencesKeepPunctuation(text: string): string[] {
  const matches = text.match(/[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g);
  if (!matches) return [];
  return matches.map((s) => s.trim()).filter((s) => tokenizeWords(s).length > 0);
}

// Replace one sentence, identified by the same index that
// splitSentencesKeepPunctuation and analyzeSentences use, with text the user
// typed themselves. Everything else in the document, including the spacing
// between sentences, is preserved exactly. If the index does not match a
// sentence, the original text is returned unchanged. An empty replacement
// removes that sentence from the copy, again only because the user chose to
// clear it. This function never generates wording of its own.
export function replaceSentence(text: string, index: number, replacement: string): string {
  if (index < 0) return text;
  const regex = /[^.!?]+[.!?]+["')\]]*|[^.!?]+$/g;
  const parts: string[] = [];
  let cursor = 0;
  let sentenceIndex = -1;
  let replaced = false;

  for (const match of text.matchAll(regex)) {
    const start = match.index ?? 0;
    const raw = match[0];
    parts.push(text.slice(cursor, start));
    const trimmed = raw.trim();
    const isSentence = tokenizeWords(trimmed).length > 0;
    if (isSentence) sentenceIndex += 1;

    if (isSentence && sentenceIndex === index && !replaced) {
      const leading = raw.slice(0, raw.length - raw.trimStart().length);
      const trailing = raw.slice(leading.length + trimmed.length);
      parts.push(leading + replacement.trim() + trailing);
      replaced = true;
    } else {
      parts.push(raw);
    }
    cursor = start + raw.length;
  }
  parts.push(text.slice(cursor));

  if (!replaced) return text;
  return parts.join("").replace(/[ \t]{2,}/g, " ").trim();
}

export function classifyScore(score: number): { level: PatternLevel; levelLabel: string } {
  if (score >= 65) return { level: "high", levelLabel: "High AI-pattern" };
  if (score >= 40) return { level: "mixed", levelLabel: "Mixed patterns" };
  return { level: "human", levelLabel: "Human-like" };
}

export function confidenceForWordCount(wordCount: number): ConfidenceLevel {
  if (wordCount > 200) return "High";
  if (wordCount >= 50) return "Medium";
  return "Low";
}

export function verdictForScore(aiScore: number): string {
  if (aiScore >= 65) return "Mostly AI-like patterns";
  if (aiScore >= 40) return "Mixed patterns";
  return "Mostly human-like patterns";
}

function countTransitions(text: string): number {
  const lower = text.toLowerCase();
  let total = 0;
  for (const word of TRANSITION_WORDS) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = lower.match(new RegExp(`\\b${escaped}\\b`, "g"));
    total += matches ? matches.length : 0;
  }
  return total;
}

function startsWithTransition(sentenceLower: string): string | null {
  const cleaned = sentenceLower.replace(/^["'(\s]+/, "");
  for (const word of TRANSITION_WORDS) {
    if (cleaned.startsWith(word)) return word;
  }
  return null;
}

function punctuationVariety(text: string): number {
  const types = [",", ";", ":", "(", '"', "'", "?", "!"];
  return types.filter((mark) => text.includes(mark)).length;
}

// Overall heuristic estimate. Weights (points out of 100, documented so the
// score can be audited):
//   Burstiness (sentence length coefficient of variation): 25 points.
//     Very uniform sentence lengths score the full 25, variation at or
//     above a coefficient of variation of 0.6 scores 0.
//   Formulaic AI phrase density: 20 points at 5 or more hits per 100 words.
//   Transition word density: 15 points at 4 or more per 100 words.
//   Lexical diversity: 15 points. A unique word ratio at or below 0.35
//     scores the full 15, a ratio at or above 0.75 scores 0.
//   Repeated trigram rate: 10 points at a rate of 0.2 or more.
//   Sentence length uniformity (share of sentences within 25 percent of
//     the mean length): 10 points.
//   Punctuation variety: 5 points. Fewer distinct punctuation types score
//     more, 5 or more types score 0.
// The result is an estimate of how strongly the text matches patterns that
// detectors look for. It is not, and cannot be, a proven percentage.
export function overallEstimate(params: {
  coefficientOfVariation: number;
  formulaicTotal: number;
  wordCount: number;
  text: string;
  lexicalDiversity: number;
  repeatedTrigrams: RepeatedPhrase[];
  sentenceLengths: number[];
}): OverallEstimate {
  const {
    coefficientOfVariation,
    formulaicTotal,
    wordCount,
    text,
    lexicalDiversity: diversity,
    repeatedTrigrams,
    sentenceLengths,
  } = params;
  if (wordCount === 0) {
    return { aiScore: 0, humanScore: 100, confidence: "Low", verdict: verdictForScore(0) };
  }

  const burstinessPoints = 25 * clamp(1 - coefficientOfVariation / 0.6, 0, 1);
  const formulaicDensity = (formulaicTotal / wordCount) * 100;
  const formulaicPoints = 20 * clamp(formulaicDensity / 5, 0, 1);
  const transitionDensity = (countTransitions(text) / wordCount) * 100;
  const transitionPoints = 15 * clamp(transitionDensity / 4, 0, 1);
  const diversityPoints = 15 * clamp((0.75 - diversity) / (0.75 - 0.35), 0, 1);
  const totalTrigrams = Math.max(0, wordCount - 2);
  const repeatedCount = repeatedTrigrams.reduce((sum, r) => sum + (r.count - 1), 0);
  const trigramRate = totalTrigrams === 0 ? 0 : repeatedCount / totalTrigrams;
  const trigramPoints = 10 * clamp(trigramRate / 0.2, 0, 1);

  let uniformityPoints = 0;
  if (sentenceLengths.length > 1) {
    const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    const nearMean = sentenceLengths.filter((len) => Math.abs(len - mean) <= mean * 0.25).length;
    uniformityPoints = 10 * (nearMean / sentenceLengths.length);
  }
  const varietyPoints = 5 * clamp(1 - (punctuationVariety(text) - 1) / 4, 0, 1);

  const aiScore = Math.round(
    clamp(
      burstinessPoints +
        formulaicPoints +
        transitionPoints +
        diversityPoints +
        trigramPoints +
        uniformityPoints +
        varietyPoints,
      0,
      100
    )
  );
  return {
    aiScore,
    humanScore: 100 - aiScore,
    confidence: confidenceForWordCount(wordCount),
    verdict: verdictForScore(aiScore),
  };
}

// Per sentence heuristic. Points out of 100:
//   Formulaic phrases inside the sentence: 20 points each, capped at 40.
//   Starts with a common AI transition: 20 points.
//   Length very close to the document average: up to 15 points.
//   Common word ratio: up to 15 points at a ratio of 0.6 or more.
//   Contains a trigram repeated elsewhere in the text: 10 points.
export function analyzeSentences(
  text: string,
  repeatedTrigrams: RepeatedPhrase[] = findRepeatedTrigrams(tokenizeWords(text))
): SentenceAnalysis[] {
  const sentences = splitSentencesKeepPunctuation(text);
  const lengths = sentences.map((s) => tokenizeWords(s).length);
  const meanLength = lengths.length
    ? lengths.reduce((a, b) => a + b, 0) / lengths.length
    : 0;

  return sentences.map((sentence, index) => {
    const words = tokenizeWords(sentence);
    const lower = sentence.toLowerCase();
    const reasons: string[] = [];
    let score = 0;

    const hits = findFormulaicPhrases(sentence);
    const hitTotal = hits.reduce((sum, h) => sum + h.count, 0);
    if (hitTotal > 0) {
      score += Math.min(40, hitTotal * 20);
      for (const hit of hits) {
        reasons.push(`Contains formulaic phrase: ${hit.phrase}`);
      }
    }

    const starter = startsWithTransition(lower);
    if (starter) {
      score += 20;
      reasons.push("Starts with a common AI transition");
    }

    if (meanLength > 0 && words.length > 0) {
      const closeness = Math.abs(words.length - meanLength) / meanLength;
      if (closeness <= 0.15) {
        score += 15;
        reasons.push("Sentence length is very close to the average for this text");
      } else if (closeness <= 0.3) {
        score += 8;
        reasons.push("Sentence length is close to the average for this text");
      }
    }

    if (words.length > 0) {
      const commonCount = words.filter((w) => COMMON_WORDS.has(w)).length;
      const ratio = commonCount / words.length;
      if (ratio >= 0.6) {
        score += 15;
        reasons.push("Very common word choices, with few specific or rare words");
      } else if (ratio >= 0.5) {
        score += 11;
        reasons.push("Mostly common word choices");
      } else if (ratio >= 0.4) {
        score += 7;
      } else if (ratio >= 0.3) {
        score += 3;
      }
    }

    const sentenceTrigrams = new Set<string>();
    for (let i = 0; i + 2 < words.length; i++) {
      sentenceTrigrams.add(words.slice(i, i + 3).join(" "));
    }
    const repeatedHere = repeatedTrigrams.filter((r) => sentenceTrigrams.has(r.phrase));
    if (repeatedHere.length > 0) {
      score += 10;
      reasons.push(`Repeats a phrase used elsewhere: ${repeatedHere[0].phrase}`);
    }

    if (reasons.length === 0) {
      reasons.push("No formulaic phrases, common transitions, or repeated wording found");
    }

    const { level, levelLabel } = classifyScore(Math.round(clamp(score, 0, 100)));

    let improvement =
      "Add a specific fact, a first-hand detail, or a citation if this sentence makes an important claim.";
    if (level === "human") {
      improvement =
        "Reads as specific and varied. No pattern based change is suggested for this sentence.";
    } else if (hitTotal > 0) {
      improvement =
        "Add a specific fact or number here instead of relying on a stock phrase, for example a date, a measurement, or a named source.";
    } else if (repeatedHere.length > 0) {
      improvement =
        "Add a concrete example or a citation for this point, since the same wording appears elsewhere in the text.";
    } else if (starter) {
      improvement =
        "Add first-hand detail here, what you did, saw, or tested, so the point stands on direct experience.";
    } else if (score >= 40) {
      improvement =
        "Add a specific detail, name, or number to make this sentence more concrete.";
    }

    return {
      index,
      text: sentence,
      wordCount: words.length,
      score: Math.round(clamp(score, 0, 100)),
      level,
      levelLabel,
      reasons,
      improvement,
    };
  });
}

export function analyzeText(input: string): TextAnalysis {
  const text = input ?? "";
  const words = tokenizeWords(text);
  const sentences = splitSentences(text);
  const sentenceLengths = sentences.map((s) => tokenizeWords(s).length).filter((n) => n > 0);
  const burstiness = burstinessScore(sentenceLengths);
  const diversity = lexicalDiversity(words);
  const syllableCount = words.reduce((sum, w) => sum + estimateSyllables(w), 0);

  let flesch: number | null = null;
  if (words.length > 0 && sentenceLengths.length > 0) {
    flesch = round2(
      206.835 - 1.015 * (words.length / sentenceLengths.length) - 84.6 * (syllableCount / words.length)
    );
  }

  const formulaicHits = findFormulaicPhrases(text);
  const repeatedTrigrams = findRepeatedTrigrams(words);
  const formulaicTotal = formulaicHits.reduce((sum, h) => sum + h.count, 0);

  return {
    overall: overallEstimate({
      coefficientOfVariation: burstiness.coefficientOfVariation,
      formulaicTotal,
      wordCount: words.length,
      text,
      lexicalDiversity: diversity.ratio,
      repeatedTrigrams,
      sentenceLengths,
    }),
    sentences: analyzeSentences(text, repeatedTrigrams),
    wordCount: words.length,
    sentenceCount: sentenceLengths.length,
    characterCount: text.length,
    avgSentenceLength: sentenceLengths.length
      ? round2(words.length / sentenceLengths.length)
      : 0,
    sentenceLengths,
    burstiness,
    lexicalDiversity: diversity.ratio,
    uniqueWordCount: diversity.unique,
    repeatedTrigrams,
    formulaicHits,
    formulaicTotal,
    fleschReadingEase: flesch,
    fleschLabel: fleschLabel(flesch),
    syllableCount,
  };
}
