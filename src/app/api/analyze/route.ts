import { NextRequest, NextResponse } from "next/server";
import { analyzeSubmission } from "@/lib/server/pipeline";
import { logger } from "@/lib/server/logger";
import {
  cleanupTempPath,
  createSubmissionRecord,
  updateSubmissionRecord,
  writeTempFile
} from "@/lib/server/storage";
import { checkRateLimit } from "@/lib/server/rate-limit";
import { sanitizeFileName, validateSubmission } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for") ?? "anonymous";
  const rateLimit = checkRateLimit(ip);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimit.retryAfterSec ?? 60)
        }
      }
    );
  }

  const formData = await request.formData();
  const files = formData
    .getAll("files")
    .filter((value): value is File => value instanceof File);

  const validationErrors = validateSubmission(files);
  if (validationErrors.length > 0) {
    return NextResponse.json(
      { error: "Validation failed", details: validationErrors },
      { status: 400 }
    );
  }

  const submission = createSubmissionRecord();
  const tempPaths: string[] = [];

  try {
    const prepared = [];
    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const safeName = sanitizeFileName(file.name);
      const tempPath = await writeTempFile(safeName, buffer);
      tempPaths.push(tempPath);
      prepared.push({ fileName: safeName, mimeType: file.type, buffer });
    }

    const report = await analyzeSubmission(prepared);
    updateSubmissionRecord(submission.id, {
      status: "completed",
      report
    });

    return NextResponse.json({
      submissionId: submission.id,
      status: "completed"
    });
  } catch (error) {
    logger.error("Submission analysis failed", error);
    updateSubmissionRecord(submission.id, {
      status: "failed",
      error: "Analysis failed due to processing error."
    });
    return NextResponse.json(
      { error: "Analysis failed. Please try another file." },
      { status: 500 }
    );
  } finally {
    await Promise.all(tempPaths.map((p) => cleanupTempPath(p)));
  }
}
