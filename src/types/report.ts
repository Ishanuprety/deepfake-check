export type DetectionClass =
  | "likely real"
  | "likely AI-generated"
  | "likely AI-edited"
  | "inconclusive";

export interface ImageResult {
  page_number?: number;
  image_index?: number;
  classification: DetectionClass;
  confidence: number;
  reasons: string[];
  artifacts_detected: string[];
  metadata_findings: string[];
  limitations: string[];
  follow_up_checks: string[];
}

export interface FileReport {
  file_name: string;
  file_type: string;
  results: ImageResult[];
}

export interface SubmissionSummary {
  overall_assessment:
    | DetectionClass
    | "mixed";
  overall_confidence: number;
  notes: string[];
}

export interface SubmissionReport {
  summary: SubmissionSummary;
  files: FileReport[];
}

export type SubmissionStatus = "processing" | "completed" | "failed";

export interface SubmissionRecord {
  id: string;
  status: SubmissionStatus;
  createdAt: number;
  report?: SubmissionReport;
  error?: string;
}
