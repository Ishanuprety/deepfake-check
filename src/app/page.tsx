import { UploadForm } from "@/components/upload-form";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <section className="space-y-4">
        <span className="inline-flex rounded-full border border-cyan-400/40 bg-cyan-950/50 px-3 py-1 text-xs text-cyan-200">
          Heuristic AI image authenticity analysis
        </span>
        <h1 className="text-4xl font-bold tracking-tight text-white">Deepfake Check</h1>
        <p className="max-w-3xl text-slate-300">
          Upload one or more images or PDFs to run a conservative detection pipeline across
          metadata, rendering artifacts, and editing/compositing indicators.
          The result is an explainable estimate: likely real, likely AI-generated,
          likely AI-edited, or inconclusive.
        </p>
      </section>

      <UploadForm />

      <section className="card space-y-3 p-6 text-sm text-slate-300">
        <h2 className="text-lg font-semibold text-white">Important Disclaimer</h2>
        <p>
          This assessment is heuristic and should not be treated as definitive forensic proof.
          Weak signals, low-quality uploads, and transformed content can produce inconclusive or
          uncertain outputs.
        </p>
      </section>
    </div>
  );
}
