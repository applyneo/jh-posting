"use client";

import React from "react";
import { Job } from "@/types/job";
import { X, Trash2, ExternalLink, Bookmark, MapPin, ArrowUpRight } from "lucide-react";

interface SavedJobsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  savedJobs: Job[];
  onRemove: (slug: string) => void;
  onClearAll: () => void;
  onSelect: (job: Job) => void;
}

export const SavedJobsDrawer: React.FC<SavedJobsDrawerProps> = ({
  isOpen,
  onClose,
  savedJobs,
  onRemove,
  onClearAll,
  onSelect,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-amber-400 fill-amber-400" />
            <h3 className="font-semibold text-white">Saved Jobs ({savedJobs.length})</h3>
          </div>
          <div className="flex items-center gap-2">
            {savedJobs.length > 0 && (
              <button
                onClick={onClearAll}
                className="text-xs text-rose-400 hover:text-rose-300 transition"
              >
                Clear all
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {savedJobs.length === 0 ? (
            <div className="flex h-64 flex-col items-center justify-center text-center">
              <Bookmark className="h-10 w-10 text-slate-600 mb-2" />
              <p className="text-sm font-medium text-slate-300">No saved jobs yet</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Click the bookmark icon on any job card to save it for later review and application.
              </p>
            </div>
          ) : (
            savedJobs.map((job) => (
              <div
                key={job.public_slug}
                className="group relative rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-700 hover:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 cursor-pointer" onClick={() => onSelect(job)}>
                    <h4 className="text-sm font-semibold text-white group-hover:text-indigo-400 transition">
                      {job.title}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">{job.company}</p>
                    <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-1">
                      <MapPin className="h-3 w-3" />
                      <span>{job.location || "Remote / Unspecified"}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemove(job.public_slug)}
                    className="text-slate-500 hover:text-rose-400 transition p-1"
                    title="Remove from saved"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                  <button
                    onClick={() => onSelect(job)}
                    className="text-xs text-slate-400 hover:text-white transition"
                  >
                    View details
                  </button>

                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition"
                  >
                    <span>Apply</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
