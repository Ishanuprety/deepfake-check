import { HistoryList } from "@/components/history-list";

export default function HistoryPage() {
  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-3xl font-bold text-white">History</h1>
        <p className="text-slate-300">
          Recent analyses are stored in your browser local session history.
        </p>
      </section>
      <HistoryList />
    </div>
  );
}
