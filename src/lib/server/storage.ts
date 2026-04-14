import { mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";
import type { SubmissionRecord } from "@/types/report";
import { sanitizeFileName } from "@/lib/validation";

const submissions = new Map<string, SubmissionRecord>();
const tempRoot = path.join(os.tmpdir(), "deepfake-check");

export function createSubmissionRecord(): SubmissionRecord {
  const id = crypto.randomUUID();
  const record: SubmissionRecord = {
    id,
    status: "processing",
    createdAt: Date.now()
  };
  submissions.set(id, record);
  return record;
}

export function getSubmissionRecord(id: string): SubmissionRecord | undefined {
  return submissions.get(id);
}

export function updateSubmissionRecord(
  id: string,
  update: Partial<SubmissionRecord>
): SubmissionRecord | undefined {
  const current = submissions.get(id);
  if (!current) return undefined;
  const merged = { ...current, ...update };
  submissions.set(id, merged);
  return merged;
}

export async function writeTempFile(name: string, buffer: Buffer): Promise<string> {
  await mkdir(tempRoot, { recursive: true });
  const filePath = path.join(tempRoot, `${Date.now()}-${sanitizeFileName(name)}`);
  await writeFile(filePath, buffer);
  return filePath;
}

export async function cleanupTempPath(filePath: string): Promise<void> {
  await rm(filePath, { force: true });
}
