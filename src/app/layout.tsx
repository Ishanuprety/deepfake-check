import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deepfake Check",
  description:
    "Upload images or PDFs and get a conservative, explainable heuristic assessment."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/10 bg-slate-950/90">
          <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
            <Link href="/" className="text-lg font-semibold tracking-tight text-white">
              Deepfake Check
            </Link>
            <div className="flex items-center gap-5 text-sm text-slate-200">
              <Link href="/">Home</Link>
              <Link href="/history">History</Link>
              <Link href="/about">Methodology</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto w-full max-w-6xl px-6 py-10">{children}</main>
      </body>
    </html>
  );
}
