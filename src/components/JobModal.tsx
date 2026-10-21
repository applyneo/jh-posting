"use client";

import React, { useEffect } from "react";
import { Job } from "@/types/job";
import ReactMarkdown from "react-markdown";
import {
  X,
  MapPin,
  Building2,
  Calendar,
  ExternalLink,
  Bookmark,
  Sparkles,
  ShieldCheck,
  Share2,
} from "lucide-react";

interface JobModalProps {
  job: Job | null;
  onClose: () => void;
  isSaved: boolean;
  onToggleSave: (job: Job) => void;
}

export const JobModal: React.FC<JobModalProps> = ({
  job,
  onClose,
  isSaved,
  onToggleSave,
}) => {
  // Close on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (job) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "unset";
    };
  }, [job, onClose]);

  if (!job) return null;

  const isRemote =
    job.location?.toLowerCase().includes("remote") ||
    job.description?.toLowerCase().includes("work_mode=remote");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-800 bg-slate-950/60 p-5 sm:p-6">
          <div className="pr-4">
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
              <span className="text-indigo-400 font-semibold">{job.company || "Company"}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {job.location || "Remote / Unspecified"}
              </span>
              {job.source && (
                <>
                  <span>•</span>
                  <span className="text-slate-500">via {job.source}</span>
                </>
              )}
            </div>

            <h2 className="mt-1 text-xl sm:text-2xl font-bold text-white">
              {job.title}
            </h2>

            {/* Badges */}
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {isRemote && (
                <span className="rounded-md bg-blue-500/10 px-2.5 py-1 text-xs font-medium text-blue-400 border border-blue-500/20">
                  Remote
                </span>
              )}
              {job.enrichment?.seniority && (
                <span className="rounded-md bg-purple-500/10 px-2.5 py-1 text-xs font-medium text-purple-400 border border-purple-500/20 capitalize">
                  {job.enrichment.seniority}
                </span>
              )}
              {job.enrichment?.employment_type && (
                <span className="rounded-md bg-slate-800 px-2.5 py-1 text-xs font-medium text-slate-300">
                  {job.enrichment.employment_type.replace("_", " ")}
                </span>
              )}
              {job.reality?.class === "fresh" && (
                <span className="rounded-md bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                  Fresh Posting
                </span>
              )}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="overflow-y-auto p-5 sm:p-6 text-sm text-slate-300 space-y-6">
          {/* Skills bar */}
          {job.skills && job.skills.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Skills & Tech Stack
              </h4>
              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {job.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-md bg-indigo-500/10 px-2.5 py-1 text-xs font-medium text-indigo-300 border border-indigo-500/20"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Job summary if enrichment has it */}
          {job.enrichment?.summary && (
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4">
              <h4 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-indigo-400">
                <Sparkles className="h-3.5 w-3.5" />
                AI Summary
              </h4>
              <p className="mt-1.5 text-slate-300 leading-relaxed">
                {job.enrichment.summary}
              </p>
            </div>
          )}

          {/* Markdown Description */}
          <div className="prose prose-invert prose-indigo max-w-none text-slate-300 leading-relaxed space-y-4">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h3 className="text-lg font-bold text-white mt-4 mb-2">{children}</h3>,
                h2: ({ children }) => <h4 className="text-base font-semibold text-white mt-3 mb-1.5">{children}</h4>,
                h3: ({ children }) => <h5 className="text-sm font-semibold text-slate-200 mt-2 mb-1">{children}</h5>,
                ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2 text-slate-300">{children}</ul>,
                ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2 text-slate-300">{children}</ol>,
                li: ({ children }) => <li className="text-slate-300">{children}</li>,
                p: ({ children }) => <p className="mb-3 text-slate-300 leading-relaxed">{children}</p>,
                strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
              }}
            >
              {job.description || "No full description available."}
            </ReactMarkdown>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/80 px-6 py-4">
          <button
            onClick={() => onToggleSave(job)}
            className={`flex items-center gap-2 rounded-lg border px-4 py-2 text-xs font-medium transition ${
              isSaved
                ? "border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
            }`}
          >
            <Bookmark className={`h-4 w-4 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`} />
            <span>{isSaved ? "Saved" : "Save Job"}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: job.title,
                    text: `Check out this ${job.title} job at ${job.company}`,
                    url: job.url,
                  });
                } else {
                  navigator.clipboard.writeText(job.url);
                  alert("Job link copied to clipboard!");
                }
              }}
              className="rounded-lg border border-slate-800 p-2 text-slate-400 transition hover:bg-slate-800 hover:text-white"
              title="Share job link"
            >
              <Share2 className="h-4 w-4" />
            </button>

            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition hover:bg-indigo-500 active:scale-95"
            >
              <span>Apply on Company Site</span>
              <ExternalLink className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
