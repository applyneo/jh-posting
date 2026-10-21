"use client";

import React, { useState, useEffect } from "react";
import {
  FileSpreadsheet,
  Download,
  RefreshCw,
  Search,
  X,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Sparkles,
  Layers,
  Calendar,
  Clock,
  Building2,
  MapPin,
} from "lucide-react";
import { SheetJobRow, SheetSummaryStats } from "@/lib/sheet_backend";

interface BackendSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BackendSheetModal: React.FC<BackendSheetModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [rows, setRows] = useState<SheetJobRow[]>([]);
  const [stats, setStats] = useState<SheetSummaryStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const loadSheetData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/telegram/sheet", { cache: "no-store" });
      const data = await res.json();
      if (data.ok) {
        setRows(data.rows || []);
        setStats(data.stats || null);
      }
    } catch (err) {
      console.error("Failed to fetch sheet data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadSheetData();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter rows
  const filteredRows = rows.filter((r) => {
    const matchesCategory =
      categoryFilter === "all" || r.category === categoryFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      r.title?.toLowerCase().includes(q) ||
      r.company?.toLowerCase().includes(q) ||
      r.location?.toLowerCase().includes(q) ||
      r.salary?.toLowerCase().includes(q);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden z-10 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 px-6 py-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-inner">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">
                  JobHunger Backend Sheet & Ledger
                </h3>
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[11px] font-semibold text-emerald-400">
                  Direct Backend Database
                </span>
              </div>
              <p className="text-xs text-slate-400">
                All broadcasted jobs saved directly in backend • Auto-deduplicated
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/api/telegram/download-excel"
              download="JobHunger_Telegram_Posting_Ledger.xlsx"
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-semibold text-white shadow-md transition"
              title="Download Excel Workbook (.xlsx)"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Excel (.xlsx)</span>
            </a>

            <button
              onClick={loadSheetData}
              disabled={isLoading}
              className="flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition disabled:opacity-50"
              title="Refresh sheet data"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
            </button>

            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Stats Strip */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 px-6 py-3 border-b border-slate-800 bg-slate-950/30 text-xs">
            <div className="flex items-center gap-2 rounded-lg bg-slate-800/40 p-2">
              <span className="text-slate-400">Total Logged:</span>
              <strong className="text-white font-bold">{stats.totalJobs} jobs</strong>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-indigo-950/30 border border-indigo-900/30 p-2 text-indigo-300">
              <span>💻 Tech:</span>
              <strong className="font-bold">{stats.techCount}</strong>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-amber-950/30 border border-amber-900/30 p-2 text-amber-300">
              <span>💼 Non-Tech:</span>
              <strong className="font-bold">{stats.nonTechCount}</strong>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-emerald-950/30 border border-emerald-900/30 p-2 text-emerald-300">
              <span>🩺 Healthcare:</span>
              <strong className="font-bold">{stats.healthcareCount}</strong>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 px-6 py-3 border-b border-slate-800 bg-slate-900">
          {/* Search box */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by job title, company, location, salary..."
              className="w-full rounded-xl border border-slate-700 bg-slate-950/70 py-1.5 pl-9 pr-3 text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
            {[
              { id: "all", label: `All (${rows.length})` },
              { id: "tech", label: "💻 Tech" },
              { id: "non_tech", label: "💼 Non-Tech" },
              { id: "healthcare", label: "🩺 Healthcare" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`rounded-lg px-2.5 py-1 font-medium transition ${
                  categoryFilter === tab.id
                    ? "bg-emerald-600 text-white font-semibold"
                    : "border border-slate-800 bg-slate-950 text-slate-400 hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Spreadsheet Table Body */}
        <div className="flex-1 overflow-auto max-h-[60vh] bg-slate-950/40">
          {isLoading && rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-slate-400 space-y-2">
              <RefreshCw className="h-6 w-6 animate-spin text-emerald-500" />
              <p className="text-xs">Loading backend spreadsheet...</p>
            </div>
          ) : filteredRows.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 space-y-2">
              <FileSpreadsheet className="h-8 w-8 text-slate-600" />
              <p className="text-sm font-medium text-slate-400">No rows match your filter</p>
              <p className="text-xs">Post new jobs to see them appear here in real-time.</p>
            </div>
          ) : (
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead className="sticky top-0 bg-slate-900/95 backdrop-blur-sm border-b border-slate-800 text-[11px] font-semibold text-slate-400 uppercase tracking-wider z-10">
                <tr>
                  <th className="py-2.5 px-3 w-10">#</th>
                  <th className="py-2.5 px-3">Date & Time</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Job Title</th>
                  <th className="py-2.5 px-3">Company</th>
                  <th className="py-2.5 px-3">Location & Mode</th>
                  <th className="py-2.5 px-3">Salary</th>
                  <th className="py-2.5 px-3">Delivered</th>
                  <th className="py-2.5 px-3 text-right">Apply Link</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-normal">
                {filteredRows.map((r, idx) => (
                  <tr
                    key={r.id || idx}
                    className="hover:bg-slate-800/50 transition-colors group"
                  >
                    <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="font-medium text-white">{r.postedDate}</div>
                      <div className="text-[10px] text-slate-400">{r.postedTime}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          r.category === "tech"
                            ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/30"
                            : r.category === "healthcare"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                        }`}
                      >
                        {r.category === "tech"
                          ? "💻 Tech"
                          : r.category === "healthcare"
                          ? "🩺 Healthcare"
                          : "💼 Non-Tech"}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-semibold text-white max-w-[200px] truncate">
                      {r.title}
                    </td>
                    <td className="py-3 px-3 text-slate-300 whitespace-nowrap">
                      {r.company}
                    </td>
                    <td className="py-3 px-3 text-[11px] whitespace-nowrap">
                      <div className="text-slate-300">{r.location}</div>
                      <div className="text-slate-500">{r.workMode}</div>
                    </td>
                    <td className="py-3 px-3 font-mono text-emerald-400 text-[11px] whitespace-nowrap">
                      {r.salary}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-800/80 px-2 py-0.5 text-[11px] text-slate-300 border border-slate-700/60">
                        <CheckCircle className="h-3 w-3 text-emerald-400" />
                        <span>{r.deliveredToCount || 2} chats</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <a
                        href={r.applyUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 underline font-medium"
                      >
                        <span>Apply</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 px-6 py-3 bg-slate-950/80 text-xs text-slate-400">
          <span>
            Showing <strong className="text-white">{filteredRows.length}</strong> of{" "}
            <strong className="text-white">{rows.length}</strong> total records
          </span>
          <span className="flex items-center gap-1 text-[11px] text-slate-500">
            Auto-synced with backend storage • Zero duplicate guarantee
          </span>
        </div>
      </div>
    </div>
  );
};
