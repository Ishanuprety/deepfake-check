export default function AboutPage() {
  return (
    <div className="space-y-6">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-white">Methodology and Limitations</h1>
        <p className="max-w-3xl text-slate-300">
          Deepfake Check uses explainable heuristics and lightweight forensic checks.
          It is intentionally conservative and designed as a pluggable pipeline so stronger
          ML detectors can be integrated over time.
        </p>
      </section>

      <section className="card space-y-2 p-6 text-sm text-slate-300">
        <h2 className="text-lg font-semibold text-white">Pipeline stages</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>File ingestion and validation</li>
          <li>Metadata extraction</li>
          <li>PDF page rendering and inline image extraction where possible</li>
          <li>Image normalization</li>
          <li>Artifact detection and editing signal checks</li>
          <li>Heuristic scoring and classification</li>
          <li>Result aggregation and report generation</li>
        </ol>
      </section>

      <section className="card space-y-2 p-6 text-sm text-slate-300">
        <h2 className="text-lg font-semibold text-white">Why results can be inconclusive</h2>
        <ul className="list-disc space-y-1 pl-5">
          <li>Low-resolution or heavily compressed inputs</li>
          <li>Screenshots or transformed re-uploads</li>
          <li>Missing metadata and limited context</li>
          <li>No single heuristic is definitive proof of authenticity</li>
        </ul>
      </section>

      <section className="card p-6 text-sm text-slate-300">
        <h2 className="mb-2 text-lg font-semibold text-white">Caution</h2>
        <p>
          This assessment is heuristic and should not be treated as definitive forensic proof.
          For legal, safety, or policy-critical decisions, use specialized forensic tools and
          provenance evidence.
        </p>
      </section>
    </div>
  );
}
