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
  "plays an important role",
  "plays a key role",
  "plays a significant role",
  "in today's",
  "in this article",
  "we will explore",
  "it is important to",
  "increasingly popular",
  "becoming increasingly popular",
  "particularly useful",
  "particularly important",
  "in simple terms",
  "designed to",
  "for example",
  "real-world applications",
  "can help",
  "is expected to",
  "comes into play",
  "come into play",
  "one of the most",
  "wide range of",
  "helps",
  "allows",
  "enables",
  "provides",
  "offers",
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

export interface FeatureContribution {
  id: string;
  label: string;
  value: number;
  displayValue: string;
  points: number;
  maxPoints: number;
  detail: string;
}

export interface LongFormFeatures {
  isLongForm: boolean;
  specificityCount: number;
  specificityDensity: number;
  uniqueProperNouns: number;
  sentenceStarterRepetition: number;
  repeatedSentenceStarters: number;
  mediumSentenceShare: number;
  trimmedCoefficientOfVariation: number;
  abstractFillerCount: number;
  abstractFillerDensity: number;
  headingCount: number;
  sectionCount: number;
  structureBalance: number;
  structurePoints: number;
}

export interface TextAnalysis {
  overall: OverallEstimate;
  features: FeatureContribution[];
  longForm: LongFormFeatures;
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
  const lower = text
    .toLowerCase()
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u2010\u2011\u2012\u2013]/g, "-");
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

// Long-form signals. Generic long-form AI blog writing often looks varied
// on the surface while staying empty underneath: almost no numbers, names,
// dates, measurements, or first-hand detail, the same sentence starters
// again and again, sentences clustered in one medium length band, abstract
// filler vocabulary, stock blog phrases, and a perfectly templated section
// structure. These signals are computed for every text but only scored
// when the text is long (over 300 words), because short text cannot carry
// them reliably. The methods are inspired by published detector research
// (probability curvature in DetectGPT and Fast-DetectGPT, cross-model
// perplexity ratios in Binoculars, and classic stylometry features such as
// burstiness, type-token ratio, and function word patterns). All code here
// is original to this project and runs locally.

const FIRST_SECOND_PERSON = new Set([
  "i", "me", "my", "mine", "we", "us", "our", "ours", "you", "your", "yours",
]);

const DATE_WORDS = new Set([
  "monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "may", "june", "july", "august",
  "september", "october", "november", "december",
]);

const UNIT_WORDS = new Set([
  "km", "kilometer", "kilometers", "kilometre", "kilometres", "m", "meter",
  "meters", "metre", "metres", "cm", "mm", "kg", "g", "mg", "l", "ml",
  "ms", "sec", "secs", "second", "seconds", "minute", "minutes", "hour",
  "hours", "hz", "khz", "mhz", "ghz", "w", "kw", "v", "volt", "volts",
  "ah", "mah", "mbps", "kbps", "gbps", "percent", "percentage", "dollars",
  "dollar", "euros", "euro", "rupees", "pounds", "inch", "inches", "feet",
  "foot", "miles", "mile", "yards", "tons", "tonnes", "bytes", "kb", "mb",
  "gb", "db", "ppm",
]);

const ABSTRACT_FILLER_WORDS = new Set([
  "technology", "technologies", "connected", "connectivity", "system",
  "systems", "application", "applications", "solution", "solutions",
  "efficiency", "efficient", "efficiently", "important", "importance",
  "various", "different", "modern", "significant", "significantly",
  "effective", "effectively", "reliable", "reliability", "innovative",
  "innovation", "advanced", "crucial", "vital", "essential", "particularly",
  "benefits", "benefit", "impact", "future", "landscape", "ecosystem",
  "capabilities", "capability", "numerous", "multiple", "overall",
  "comprehensive", "seamless", "powerful", "valuable", "useful", "wide",
  "range", "key", "increasingly", "transforming", "transformed", "enables",
  "enable", "allows", "allow", "provides", "provide", "offers", "offer",
  "helps", "help", "designed", "importantly", "notably",
]);

