import { NextResponse } from "next/server";
import { getSubmissionRecord } from "@/lib/server/storage";

export const runtime = "nodejs";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const record = getSubmissionRecord(id);

  if (!record) {
    return NextResponse.json({ error: "Submission not found." }, { status: 404 });
  }

  return NextResponse.json(record, { status: 200 });
}
