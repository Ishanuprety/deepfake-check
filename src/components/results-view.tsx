"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { SubmissionRecord } from "@/types/report";

function confidenceColor(confidence: number): string {
  if (confidence >= 75) return "bg-emerald-500";
  if (confidence >= 45) return "bg-amber-400";
  return "bg-rose-400";
}

function badgeStyle(label: string): string {
  switch (label) {
    case "likely AI-generated":
      return "bg-rose-900/50 text-rose-200 border-rose-400/30";
    case "likely AI-edited":
      return "bg-amber-900/40 text-amber-100 border-amber-400/30";
    case "likely real":
      return "bg-emerald-900/40 text-emerald-200 border-emerald-400/30";
    default:
      return "bg-slate-800 text-slate-200 border-slate-500/40";
  }
}

export function ResultsView({ submissionId }: { submissionId: string }) {
  const [record, setRecord] = useState<SubmissionRecord | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const response = await fetch(`/api/results/${submissionId}`, { cache: "no-store" });
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error ?? "Unable to load result.");
        }
        const data = (await response.json()) as SubmissionRecord;
        if (!cancelled) {
          setRecord(data);
          if (data.status === "processing") {
            setTimeout(poll, 1200);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load result.");
        }
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [submissionId]);

  const summary = record?.report?.summary;
  if (error) {
    return <p className="text-rose-300">{error}</p>;
  }

  if (!record || record.status === "processing") {
    return (
      <div className="card space-y-3 p-6">
        <p className="text-lg font-semibold text-white">Analyzing your submission...</p>
        <p className="text-sm text-slate-300">
          Running metadata checks, PDF extraction, artifact detection, and scoring.
        </p>
      </div>
    );
  }

  if (record.status === "failed") {
    return (
      <div className="card p-6">
        <p className="text-rose-300">{record.error ?? "Analysis failed."}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="card space-y-4 p-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className={`rounded-full border px-3 py-1 text-sm ${badgeStyle(summary?.overall_assessment ?? "inconclusive")}`}>
            {summary?.overall_assessment ?? "inconclusive"}
          </span>
          <span className="text-sm text-slate-300">
            Overall confidence: {summary?.overall_confidence ?? 0}/100
          </span>
        </div>
        <div>
          <p className="mb-2 text-sm font-medium text-slate-200">Submission confidence</p>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className={`h-full ${confidenceColor(summary?.overall_confidence ?? 0)}`}
              style={{ width: `${summary?.overall_confidence ?? 0}%` }}
            />
          </div>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
          {summary?.notes.map((note) => <li key={note}>{note}</li>)}
        </ul>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <Link className="rounded-md bg-cyan-500 px-3 py-1.5 font-medium text-slate-950" href={`/api/report/${submissionId}`}>
            Download JSON Report
          </Link>
          <Link className="rounded-md border border-slate-600 px-3 py-1.5 text-slate-200" href="/about">
            Read methodology and limitations
          </Link>
        </div>
      </section>

      {record.report?.files.map((file) => (
        <section key={file.file_name} className="card space-y-4 p-6">
          <h2 className="text-xl font-semibold text-white">{file.file_name}</h2>
          <p className="text-sm text-slate-300">{file.file_type}</p>
          <div className="space-y-4">
            {file.results.map((result, index) => (
              <details key={`${result.page_number ?? 0}-${result.image_index ?? index}`} className="rounded-lg border border-slate-700/70 bg-slate-900/40 p-4">
                <summary className="flex cursor-pointer flex-wrap items-center gap-3">
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${badgeStyle(result.classification)}`}>
                    {result.classification}
                  </span>
                  <span className="text-sm text-slate-300">
                    {result.page_number ? `Page ${result.page_number}` : "Image"}
                    {result.image_index ? ` • Image ${result.image_index}` : ""}
                  </span>
                  <span className="text-sm text-slate-200">Confidence: {result.confidence}/100</span>
                </summary>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-100">Reasons</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                      {result.reasons.map((reason) => <li key={reason}>{reason}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-100">Artifacts detected</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                      {result.artifacts_detected.length === 0 && <li>No strong artifact markers detected.</li>}
                      {result.artifacts_detected.map((artifact) => <li key={artifact}>{artifact}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-100">Metadata findings</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                      {result.metadata_findings.length === 0 && <li>No metadata findings available.</li>}
                      {result.metadata_findings.map((finding) => <li key={finding}>{finding}</li>)}
                    </ul>
                  </div>
                  <div>
                    <p className="mb-1 text-sm font-medium text-slate-100">Limitations and caution</p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                      {result.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
                    </ul>
                  </div>
                </div>
              </details>
            ))}
          </div>
        </section>
      ))}

      <section className="card p-6">
        <h3 className="mb-2 text-lg font-semibold text-white">Important caution</h3>
        <p className="text-sm text-slate-300">
          This assessment is heuristic and should not be treated as definitive forensic proof.
          For high-stakes decisions, use specialist forensic models and provenance verification.
        </p>
      </section>
    </div>
  );
}