// Capitalized words that are common nouns or title words in blog structure,
// not names. They are not counted as proper noun specifics.
const CAPITALIZED_COMMON = new Set([
  "the", "this", "these", "those", "it", "in", "on", "for", "as", "a", "an",
  "but", "and", "or", "if", "when", "while", "long", "low", "smart",
  "connected", "temperature", "soil", "room", "air", "water", "energy",
  "examples", "example", "benefits", "advantages", "limitations", "security",
  "hardware", "range", "power", "consumption", "communication", "data",
  "network", "networks", "device", "devices", "systems", "system",
  "technology", "technologies", "monitoring", "management", "street",
  "lighting", "waste", "parking", "environmental", "industrial", "building",
  "buildings", "agriculture", "cities", "city", "introduction", "conclusion",
  "future", "applications", "application", "faq", "faqs", "monday",
  "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday",
  "january", "february", "march", "april", "june", "july", "august",
  "september", "october", "november", "december",
]);

function proseLines(text: string): string[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !line.startsWith("#") &&
        !line.startsWith("|") &&
        !/^[-*_]{3,}$/.test(line)
    )
    .map((line) =>
      line
        .replace(/^[-*+]\s+/, "")
        .replace(/^\d+[.)]\s+/, "")
        .replace(/\*\*/g, "")
        .trim()
    )
    .filter((line) => line.length > 0);
}

function proseText(text: string): string {
  return proseLines(text).join(" ");
}

function proseSentenceTokens(text: string): string[][] {
  return splitSentencesKeepPunctuation(proseText(text))
    .map((sentence) => tokenizeWords(sentence))
    .filter((tokens) => tokens.length > 0);
}

