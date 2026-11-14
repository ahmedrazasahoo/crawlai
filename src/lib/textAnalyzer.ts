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

export interface TextAnalysis {
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

  return {
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
    repeatedTrigrams: findRepeatedTrigrams(words),
    formulaicHits,
    formulaicTotal: formulaicHits.reduce((sum, h) => sum + h.count, 0),
    fleschReadingEase: flesch,
    fleschLabel: fleschLabel(flesch),
    syllableCount,
  };
}
