"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { SearchFilters, FilterState } from "@/components/SearchFilters";
import { JobCard } from "@/components/JobCard";
import { JobModal } from "@/components/JobModal";
import { SavedJobsDrawer } from "@/components/SavedJobsDrawer";
import { TelegramAdminModal } from "@/components/TelegramAdminModal";
import { PasswordGate } from "@/components/PasswordGate";
import { Job, SearchResponse } from "@/types/job";
import {
  Sparkles,
  Loader2,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  AlertCircle,
  Briefcase,
  CheckCircle,
  Send,
} from "lucide-react";

const INITIAL_FILTERS: FilterState = {
  q: "",
  work_mode: "",
  category: "",
  seniority: "",
  country: "",
  employment_type: "",
};

const POPULAR_SEARCHES = [
  "Software Engineer",
  "React",
  "Fullstack",
  "Python",
  "DevOps",
  "AI Engineer",
  "Remote Go",
  "Frontend",
];

export default function HomePage() {
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const limit = 24;

  const [jobs, setJobs] = useState<Job[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [savedJobs, setSavedJobs] = useState<Job[]>([]);
  const [isSavedDrawerOpen, setIsSavedDrawerOpen] = useState(false);
  const [isTelegramModalOpen, setIsTelegramModalOpen] = useState(false);

  // Dashboard password gate state (Chitu@123)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const isAuth =
        localStorage.getItem("jh_admin_auth") === "true" ||
        sessionStorage.getItem("jh_admin_auth") === "true";
      setIsAuthenticated(isAuth);
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  const handleUnlock = () => {
    setIsAuthenticated(true);
  };

  const handleLock = () => {
    try {
      localStorage.removeItem("jh_admin_auth");
      sessionStorage.removeItem("jh_admin_auth");
    } catch {}
    setIsAuthenticated(false);
  };

  // Load saved jobs from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("freehire_saved_jobs");
      if (stored) {
        setSavedJobs(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Failed to read saved jobs:", e);
    }
  }, []);

  // Save to localStorage when savedJobs change
  const saveToStorage = (updated: Job[]) => {
    setSavedJobs(updated);
    try {
      localStorage.setItem("freehire_saved_jobs", JSON.stringify(updated));
    } catch (e) {
      console.error("Failed to save jobs:", e);
    }
  };

  const handleToggleSave = (job: Job) => {
    const exists = savedJobs.some((j) => j.public_slug === job.public_slug);
    if (exists) {
      saveToStorage(savedJobs.filter((j) => j.public_slug !== job.public_slug));
    } else {
      saveToStorage([job, ...savedJobs]);
    }
  };

  const handleRemoveSaved = (slug: string) => {
    saveToStorage(savedJobs.filter((j) => j.public_slug !== slug));
  };

  const handleClearSaved = () => {
    saveToStorage([]);
  };

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(filters.q);
      setPage(1); // reset to page 1 on query change
    }, 350);
    return () => clearTimeout(timer);
  }, [filters.q]);

  // Fetch jobs
  const fetchJobs = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (debouncedQuery) params.set("q", debouncedQuery);
      if (filters.work_mode) params.set("work_mode", filters.work_mode);
      if (filters.category) params.set("category", filters.category);
      if (filters.seniority) params.set("seniority", filters.seniority);
      if (filters.country) params.set("country", filters.country);
      if (filters.employment_type) params.set("employment_type", filters.employment_type);

      const offset = (page - 1) * limit;
      params.set("limit", String(limit));
      params.set("offset", String(offset));

      const res = await fetch(`/api/jobs?${params.toString()}`);
      if (!res.ok) {
        throw new Error(`Failed to load jobs (status ${res.status})`);
      }

      const data: SearchResponse = await res.json();
      setJobs(data.data || []);
      setTotal(data.meta?.total || 0);
    } catch (err: any) {
      setError(err?.message || "An unexpected error occurred while fetching jobs.");
      setJobs([]);
    } finally {
      setIsLoading(false);
    }
  }, [debouncedQuery, filters.work_mode, filters.category, filters.seniority, filters.country, filters.employment_type, page]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const totalPages = Math.ceil(total / limit);

  // If checking authentication
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-9 w-9 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400">Loading JobHunger Dashboard...</p>
      </div>
    );
  }

  // If not authenticated, render Password Gate
  if (!isAuthenticated) {
    return <PasswordGate onUnlock={handleUnlock} />;
  }

  return (
    <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
      {/* Header */}
      <Header
        totalJobs={total}
        savedCount={savedJobs.length}
        onOpenSaved={() => setIsSavedDrawerOpen(true)}
        onOpenTelegram={() => setIsTelegramModalOpen(true)}
        onLock={handleLock}
      />

      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl border border-indigo-900/30 bg-gradient-to-b from-indigo-950/40 via-slate-900/40 to-slate-950/40 p-6 sm:p-10 text-center shadow-2xl">
          <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-64 w-96 rounded-full bg-indigo-500/15 blur-3xl" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3.5 py-1 text-xs font-semibold text-indigo-300">
              <Sparkles className="h-3.5 w-3.5 text-indigo-400" />
              <span>3.6M+ Verified Postings Crawled Directly from ATS Feeds</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Live Career Search Engine for{" "}
              <span className="bg-gradient-to-r from-indigo-400 to-violet-300 bg-clip-text text-transparent">
                Developers & Tech
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto">
              Aggregated continuously from Greenhouse, Lever, Workday, Ashby, and top company career pages. Zero spam, direct application links.
            </p>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setIsTelegramModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2.5 text-xs font-semibold text-white shadow-lg shadow-indigo-500/25 hover:from-blue-500 hover:to-indigo-500 transition active:scale-95"
              >
                <Send className="h-4 w-4" />
                <span>Telegram Broadcast Hub (Post 9 Jobs / 8:40 PM Cron)</span>
              </button>
            </div>

            {/* Quick search tags */}
            <div className="pt-2 flex flex-wrap justify-center items-center gap-1.5 text-xs">
              <span className="text-slate-500 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Popular:
              </span>
              {POPULAR_SEARCHES.map((item) => (
                <button
                  key={item}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, q: item }));
                  }}
                  className="rounded-full border border-slate-800 bg-slate-900/80 px-2.5 py-0.5 text-slate-300 hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white transition"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <SearchFilters
          filters={filters}
          onChange={(updated) => {
            setFilters((prev) => ({ ...prev, ...updated }));
            setPage(1);
          }}
          onReset={() => {
            setFilters(INITIAL_FILTERS);
            setPage(1);
          }}
          isLoading={isLoading}
        />

        {/* Results Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 px-1">
          <div className="text-xs text-slate-400">
            {isLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-400" />
                Scanning live postings...
              </span>
            ) : (
              <span>
                Showing{" "}
                <strong className="text-white font-medium">
                  {jobs.length > 0 ? (page - 1) * limit + 1 : 0}–{Math.min(page * limit, total)}
                </strong>{" "}
                of <strong className="text-white font-medium">{total.toLocaleString()}</strong> vacancies
                {filters.q && (
                  <span>
                    {" "}
                    for &ldquo;<strong className="text-indigo-400">{filters.q}</strong>&rdquo;
                  </span>
                )}
              </span>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">
                Page {page} of {totalPages.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 p-6 text-center space-y-2">
            <AlertCircle className="h-8 w-8 text-rose-400 mx-auto" />
            <h3 className="text-sm font-semibold text-rose-300">Unable to load job postings</h3>
            <p className="text-xs text-rose-400/80 max-w-md mx-auto">{error}</p>
            <button
              onClick={() => fetchJobs()}
              className="mt-2 rounded-lg bg-rose-600 px-4 py-1.5 text-xs font-semibold text-white hover:bg-rose-500 transition"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Loading Skeleton */}
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-xl border border-slate-800 bg-slate-900/30 p-5 animate-pulse space-y-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-slate-800" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3 w-24 bg-slate-800 rounded" />
                    <div className="h-2.5 w-16 bg-slate-800 rounded" />
                  </div>
                </div>
                <div className="h-4 w-3/4 bg-slate-800 rounded" />
                <div className="h-3 w-1/2 bg-slate-800 rounded" />
                <div className="pt-8 flex gap-2">
                  <div className="h-5 w-16 bg-slate-800 rounded-full" />
                  <div className="h-5 w-16 bg-slate-800 rounded-full" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Job Cards Grid */}
        {!isLoading && jobs.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard
                key={job.public_slug}
                job={job}
                isSaved={savedJobs.some((j) => j.public_slug === job.public_slug)}
                onToggleSave={handleToggleSave}
                onSelect={(selected) => setSelectedJob(selected)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && jobs.length === 0 && !error && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/30 p-12 text-center space-y-3">
            <Briefcase className="h-10 w-10 text-slate-600 mx-auto" />
            <h3 className="text-base font-semibold text-white">No job postings found</h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              No matching listings found for your current filter criteria. Try clearing some filters or searching for broader terms like &ldquo;software&rdquo;, &ldquo;developer&rdquo;, or &ldquo;data&rdquo;.
            </p>
            <button
              onClick={() => {
                setFilters(INITIAL_FILTERS);
                setPage(1);
              }}
              className="mt-2 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 transition"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Pagination Controls */}
        {!isLoading && totalPages > 1 && (
          <div className="flex items-center justify-center gap-3 pt-6 pb-12">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              disabled={page === 1}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous</span>
            </button>

            <span className="text-xs text-slate-400 px-2">
              Page <strong className="text-white">{page}</strong> of{" "}
              <strong className="text-white">{totalPages.toLocaleString()}</strong>
            </span>

            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 400, behavior: "smooth" });
              }}
              disabled={page >= totalPages}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-4 py-2 text-xs font-medium text-slate-300 hover:border-slate-700 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <span>Next</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950/60 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto max-w-7xl px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>© {new Date().getFullYear()} FreeHire Web Portal. Built for developers & AI agents.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <a
              href="https://freehire.me"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition"
            >
              FreeHire.me
            </a>
            <a
              href="https://github.com/strelov1/freehire-cli"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-indigo-400 transition"
            >
              GitHub CLI
            </a>
          </div>
        </div>
      </footer>

      {/* Slide-over Job Details Modal */}
      <JobModal
        job={selectedJob}
        onClose={() => setSelectedJob(null)}
        isSaved={
          selectedJob
            ? savedJobs.some((j) => j.public_slug === selectedJob.public_slug)
            : false
        }
        onToggleSave={handleToggleSave}
      />

      {/* Slide-over Saved Jobs Drawer */}
      <SavedJobsDrawer
        isOpen={isSavedDrawerOpen}
        onClose={() => setIsSavedDrawerOpen(false)}
        savedJobs={savedJobs}
        onRemove={handleRemoveSaved}
        onClearAll={handleClearSaved}
        onSelect={(job) => {
          setIsSavedDrawerOpen(false);
          setSelectedJob(job);
        }}
      />

      {/* Telegram Admin & Auto-Poster Modal */}
      <TelegramAdminModal
        isOpen={isTelegramModalOpen}
        onClose={() => setIsTelegramModalOpen(false)}
      />
    </div>
  );
}