function specificityStats(
  text: string,
  wordCount: number
): { count: number; density: number; uniqueProperNouns: number } {
  const prose = proseText(text);
  const lowerTokens = tokenizeWords(prose);

  const proper = new Set<string>();
  for (const sentence of splitSentencesKeepPunctuation(prose)) {
    const tokens =
      sentence.match(/[A-Za-z][A-Za-z0-9]*(?:[-'][A-Za-z0-9]+)*/g) ?? [];
    for (const token of tokens.slice(1)) {
      if (token === "I") continue;
      const isAcronym = /^[A-Z0-9]{2,}$/.test(token) && /[A-Z]/.test(token);
      const hasUpperBeyondFirst = /[A-Z]/.test(token.slice(1));
      const isCapitalized = /^[A-Z][a-z]+$/.test(token);
      if (
        isAcronym ||
        hasUpperBeyondFirst ||
        (isCapitalized && !CAPITALIZED_COMMON.has(token.toLowerCase()))
      ) {
        proper.add(token.toLowerCase());
      }
    }
  }

  const numericCount = (prose.match(/\b\d+(?:[.,]\d+)?\b/g) ?? []).length;
  let unitCount = 0;
  for (let i = 1; i < lowerTokens.length; i++) {
    if (/^\d+(?:[.,]\d+)?$/.test(lowerTokens[i - 1]) && UNIT_WORDS.has(lowerTokens[i])) {
      unitCount++;
    }
  }
  const percentCount = (prose.match(/%/g) ?? []).length;
  const dateCount = lowerTokens.filter((w) => DATE_WORDS.has(w)).length;
  const pronounCount = lowerTokens.filter((w) => FIRST_SECOND_PERSON.has(w)).length;
  const quoteCount = (prose.match(/["\u201c][^"\u201d]{3,}["\u201d]/g) ?? []).length;
  const urlCount =
    (prose.match(/(https?:\/\/|www\.)\S+/gi) ?? []).length +
    (prose.match(/\[\d+\]/g) ?? []).length;

  const count =
    numericCount +
    unitCount +
    percentCount +
    dateCount +
    pronounCount +
    quoteCount +
    urlCount +
    proper.size;
  return {
    count,
    density: wordCount === 0 ? 0 : round2((count / wordCount) * 100),
    uniqueProperNouns: proper.size,
  };
}

function starterStats(text: string): { rate: number; repeated: number } {
  const sentences = proseSentenceTokens(text).filter((tokens) => tokens.length >= 3);
  if (sentences.length === 0) return { rate: 0, repeated: 0 };
  const counts = new Map<string, number>();
  for (const tokens of sentences) {
    const starter = tokens.slice(0, 2).join(" ");
    counts.set(starter, (counts.get(starter) ?? 0) + 1);
  }
  let repeated = 0;
  for (const count of counts.values()) {
    if (count > 1) repeated += count - 1;
  }
  return { rate: round2(repeated / sentences.length), repeated };
}

function mediumStats(text: string): { share: number; trimmedCv: number } {
  const lengths = proseSentenceTokens(text)
    .map((tokens) => tokens.length)
    .filter((len) => len >= 5);
  if (lengths.length === 0) return { share: 0, trimmedCv: 0 };
  const share = lengths.filter((len) => len >= 12 && len <= 28).length / lengths.length;
  const sorted = [...lengths].sort((a, b) => a - b);
  const trim = sorted.length >= 20 ? Math.floor(sorted.length * 0.1) : 0;
  const trimmed = sorted.slice(trim, sorted.length - trim);
  const mean = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
  const variance =
    trimmed.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / trimmed.length;
  const trimmedCv = mean === 0 ? 0 : Math.sqrt(variance) / mean;
  return { share: round2(share), trimmedCv: round2(trimmedCv) };
}

function structureStats(text: string): {
  headingCount: number;
  sectionCount: number;
  balance: number;
  points: number;
} {
  const lines = text.split(/\r?\n/);
  const headingIndexes = lines
    .map((line, index) => (/^#{1,6}\s+/.test(line.trim()) ? index : -1))
    .filter((index) => index >= 0);
  const headingCount = headingIndexes.length;
  if (headingCount === 0) return { headingCount: 0, sectionCount: 0, balance: 0, points: 0 };

  const sections: number[] = [];
  let current = 0;
  let inSection = false;
  for (const line of lines) {
    if (/^#{1,6}\s+/.test(line.trim())) {
      if (inSection) sections.push(current);
      current = 0;
      inSection = true;
    } else if (inSection) {
      current += tokenizeWords(line).length;
    }
  }
  if (inSection) sections.push(current);
  const usable = sections.filter((count) => count >= 20);
  let balance = 0;
  if (usable.length >= 4) {
    const mean = usable.reduce((a, b) => a + b, 0) / usable.length;
    const variance =
      usable.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / usable.length;
    balance = round2(mean === 0 ? 0 : Math.sqrt(variance) / mean);
  }

  const headingText = headingIndexes
    .map((index) => lines[index].toLowerCase())
    .join(" ");
  let points = 0;
  points += 1.2 * clamp((headingCount - 5) / 10, 0, 1);
  if (usable.length >= 4) points += 1.6 * clamp(1 - balance / 1.2, 0, 1);
  if (headingText.includes("introduction")) points += 0.4;
  if (headingText.includes("conclusion")) points += 0.4;
  if (headingText.includes("frequently asked questions") || /\bfaq\b/.test(headingText)) {
    points += 0.4;
  }
  return {
    headingCount,
    sectionCount: usable.length,
    balance,
    points: round2(clamp(points, 0, 4)),
  };
}

export function computeLongFormFeatures(text: string, wordCount: number): LongFormFeatures {
  const specificity = specificityStats(text, wordCount);
  const starters = starterStats(text);
  const medium = mediumStats(text);
  const structure = structureStats(text);
  const lowerTokens = tokenizeWords(proseText(text));
  const abstractCount = lowerTokens.filter((w) => ABSTRACT_FILLER_WORDS.has(w)).length;
  return {
    isLongForm: wordCount > 300,
    specificityCount: specificity.count,
    specificityDensity: specificity.density,
    uniqueProperNouns: specificity.uniqueProperNouns,
    sentenceStarterRepetition: starters.rate,
    repeatedSentenceStarters: starters.repeated,
    mediumSentenceShare: medium.share,
    trimmedCoefficientOfVariation: medium.trimmedCv,
    abstractFillerCount: abstractCount,
    abstractFillerDensity: wordCount === 0 ? 0 : round2((abstractCount / wordCount) * 100),
    headingCount: structure.headingCount,
    sectionCount: structure.sectionCount,
    structureBalance: structure.balance,
    structurePoints: structure.points,
  };
}

// Scoring weights, documented so the score can be audited. The total is
// always 100 points.
//
// Short text (300 words or fewer) keeps the original calibration:
//   Burstiness 25, formulaic phrase density 20, transition density 15,
//   lexical diversity 15, repeated trigrams 10, sentence uniformity 10,
//   punctuation variety 5.
//
// Long text (over 300 words) uses the long-form calibration, where the
// surface signals are compressed and the long-form signals carry the
// weight, because long generic AI writing is usually varied on the
// surface but empty underneath:
//   Burstiness 8, formulaic phrase density 16, transition density 4,
//   lexical diversity 6, repeated trigrams 3, sentence uniformity 2,
//   punctuation variety 1, specificity deficit 28, sentence starter
//   repetition 9, medium sentence concentration 9, abstract filler
//   density 10, structure uniformity 4. Total 100.
//
// The result is an estimate of how strongly the text matches patterns
// that detectors look for. It is not, and cannot be, a proven percentage.
export function buildFeatureContributions(params: {
  coefficientOfVariation: number;
  formulaicTotal: number;
  wordCount: number;
  text: string;
  lexicalDiversity: number;
  repeatedTrigrams: RepeatedPhrase[];
  sentenceLengths: number[];
  longForm: LongFormFeatures;
}): FeatureContribution[] {
  const {
    coefficientOfVariation,
    formulaicTotal,
    wordCount,
    text,
    lexicalDiversity: diversity,
    repeatedTrigrams,
    sentenceLengths,
    longForm,
  } = params;
  const features: FeatureContribution[] = [];
  const add = (
    id: string,
    label: string,
    value: number,
    displayValue: string,
    points: number,
    maxPoints: number,
    detail: string
  ) => {
    features.push({
      id,
      label,
      value,
      displayValue,
      points: round2(clamp(points, 0, maxPoints)),
      maxPoints,
      detail,
    });
  };
  if (wordCount === 0) return features;

  const burstinessFactor = clamp(1 - coefficientOfVariation / 0.6, 0, 1);
  const formulaicDensity = (formulaicTotal / wordCount) * 100;
  const transitionDensity = (countTransitions(text) / wordCount) * 100;
  const diversityFactor = clamp((0.75 - diversity) / (0.75 - 0.35), 0, 1);
  const totalTrigrams = Math.max(0, wordCount - 2);
  const repeatedCount = repeatedTrigrams.reduce((sum, r) => sum + (r.count - 1), 0);
  const trigramRate = totalTrigrams === 0 ? 0 : repeatedCount / totalTrigrams;
  let nearMeanShare = 0;
  if (sentenceLengths.length > 1) {
    const mean = sentenceLengths.reduce((a, b) => a + b, 0) / sentenceLengths.length;
    nearMeanShare =
      sentenceLengths.filter((len) => Math.abs(len - mean) <= mean * 0.25).length /
      sentenceLengths.length;
  }
  const varietyFactor = clamp(1 - (punctuationVariety(text) - 1) / 4, 0, 1);

  if (!longForm.isLongForm) {
    add("burstiness", "Burstiness", coefficientOfVariation, `CV ${coefficientOfVariation}`, 25 * burstinessFactor, 25, "Very uniform sentence lengths score high. Varied lengths score low.");
    add("formulaic", "Formulaic phrases", formulaicDensity, `${round2(formulaicDensity)} per 100 words`, 20 * clamp(formulaicDensity / 5, 0, 1), 20, "Stock AI style phrases, scaled by density.");
    add("transitions", "Transition words", transitionDensity, `${round2(transitionDensity)} per 100 words`, 15 * clamp(transitionDensity / 4, 0, 1), 15, "Common generated text transitions and openers.");
    add("diversity", "Lexical diversity", diversity, `${diversity} unique ratio`, 15 * diversityFactor, 15, "A low share of unique words scores high.");
    add("trigrams", "Repeated phrases", trigramRate, `${round2(trigramRate * 100)}% repeated`, 10 * clamp(trigramRate / 0.2, 0, 1), 10, "Three word phrases repeated across the text.");
    add("uniformity", "Sentence uniformity", nearMeanShare, `${Math.round(nearMeanShare * 100)}% near the mean length`, 10 * nearMeanShare, 10, "Share of sentences close to the average length.");
    add("punctuation", "Punctuation variety", punctuationVariety(text), `${punctuationVariety(text)} mark types`, 5 * varietyFactor, 5, "Fewer kinds of punctuation score high.");
    return features;
  }

  add("burstiness", "Burstiness", coefficientOfVariation, `CV ${coefficientOfVariation}`, 8 * burstinessFactor, 8, "Sentence length variation, compressed in long-form scoring.");
  add("formulaic", "Formulaic phrases", formulaicDensity, `${round2(formulaicDensity)} per 100 words`, 16 * clamp(formulaicDensity / 4, 0, 1), 16, "Stock blog and AI style phrases, scaled by density.");
  add("transitions", "Transition words", transitionDensity, `${round2(transitionDensity)} per 100 words`, 4 * clamp(transitionDensity / 3, 0, 1), 4, "Common generated text transitions and openers.");
  add("diversity", "Lexical diversity", diversity, `${diversity} unique ratio`, 6 * diversityFactor, 6, "A low share of unique words scores high.");
  add("trigrams", "Repeated phrases", trigramRate, `${round2(trigramRate * 100)}% repeated`, 3 * clamp(trigramRate / 0.2, 0, 1), 3, "Three word phrases repeated across the text.");
  add("uniformity", "Sentence uniformity", nearMeanShare, `${Math.round(nearMeanShare * 100)}% near the mean length`, 2 * nearMeanShare, 2, "Share of sentences close to the average length.");
  add("punctuation", "Punctuation variety", punctuationVariety(text), `${punctuationVariety(text)} mark types`, 1 * varietyFactor, 1, "Fewer kinds of punctuation score high.");
  add(
    "specificity",
    "Specificity deficit",
    longForm.specificityDensity,
    `${longForm.specificityDensity} specifics per 100 words`,
    28 * clamp((4.2 - longForm.specificityDensity) / (4.2 - 0.8), 0, 1),
    28,
    "Numbers, units, dates, names, pronouns, quotes and citations. Near zero in generic long-form writing, high in first-hand writing."
  );
  add(
    "starters",
    "Repeated sentence starters",
    longForm.sentenceStarterRepetition,
    `${Math.round(longForm.sentenceStarterRepetition * 100)}% repeated starters`,
    9 * clamp(longForm.sentenceStarterRepetition / 0.18, 0, 1),
    9,
    "How often sentences begin with the same two words."
  );
  add(
    "medium",
    "Medium sentence concentration",
    longForm.mediumSentenceShare,
    `${Math.round(longForm.mediumSentenceShare * 100)}% of sentences are 12 to 28 words`,
    9 *
      clamp((longForm.mediumSentenceShare - 0.35) / 0.4, 0, 1) *
      clamp(1 - longForm.trimmedCoefficientOfVariation / 0.7, 0, 1),
    9,
    "Sentences clustered in one medium band, measured with a trimmed variation so a few outliers do not hide the pattern."
  );
  add(
    "abstract",
    "Abstract filler density",
    longForm.abstractFillerDensity,
    `${longForm.abstractFillerDensity} per 100 words`,
    10 * clamp((longForm.abstractFillerDensity - 1.5) / (5 - 1.5), 0, 1),
    10,
    "Abstract generic vocabulary used in place of concrete detail."
  );
  add(
    "structure",
    "Structure uniformity",
    longForm.headingCount,
    `${longForm.headingCount} headings, ${longForm.sectionCount} balanced sections`,
    longForm.structurePoints,
    4,
    "Templated heading structure with balanced sections, an introduction, a conclusion, and a FAQ block."
  );
  return features;
}

export function overallEstimate(params: {
  coefficientOfVariation: number;
  formulaicTotal: number;
  wordCount: number;
  text: string;
  lexicalDiversity: number;
  repeatedTrigrams: RepeatedPhrase[];
  sentenceLengths: number[];
  longForm?: LongFormFeatures;
  features?: FeatureContribution[];
}): OverallEstimate {
  const { wordCount, text } = params;
  if (wordCount === 0) {
    return { aiScore: 0, humanScore: 100, confidence: "Low", verdict: verdictForScore(0) };
  }
  const longForm = params.longForm ?? computeLongFormFeatures(text, wordCount);
  const features =
    params.features ??
    buildFeatureContributions({ ...params, longForm });
  const aiScore = Math.round(
    clamp(
      features.reduce((sum, feature) => sum + feature.points, 0),
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
  const longForm = computeLongFormFeatures(text, words.length);
  const features = buildFeatureContributions({
    coefficientOfVariation: burstiness.coefficientOfVariation,
    formulaicTotal,
    wordCount: words.length,
    text,
    lexicalDiversity: diversity.ratio,
    repeatedTrigrams,
    sentenceLengths,
    longForm,
  });

  return {
    overall: overallEstimate({
      coefficientOfVariation: burstiness.coefficientOfVariation,
      formulaicTotal,
      wordCount: words.length,
      text,
      lexicalDiversity: diversity.ratio,
      repeatedTrigrams,
      sentenceLengths,
      longForm,
      features,
    }),
    features,
    longForm,
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
