export const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;
export const MAX_FILES_PER_SUBMISSION = 10;

export const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/bmp",
  "image/tiff",
  "image/heic",
  "image/heif",
  "image/gif",
  "application/pdf"
]);

export const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".webp",
  ".bmp",
  ".tiff",
  ".tif",
  ".heic",
  ".gif",
  ".pdf"
]);
