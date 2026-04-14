import type { ImageResult } from "@/types/report";
import type { Signal } from "@/lib/server/pipeline/types";
import { appConfig } from "@/lib/server/config";

export interface ScoringResult {
  classification: ImageResult["classification"];
  confidence: number;
  reasons: string[];
  artifacts: string[];
  limitations: string[];
  followUpChecks: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreSignals(signals: Signal[]): ScoringResult {
  let generated = 0;
  let edited = 0;
  let real = 0;
  let uncertaintyPenalty = 0;

  const reasons: string[] = [];
  const artifacts: string[] = [];
  const limitations = new Set<string>();

  for (const signal of signals) {
    generated += signal.weightGenerated ?? 0;
    edited += signal.weightEdited ?? 0;
    real += signal.weightReal ?? 0;
    uncertaintyPenalty += signal.uncertaintyPenalty ?? 0;

    reasons.push(signal.reason);
    if (signal.artifact) artifacts.push(signal.artifact);
    if (signal.limitation) limitations.add(signal.limitation);
  }

  const aiPeak = Math.max(generated, edited);
  const confidenceBase = aiPeak + real;
  const confidence = clamp(Math.round(confidenceBase - uncertaintyPenalty), 5, 99);

  let classification: ImageResult["classification"] = "inconclusive";

  if (confidence < appConfig.minConfidenceThreshold) {
    classification = "inconclusive";
  } else if (generated >= edited + appConfig.generatedMargin && generated >= real + 8) {
    classification = "likely AI-generated";
  } else if (edited >= generated && edited >= real + appConfig.editedMargin) {
    classification = "likely AI-edited";
  } else if (real > generated && real > edited && uncertaintyPenalty < 20) {
    classification = "likely real";
  } else {
    classification = "inconclusive";
  }

  const followUpChecks = [
    "Run dedicated forensic models (noise residual, GAN fingerprint, diffusion detector).",
    "Cross-check with source provenance, reverse image search, and original capture context.",
    "Inspect full-resolution original files and capture chain metadata."
  ];

  return {
    classification,
    confidence,
    reasons: Array.from(new Set(reasons)).slice(0, 8),
    artifacts: Array.from(new Set(artifacts)).slice(0, 8),
    limitations: Array.from(limitations).slice(0, 8),
    followUpChecks
  };
}

export function summarizeSubmissionClassifications(
  classifications: Array<{ classification: ImageResult["classification"]; confidence: number }>
): { overall_assessment: "likely real" | "likely AI-generated" | "likely AI-edited" | "mixed" | "inconclusive"; overall_confidence: number } {
  const uniqueClasses = new Set(classifications.map((item) => item.classification));
  const avgConfidence = classifications.length
    ? Math.round(
        classifications.reduce((sum, item) => sum + item.confidence, 0) / classifications.length
      )
    : 0;

  if (uniqueClasses.size === 0) {
    return { overall_assessment: "inconclusive", overall_confidence: 0 };
  }
  if (uniqueClasses.size > 1) {
    return { overall_assessment: "mixed", overall_confidence: avgConfidence };
  }

  const [single] = Array.from(uniqueClasses);
  return { overall_assessment: single, overall_confidence: avgConfidence };
}
