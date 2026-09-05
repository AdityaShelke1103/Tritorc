"use client";

import { ChangeEvent, DragEvent, useState } from "react";

interface ScanResult {
  id: string;
  documentName: string;
  matchedKeywords: string[];
  matchCount: number;
  score: number;
  relevance: "Related" | "Possibly Related" | "Not Related";
}

interface ScanResponse {
  success: boolean;
  message: string;
  count: number;
  results: ScanResult[];
}

const API_URL = "https://tritorc-tau.vercel.app/api/scan";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<ScanResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFiles = (selectedFiles: FileList | null) => {
    if (!selectedFiles) return;

    const validFiles = Array.from(selectedFiles).filter((file) => {
      const name = file.name.toLowerCase();
      return name.endsWith(".pdf") || name.endsWith(".docx");
    });

    setFiles((previous) => {
      const combined = [...previous, ...validFiles];

      const uniqueFiles = combined.filter(
        (file, index, self) =>
          index ===
          self.findIndex(
            (other) =>
              other.name === file.name &&
              other.size === file.size
          )
      );

      return uniqueFiles.slice(0, 10);
    });

    setError("");
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    handleFiles(event.target.files);
  };

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    handleFiles(event.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setFiles((previous) =>
      previous.filter((_, fileIndex) => fileIndex !== index)
    );
  };

  const scanDocuments = async () => {
    if (files.length === 0) {
      setError("Please select at least one PDF or DOCX file.");
      return;
    }

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const formData = new FormData();

      files.forEach((file) => {
        formData.append("documents", file);
      });

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      const data: ScanResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to scan documents.");
      }

      setResults(data.results);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while scanning."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadExcel = async () => {
    try {
      const response = await fetch(`${API_URL}/excel`);

      if (!response.ok) {
        throw new Error("No scan results available.");
      }

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = "tritorc-relevance-report.xlsx";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to download Excel report."
      );
    }
  };

  const getRelevanceClass = (relevance: ScanResult["relevance"]) => {
    if (relevance === "Related") {
      return "bg-green-100 text-green-700 border-green-200";
    }

    if (relevance === "Possibly Related") {
      return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }

    return "bg-gray-100 text-gray-600 border-gray-200";
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

        {/* Header */}
        <section className="mb-10 text-center">
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-600">
            Tritorc
          </p>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Relevance Checker
          </h1>

          <p className="mx-auto mt-4 max-w-2xl text-slate-600">
            Upload tender documents and identify their relevance to
            Tritorc&apos;s bolting and maintenance services.
          </p>
        </section>

        {/* Upload Card */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

          <label
            htmlFor="file-upload"
            onDragOver={(event) => event.preventDefault()}
            onDrop={handleDrop}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center transition hover:border-blue-400 hover:bg-blue-50/40"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-100 text-2xl">
              📄
            </div>

            <h2 className="text-lg font-semibold">
              Upload tender documents
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Drag & drop your files here or click to browse
            </p>

            <p className="mt-2 text-xs text-slate-400">
              PDF and DOCX • Maximum 10 files
            </p>

            <input
              id="file-upload"
              type="file"
              multiple
              accept=".pdf,.docx"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="mt-6">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold">
                  Selected Files
                </h3>

                <span className="text-sm text-slate-500">
                  {files.length}/10
                </span>
              </div>

              <div className="space-y-2">
                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}`}
                    className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="text-xl">
                        {file.name.toLowerCase().endsWith(".pdf")
                          ? "📕"
                          : "📘"}
                      </span>

                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">
                          {file.name}
                        </p>

                        <p className="text-xs text-slate-400">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => removeFile(index)}
                      className="ml-4 rounded-md px-3 py-1 text-sm text-slate-500 hover:bg-red-50 hover:text-red-600"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {/* Scan Button */}
          <button
            onClick={scanDocuments}
            disabled={loading || files.length === 0}
            className="mt-6 w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          >
            {loading ? "Scanning Documents..." : "Scan Documents"}
          </button>
        </section>

        {/* Results */}
        {results.length > 0 && (
          <section className="mt-10">

            <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold">
                  Scan Results
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {results.length} document
                  {results.length !== 1 ? "s" : ""} scanned
                  successfully.
                </p>
              </div>

              <button
                onClick={downloadExcel}
                className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Download Excel
              </button>
            </div>

            {/* Desktop Table */}
            <div className="hidden overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-slate-200 bg-slate-50">
                    <tr>
                      <th className="px-5 py-4 font-semibold">
                        Document
                      </th>

                      <th className="px-5 py-4 font-semibold">
                        Matched Keywords
                      </th>

                      <th className="px-5 py-4 text-center font-semibold">
                        Matches
                      </th>

                      <th className="px-5 py-4 text-center font-semibold">
                        Score
                      </th>

                      <th className="px-5 py-4 text-center font-semibold">
                        Relevance
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {results.map((result) => (
                      <tr
                        key={result.id}
                        className="hover:bg-slate-50"
                      >
                        <td className="max-w-xs px-5 py-4 font-medium">
                          <span className="block truncate">
                            {result.documentName}
                          </span>
                        </td>

                        <td className="px-5 py-4">
                          {result.matchedKeywords.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {result.matchedKeywords.map(
                                (keyword) => (
                                  <span
                                    key={keyword}
                                    className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                                  >
                                    {keyword}
                                  </span>
                                )
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400">
                              No matches
                            </span>
                          )}
                        </td>

                        <td className="px-5 py-4 text-center font-semibold">
                          {result.matchCount}
                        </td>

                        <td className="px-5 py-4 text-center font-semibold">
                          {result.score}
                        </td>

                        <td className="px-5 py-4 text-center">
                          <span
                            className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getRelevanceClass(
                              result.relevance
                            )}`}
                          >
                            {result.relevance}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 md:hidden">
              {results.map((result) => (
                <div
                  key={result.id}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="break-all font-semibold">
                      {result.documentName}
                    </h3>

                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getRelevanceClass(
                        result.relevance
                      )}`}
                    >
                      {result.relevance}
                    </span>
                  </div>

                  <div className="mt-4">
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                      Matched Keywords
                    </p>

                    {result.matchedKeywords.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {result.matchedKeywords.map(
                          (keyword) => (
                            <span
                              key={keyword}
                              className="rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                            >
                              {keyword}
                            </span>
                          )
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400">
                        No keywords matched
                      </p>
                    )}
                  </div>

                  <div className="mt-5 grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Match Count
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {result.matchCount}
                      </p>
                    </div>

                    <div className="rounded-lg bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">
                        Score
                      </p>
                      <p className="mt-1 text-lg font-bold">
                        {result.score}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Empty State */}
        {!loading && results.length === 0 && (
          <div className="mt-8 text-center text-sm text-slate-400">
            Upload documents above to see scan results.
          </div>
        )}

        {/* Footer */}
        <footer className="mt-16 border-t border-slate-200 pt-6 text-center text-xs text-slate-400">
          Tritorc Relevance Checker • Tender Keyword Analysis
        </footer>
      </div>
    </main>
  );
}
