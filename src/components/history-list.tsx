"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export function HistoryList() {
  const [ids, setIds] = useState<string[]>([]);

  useEffect(() => {
    const value = localStorage.getItem("deepfake-check-history");
    if (!value) return;
    try {
      setIds(JSON.parse(value));
    } catch {
      setIds([]);
    }
  }, []);

  if (ids.length === 0) {
    return (
      <section className="card p-6">
        <p className="text-sm text-slate-300">No local session history yet.</p>
      </section>
    );
  }

  return (
    <section className="card p-6">
      <h2 className="mb-4 text-xl font-semibold text-white">Recent Local Analyses</h2>
      <ul className="space-y-2 text-sm">
        {ids.map((id) => (
          <li key={id} className="flex items-center justify-between rounded border border-slate-700/70 p-3">
            <span className="truncate text-slate-200">{id}</span>
            <Link href={`/results/${id}`} className="rounded bg-cyan-500 px-2.5 py-1 text-slate-950">
              Open
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
