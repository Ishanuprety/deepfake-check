"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatBytes } from "@/lib/format";

const ACCEPTED =
  ".jpg,.jpeg,.png,.webp,.bmp,.tiff,.tif,.heic,.gif,.pdf,image/*,application/pdf";

interface UploadState {
  loading: boolean;
  progress: number;
  error: string | null;
}

export function UploadForm() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [state, setState] = useState<UploadState>({ loading: false, progress: 0, error: null });
  const router = useRouter();

  const totalBytes = useMemo(
    () => selected.reduce((sum, file) => sum + file.size, 0),
    [selected]
  );

  function updateFiles(files: FileList | null) {
    if (!files) return;
    setSelected(Array.from(files));
    setState((prev) => ({ ...prev, error: null }));
  }

  async function upload() {
    if (selected.length === 0) {
      setState((prev) => ({ ...prev, error: "Please select at least one file." }));
      return;
    }

    setState({ loading: true, progress: 0, error: null });
    const formData = new FormData();
    selected.forEach((file) => formData.append("files", file));

    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/analyze");
    xhr.upload.onprogress = (event) => {
      if (!event.lengthComputable) return;
      setState((prev) => ({
        ...prev,
        progress: Math.round((event.loaded / event.total) * 100)
      }));
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        const payload = JSON.parse(xhr.responseText || "{}");
        const details = payload.details?.join(" ") ?? payload.error ?? "Upload failed.";
        setState({ loading: false, progress: 0, error: details });
        return;
      }

      const payload = JSON.parse(xhr.responseText) as { submissionId: string };
      const history = JSON.parse(localStorage.getItem("deepfake-check-history") ?? "[]") as string[];
      localStorage.setItem(
        "deepfake-check-history",
        JSON.stringify([payload.submissionId, ...history.filter((id) => id !== payload.submissionId)].slice(0, 20))
      );
      router.push(`/results/${payload.submissionId}`);
    };

    xhr.onerror = () => {
      setState({ loading: false, progress: 0, error: "Network error during upload." });
    };

    xhr.send(formData);
  }

  return (
    <section className="card space-y-5 p-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-white">Upload Images or PDFs</h2>
        <p className="text-sm text-slate-300">
          Supported formats: JPG, JPEG, PNG, WEBP, BMP, TIFF, HEIC, GIF, PDF.
        </p>
      </div>

      <button
        type="button"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          updateFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        className={`flex w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-cyan-400 bg-cyan-950/40" : "border-slate-500 bg-slate-900/40"
        }`}
      >
        <span className="text-base font-medium text-slate-100">Drag and drop files here</span>
        <span className="text-sm text-slate-400">or click to choose files</span>
      </button>

      <input
        ref={inputRef}
        multiple
        type="file"
        accept={ACCEPTED}
        className="hidden"
        onChange={(e) => updateFiles(e.target.files)}
      />

      {selected.length > 0 && (
        <div className="space-y-2 rounded-lg border border-slate-700/70 bg-slate-900/40 p-3">
          <p className="text-sm text-slate-300">
            {selected.length} file(s), total {formatBytes(totalBytes)}
          </p>
          <ul className="max-h-40 space-y-1 overflow-auto text-sm text-slate-200">
            {selected.map((file) => (
              <li key={`${file.name}-${file.size}`} className="truncate">
                {file.name} ({formatBytes(file.size)})
              </li>
            ))}
          </ul>
        </div>
      )}

      {state.loading && (
        <div className="space-y-2">
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
            <div
              className="h-full rounded-full bg-cyan-400 transition-all"
              style={{ width: `${state.progress}%` }}
            />
          </div>
          <p className="text-sm text-slate-300">Uploading... {state.progress}%</p>
        </div>
      )}

      {state.error && <p className="text-sm text-rose-300">{state.error}</p>}

      <button
        type="button"
        onClick={upload}
        disabled={state.loading || selected.length === 0}
        className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {state.loading ? "Processing..." : "Analyze Files"}
      </button>
    </section>
  );
}
