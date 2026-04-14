export interface CandidateImage {
  sourceType: "image" | "pdf-page" | "pdf-inline-image";
  fileName: string;
  fileType: string;
  pageNumber?: number;
  imageIndex?: number;
  buffer: Buffer;
}

export interface Signal {
  id: string;
  reason: string;
  artifact?: string;
  weightGenerated?: number;
  weightEdited?: number;
  weightReal?: number;
  uncertaintyPenalty?: number;
  limitation?: string;
}
