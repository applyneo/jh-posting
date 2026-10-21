"use client";

import React from "react";
import { Job } from "@/types/job";
import {
  MapPin,
  Building2,
  Bookmark,
  ExternalLink,
  Clock,
  Sparkles,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

interface JobCardProps {
  job: Job;
  isSaved: boolean;
  onToggleSave: (job: Job) => void;
  onSelect: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({
  job,
  isSaved,
  onToggleSave,
  onSelect,
}) => {
  const isRemote =
    job.location?.toLowerCase().includes("remote") ||
    job.description?.toLowerCase().includes("work_mode=remote");

  const seniority = job.enrichment?.seniority;
  const employmentType = job.enrichment?.employment_type;
  const isFresh = job.reality?.class === "fresh" || job.reality?.age_days === 0;

  return (
    <div className="group relative flex flex-col justify-between rounded-xl border border-slate-800/80 bg-slate-900/40 p-5 transition-all duration-200 hover:border-slate-700 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-indigo-500/5">
      {/* Top row: Company & Badges & Bookmark */}
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-800 text-xs font-bold text-slate-300">
              {job.company?.[0]?.toUpperCase() || "J"}
            </span>
            <div>
              <h4 className="text-xs font-semibold text-slate-400 group-hover:text-slate-300 transition-colors">
                {job.company || "Confidential"}
              </h4>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{job.location || "Worldwide"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Freshness Badge */}
            {isFresh && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Fresh
              </span>
            )}

            {/* Bookmark button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleSave(job);
              }}
              title={isSaved ? "Remove from saved" : "Save job"}
              className={`rounded-lg p-1.5 transition-colors ${
                isSaved
                  ? "bg-amber-500/15 text-amber-400 hover:bg-amber-500/25"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}
            >
              <Bookmark
                className={`h-4 w-4 ${isSaved ? "fill-amber-400 text-amber-400" : ""}`}
              />
            </button>
          </div>
        </div>

        {/* Title */}
        <h3
          onClick={() => onSelect(job)}
          className="mt-3 cursor-pointer text-base font-semibold text-slate-100 transition-colors group-hover:text-indigo-400 line-clamp-2"
        >
          {job.title}
        </h3>

        {/* Category & Seniority tags */}
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          {isRemote && (
            <span className="rounded-md bg-blue-500/10 px-2 py-0.5 text-[11px] font-medium text-blue-400 border border-blue-500/20">
              Remote
            </span>
          )}
          {seniority && (
            <span className="rounded-md bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-400 border border-purple-500/20 capitalize">
              {seniority}
            </span>
          )}
          {employmentType && (
            <span className="rounded-md bg-slate-800 px-2 py-0.5 text-[11px] font-medium text-slate-300">
              {employmentType.replace("_", " ")}
            </span>
          )}
          {job.source && (
            <span className="rounded-md bg-slate-800/60 px-2 py-0.5 text-[10px] font-medium text-slate-400">
              via {job.source}
            </span>
          )}
        </div>

        {/* Skills Chips */}
        {job.skills && job.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1">
            {job.skills.slice(0, 5).map((skill) => (
              <span
                key={skill}
                className="rounded-full bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 border border-slate-700/40"
              >
                {skill}
              </span>
            ))}
            {job.skills.length > 5 && (
              <span className="rounded-full bg-slate-800/40 px-1.5 py-0.5 text-[10px] text-slate-500">
                +{job.skills.length - 5}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Bottom actions */}
      <div className="mt-4 flex items-center justify-between border-t border-slate-800/60 pt-3">
        <button
          onClick={() => onSelect(job)}
          className="text-xs font-medium text-slate-400 transition hover:text-white flex items-center gap-1"
        >
          View description
        </button>

        <a
          href={job.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500 active:bg-indigo-700"
        >
          <span>Apply</span>
          <ArrowUpRight className="h-3.5 w-3.5" />
        </a>
      </div>
    </div>
  );
};
