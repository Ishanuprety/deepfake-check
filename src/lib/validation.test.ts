import { describe, expect, it } from "vitest";
import { isAllowedFile, sanitizeFileName } from "@/lib/validation";

describe("sanitizeFileName", () => {
  it("removes unsafe symbols", () => {
    expect(sanitizeFileName("../../bad:file?.png")).toBe(".._.._bad_file_.png");
  });
});

describe("isAllowedFile", () => {
  it("accepts known image extension", () => {
    expect(isAllowedFile("photo.webp", "application/octet-stream")).toBe(true);
  });

  it("rejects unsupported extension and mime", () => {
    expect(isAllowedFile("archive.zip", "application/zip")).toBe(false);
  });
});
