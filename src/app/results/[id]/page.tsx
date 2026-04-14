import { ResultsView } from "@/components/results-view";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-white">Analysis Results</h1>
        <p className="text-sm text-slate-300">Submission ID: {id}</p>
      </section>
      <ResultsView submissionId={id} />
    </div>
  );
}
