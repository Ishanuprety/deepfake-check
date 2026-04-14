import { NextResponse } from "next/server";
import { getSubmissionRecord } from "@/lib/server/storage";

interface Params {
  params: Promise<{ id: string }>;
}

export async function GET(_request: Request, { params }: Params) {
  const { id } = await params;
  const record = getSubmissionRecord(id);

  if (!record || !record.report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  return new NextResponse(JSON.stringify(record.report, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="deepfake-check-${id}.json"`
    }
  });
}
