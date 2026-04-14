import path from "node:path";
import {
  ALLOWED_EXTENSIONS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  MAX_FILES_PER_SUBMISSION
} from "@/lib/constants";

export function sanitizeFileName(input: string): string {
  return input.replace(/[^\w.\-() ]/g, "_");
}

export function isPdfMime(mimeType: string): boolean {
  return mimeType === "application/pdf";
}

export function isAllowedFile(fileName: string, mimeType: string): boolean {
  const extension = path.extname(fileName).toLowerCase();
  return ALLOWED_MIME_TYPES.has(mimeType) || ALLOWED_EXTENSIONS.has(extension);
}

export function validateSubmission(files: File[]): string[] {
  const errors: string[] = [];

  if (files.length === 0) {
    errors.push("No files provided.");
  }

  if (files.length > MAX_FILES_PER_SUBMISSION) {
    errors.push(`Maximum ${MAX_FILES_PER_SUBMISSION} files per submission.`);
  }

  for (const file of files) {
    if (!isAllowedFile(file.name, file.type)) {
      errors.push(`Unsupported file type: ${file.name}`);
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      errors.push(`File too large: ${file.name} (max 20MB).`);
    }
  }

  return errors;
}
