import { describe, expect, it } from "vitest";
import {
  analyzeSentences,
  analyzeText,
  burstinessScore,
  classifyScore,
  confidenceForWordCount,
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

describe("classifyScore thresholds", () => {
  it("classifies 65 and above as high", () => {
    expect(classifyScore(65).level).toBe("high");
    expect(classifyScore(100).level).toBe("high");
  });
  it("classifies 40 to 64 as mixed", () => {
    expect(classifyScore(40).level).toBe("mixed");
    expect(classifyScore(64).level).toBe("mixed");
  });
  it("classifies under 40 as human-like", () => {
    expect(classifyScore(39).level).toBe("human");
    expect(classifyScore(0).level).toBe("human");
  });
});

describe("confidenceForWordCount", () => {
  it("is Low under 50 words", () => {
    expect(confidenceForWordCount(0)).toBe("Low");
    expect(confidenceForWordCount(49)).toBe("Low");
  });
  it("is Medium from 50 to 200 words", () => {
    expect(confidenceForWordCount(50)).toBe("Medium");
    expect(confidenceForWordCount(200)).toBe("Medium");
  });
  it("is High over 200 words", () => {
    expect(confidenceForWordCount(201)).toBe("High");
  });
});

describe("overall estimate", () => {
  const aiLike =
    "Furthermore, it is important to note that this topic is crucial. Moreover, it is important to note that this topic is crucial. Additionally, it is important to note that this topic is crucial. In conclusion, it is important to note that this topic is crucial.";
  const humanLike =
    "I swapped the cracked seal on Tuesday morning. It took 40 minutes, one wrench, and a fair bit of swearing. The leak stopped. My neighbour Tom reckons the old seal was from 2011, and the part number stamped on it, 47B, backs him up.";

  it("gives human score as 100 minus AI score", () => {
    const result = analyzeText(aiLike);
    expect(result.overall.aiScore + result.overall.humanScore).toBe(100);
    expect(result.overall.aiScore).toBeGreaterThanOrEqual(0);
    expect(result.overall.aiScore).toBeLessThanOrEqual(100);
  });

  it("scores formulaic uniform text higher than specific varied text", () => {
    const ai = analyzeText(aiLike);
    const human = analyzeText(humanLike);
    expect(ai.overall.aiScore).toBeGreaterThan(human.overall.aiScore);
  });

  it("labels verdict from the score bands", () => {
    const ai = analyzeText(aiLike);
    if (ai.overall.aiScore >= 65) expect(ai.overall.verdict).toBe("Mostly AI-like patterns");
    else if (ai.overall.aiScore >= 40) expect(ai.overall.verdict).toBe("Mixed patterns");
    else expect(ai.overall.verdict).toBe("Mostly human-like patterns");
  });

  it("reports confidence from word count in a full analysis", () => {
    expect(analyzeText("One two three.").overall.confidence).toBe("Low");
    const medium = Array.from({ length: 10 }, (_, i) =>
      `Sentence number ${i} talks about topic ${i} with several plain words inside it today.`
    ).join(" ");
    expect(analyzeText(medium).overall.confidence).toBe("Medium");
    const long = Array.from({ length: 30 }, (_, i) =>
      `Paragraph sentence ${i} covers a different subject ${i} with ten or so varied words in it.`
    ).join(" ");
    expect(analyzeText(long).overall.confidence).toBe("High");
  });
});

describe("per-sentence analysis", () => {
  it("flags a formulaic transition sentence as high with reasons", () => {
    const sentences = analyzeSentences(
      "Furthermore, it is important to note that we should delve into this crucial topic. I fixed the pump on Tuesday with a 12 mm wrench."
    );
    const first = sentences[0];
    expect(first.score).toBeGreaterThanOrEqual(65);
    expect(first.level).toBe("high");
    expect(first.reasons.some((r) => r.includes("formulaic phrase"))).toBe(true);
    expect(first.reasons.some((r) => r.includes("common AI transition"))).toBe(true);
    expect(first.improvement.length).toBeGreaterThan(10);
  });

  it("scores a specific human sentence as human-like", () => {
    const sentences = analyzeSentences(
      "Furthermore, it is important to note that we should delve into this crucial topic in great detail today. I replaced the cracked seal on my 2019 Civic last Tuesday, and the leak stopped completely."
    );
    const second = sentences[1];
    expect(second.level).toBe("human");
    expect(second.score).toBeLessThan(40);
  });

  it("keeps punctuation on sentence text and preserves order", () => {
    const sentences = analyzeSentences("First one here! Is this second? Yes, third one.");
    expect(sentences).toHaveLength(3);
    expect(sentences[0].text).toContain("!");
    expect(sentences[1].text).toContain("?");
    expect(sentences[2].index).toBe(2);
  });

  it("gives every sentence a score, level, reasons, and improvement note", () => {
    const sentences = analyzeSentences("The cat sat. Dogs barked loudly at midnight near the old fence.");
    for (const s of sentences) {
      expect(s.score).toBeGreaterThanOrEqual(0);
      expect(s.score).toBeLessThanOrEqual(100);
      expect(["high", "mixed", "human"]).toContain(s.level);
      expect(s.reasons.length).toBeGreaterThan(0);
      expect(s.improvement.length).toBeGreaterThan(0);
    }
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
