function parseNumber(name: string, fallback: number): number {
  const value = process.env[name];
  if (!value) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const appConfig = {
  rateLimitPerMinute: parseNumber("RATE_LIMIT_PER_MINUTE", 20),
  generatedMargin: parseNumber("SCORING_GENERATED_MARGIN", 10),
  editedMargin: parseNumber("SCORING_EDITED_MARGIN", 6),
  minConfidenceThreshold: parseNumber("SCORING_MIN_CONFIDENCE", 35)
};
