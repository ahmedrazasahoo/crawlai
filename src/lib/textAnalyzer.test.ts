import { describe, expect, it } from "vitest";
import {
  analyzeText,
  burstinessScore,
  findFormulaicPhrases,
  findRepeatedTrigrams,
  lexicalDiversity,
  tokenizeWords,
} from "./textAnalyzer";

describe("burstinessScore", () => {
  it("reports low variation for uniform sentence lengths", () => {
    const result = burstinessScore([10, 10, 10, 10]);
    expect(result.mean).toBe(10);
    expect(result.standardDeviation).toBe(0);
    expect(result.coefficientOfVariation).toBe(0);
    expect(result.label).toContain("Low variation");
  });

  it("reports high variation for mixed sentence lengths", () => {
    const result = burstinessScore([2, 20, 3, 25, 4]);
    expect(result.coefficientOfVariation).toBeGreaterThan(0.55);
    expect(result.label).toContain("High variation");
  });

  it("handles an empty list", () => {
    const result = burstinessScore([]);
    expect(result.mean).toBe(0);
    expect(result.label).toContain("No sentences");
  });
});

describe("lexicalDiversity", () => {
  it("computes unique words over total words", () => {
    const result = lexicalDiversity(["the", "cat", "the", "dog"]);
    expect(result.unique).toBe(3);
    expect(result.ratio).toBe(0.75);
  });

  it("handles empty input", () => {
    expect(lexicalDiversity([])).toEqual({ ratio: 0, unique: 0 });
  });
});

describe("findRepeatedTrigrams", () => {
  it("finds a 3 word phrase repeated in the text", () => {
    const words = tokenizeWords("the quick brown fox jumps. The quick brown fox rests.");
    const repeated = findRepeatedTrigrams(words);
    expect(repeated.some((r) => r.phrase === "the quick brown" && r.count === 2)).toBe(true);
  });

  it("returns nothing when no phrase repeats", () => {
    const words = tokenizeWords("one two three four five six");
    expect(findRepeatedTrigrams(words)).toEqual([]);
  });
});

describe("findFormulaicPhrases", () => {
  it("detects built in formulaic phrases with counts", () => {
    const hits = findFormulaicPhrases(
      "In conclusion, this matters. Furthermore, in conclusion we should act."
    );
    const conclusion = hits.find((h) => h.phrase === "in conclusion");
    const furthermore = hits.find((h) => h.phrase === "furthermore");
    expect(conclusion?.count).toBe(2);
    expect(furthermore?.count).toBe(1);
  });

  it("returns nothing for plain specific writing", () => {
    const hits = findFormulaicPhrases("I fixed the pump on Tuesday. It took two hours and one new seal.");
    expect(hits).toEqual([]);
  });
});

describe("analyzeText", () => {
  it("counts words and sentences and gives a readability estimate", () => {
    const result = analyzeText("The cat sat. The dog ran fast today.");
    expect(result.wordCount).toBe(8);
    expect(result.sentenceCount).toBe(2);
    expect(result.fleschReadingEase).not.toBeNull();
  });

  it("handles empty text without throwing", () => {
    const result = analyzeText("");
    expect(result.wordCount).toBe(0);
    expect(result.fleschReadingEase).toBeNull();
  });
});
