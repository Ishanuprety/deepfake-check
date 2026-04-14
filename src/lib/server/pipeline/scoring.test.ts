import { describe, expect, it } from "vitest";
import { scoreSignals, summarizeSubmissionClassifications } from "@/lib/server/pipeline/scoring";

describe("scoreSignals", () => {
  it("classifies likely AI-generated for strong generated signals", () => {
    const result = scoreSignals([
      { id: "a", reason: "A", weightGenerated: 40 },
      { id: "b", reason: "B", weightGenerated: 25 },
      { id: "c", reason: "C", uncertaintyPenalty: 5 }
    ]);

    expect(result.classification).toBe("likely AI-generated");
    expect(result.confidence).toBeGreaterThan(50);
  });

  it("returns inconclusive when uncertainty is high", () => {
    const result = scoreSignals([
      { id: "a", reason: "A", weightGenerated: 10 },
      { id: "b", reason: "B", uncertaintyPenalty: 40, limitation: "Low quality" }
    ]);

    expect(result.classification).toBe("inconclusive");
  });
});

describe("summarizeSubmissionClassifications", () => {
  it("returns mixed when classes differ", () => {
    const summary = summarizeSubmissionClassifications([
      { classification: "likely AI-generated", confidence: 70 },
      { classification: "likely real", confidence: 55 }
    ]);

    expect(summary.overall_assessment).toBe("mixed");
    expect(summary.overall_confidence).toBe(63);
  });
});
