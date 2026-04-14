import type { FileReport, ImageResult, SubmissionReport } from "@/types/report";
import { isPdfMime } from "@/lib/validation";
import { inspectMetadata } from "@/lib/server/pipeline/metadata";
import { normalizeImage } from "@/lib/server/pipeline/image-normalization";
import { detectArtifacts } from "@/lib/server/pipeline/artifact-detection";
import { detectEditingSignals } from "@/lib/server/pipeline/editing-signals";
import { scoreSignals, summarizeSubmissionClassifications } from "@/lib/server/pipeline/scoring";
import { extractPdfCandidates } from "@/lib/server/pipeline/pdf";
import type { CandidateImage } from "@/lib/server/pipeline/types";
import { logger } from "@/lib/server/logger";

interface UploadInputFile {
  fileName: string;
  mimeType: string;
  buffer: Buffer;
}

function groupByFile(results: Array<{ fileName: string; fileType: string; item: ImageResult }>): FileReport[] {
  const map = new Map<string, FileReport>();
  for (const row of results) {
    if (!map.has(row.fileName)) {
      map.set(row.fileName, {
        file_name: row.fileName,
        file_type: row.fileType,
        results: []
      });
    }
    map.get(row.fileName)?.results.push(row.item);
  }
  return Array.from(map.values());
}

async function analyzeCandidate(candidate: CandidateImage): Promise<ImageResult> {
  const metadata = await inspectMetadata(candidate.buffer);
  const normalized = await normalizeImage(candidate.buffer);
  const artifactSignals = await detectArtifacts(normalized);
  const editSignals = await detectEditingSignals(normalized);
  const scoring = scoreSignals([...metadata.signals, ...artifactSignals, ...editSignals]);

  const reasons = [
    ...metadata.findings,
    ...scoring.reasons
  ];

  return {
    page_number: candidate.pageNumber,
    image_index: candidate.imageIndex,
    classification: scoring.classification,
    confidence: scoring.confidence,
    reasons: Array.from(new Set(reasons)).slice(0, 10),
    artifacts_detected: scoring.artifacts,
    metadata_findings: metadata.findings.slice(0, 8),
    limitations: [
      "This assessment is heuristic and should not be treated as definitive forensic proof.",
      ...scoring.limitations
    ].slice(0, 8),
    follow_up_checks: scoring.followUpChecks
  };
}

export async function analyzeSubmission(files: UploadInputFile[]): Promise<SubmissionReport> {
  const flattenedResults: Array<{ fileName: string; fileType: string; item: ImageResult }> = [];

  for (const file of files) {
    const candidates: CandidateImage[] = isPdfMime(file.mimeType)
      ? await extractPdfCandidates(file.fileName, file.buffer)
      : [
          {
            sourceType: "image",
            fileName: file.fileName,
            fileType: file.mimeType,
            imageIndex: 1,
            buffer: file.buffer
          }
        ];

    if (candidates.length === 0) {
      logger.warn("No analyzable images extracted from file", { file: file.fileName });
    }

    for (const candidate of candidates) {
      const item = await analyzeCandidate(candidate);
      flattenedResults.push({
        fileName: candidate.fileName,
        fileType: candidate.fileType,
        item
      });
    }
  }

  const grouped = groupByFile(flattenedResults);
  const summaryStats = summarizeSubmissionClassifications(
    grouped.flatMap((file) =>
      file.results.map((result) => ({
        classification: result.classification,
        confidence: result.confidence
      }))
    )
  );

  return {
    summary: {
      overall_assessment: summaryStats.overall_assessment,
      overall_confidence: summaryStats.overall_confidence,
      notes: [
        "Assessment is heuristic and probabilistic.",
        "Low-quality, transformed, or partial inputs reduce confidence.",
        "Use stronger forensic models and provenance checks for high-stakes decisions."
      ]
    },
    files: grouped
  };
}
