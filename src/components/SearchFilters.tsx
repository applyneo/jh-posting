"use client";

import React from "react";
import { Search, X, SlidersHorizontal, RotateCcw, Globe, Briefcase, Zap } from "lucide-react";

export interface FilterState {
  q: string;
  work_mode: string;
  category: string;
  seniority: string;
  country: string;
  employment_type: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onChange: (updated: Partial<FilterState>) => void;
  onReset: () => void;
  isLoading: boolean;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onChange,
  onReset,
  isLoading,
}) => {
  const isAnyFilterActive =
    Boolean(filters.q) ||
    Boolean(filters.work_mode) ||
    Boolean(filters.category) ||
    Boolean(filters.seniority) ||
    Boolean(filters.country) ||
    Boolean(filters.employment_type);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4 sm:p-5 shadow-lg backdrop-blur-md">
      {/* Top Search Input */}
      <div className="relative flex items-center">
        <div className="pointer-events-none absolute left-4 text-slate-400">
          <Search className="h-5 w-5" />
        </div>
        <input
          type="text"
          value={filters.q}
          onChange={(e) => onChange({ q: e.target.value })}
          placeholder="Search 3.6M+ jobs by title, keyword (e.g. 'React', 'Go', 'AI Engineer')..."
          className="w-full rounded-xl border border-slate-700/80 bg-slate-950/80 py-3.5 pl-12 pr-10 text-sm text-white placeholder-slate-400 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
        />
        {filters.q && (
          <button
            onClick={() => onChange({ q: "" })}
            className="absolute right-3.5 text-slate-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filter controls row */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 items-center">
        {/* Remote Toggle */}
        <button
          onClick={() =>
            onChange({ work_mode: filters.work_mode === "remote" ? "" : "remote" })
          }
          className={`flex h-10 items-center justify-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition ${
            filters.work_mode === "remote"
              ? "border-blue-500/50 bg-blue-500/15 text-blue-300 shadow-sm shadow-blue-500/20"
              : "border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700 hover:text-slate-200"
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>Remote Only</span>
        </button>

        {/* Category */}
        <select
          value={filters.category}
          onChange={(e) => onChange({ category: e.target.value })}
          className="h-10 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Categories</option>
          <option value="software_engineering">Software Engineering</option>
          <option value="frontend">Frontend</option>
          <option value="backend">Backend</option>
          <option value="fullstack">Fullstack</option>
          <option value="devops">DevOps & Cloud</option>
          <option value="ml_ai">AI & Machine Learning</option>
          <option value="data">Data Engineering & Analytics</option>
          <option value="security">Cybersecurity</option>
          <option value="product">Product Management</option>
          <option value="design">UI/UX Design</option>
          <option value="qa">QA & Testing</option>
        </select>

        {/* Seniority */}
        <select
          value={filters.seniority}
          onChange={(e) => onChange({ seniority: e.target.value })}
          className="h-10 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Seniorities</option>
          <option value="intern">Intern</option>
          <option value="junior">Junior</option>
          <option value="middle">Mid-Level</option>
          <option value="senior">Senior</option>
          <option value="lead">Lead / Staff</option>
          <option value="c_level">Director / VP / Exec</option>
        </select>

        {/* Country */}
        <select
          value={filters.country}
          onChange={(e) => onChange({ country: e.target.value })}
          className="h-10 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Countries</option>
          <option value="us">United States (US)</option>
          <option value="in">India (IN)</option>
          <option value="gb">United Kingdom (GB)</option>
          <option value="de">Germany (DE)</option>
          <option value="ca">Canada (CA)</option>
          <option value="nl">Netherlands (NL)</option>
          <option value="sg">Singapore (SG)</option>
          <option value="au">Australia (AU)</option>
        </select>

        {/* Employment Type */}
        <select
          value={filters.employment_type}
          onChange={(e) => onChange({ employment_type: e.target.value })}
          className="h-10 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-xs text-slate-300 focus:border-indigo-500 focus:outline-none"
        >
          <option value="">All Types</option>
          <option value="full_time">Full-time</option>
          <option value="contract">Contract / Freelance</option>
          <option value="internship">Internship</option>
          <option value="part_time">Part-time</option>
        </select>

        {/* Reset button */}
        {isAnyFilterActive && (
          <button
            onClick={onReset}
            className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-3 text-xs font-medium text-rose-400 hover:border-rose-500/40 hover:bg-rose-500/10 transition"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
};
