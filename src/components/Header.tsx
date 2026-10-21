"use client";

import React from "react";
import { Briefcase, Bookmark, Sparkles, ExternalLink, Globe2, Send, Lock, PlusCircle, Users } from "lucide-react";

interface HeaderProps {
  totalJobs?: number;
  savedCount: number;
  onOpenSaved: () => void;
  onOpenTelegram: () => void;
  onOpenAddGroup?: () => void;
  onLock?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  totalJobs,
  savedCount,
  onOpenSaved,
  onOpenTelegram,
  onOpenAddGroup,
  onLock,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-lg shadow-indigo-500/20">
            <Briefcase className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">FreeHire</span>
              <span className="rounded-md bg-indigo-500/10 px-2 py-0.5 text-xs font-semibold text-indigo-400 border border-indigo-500/20">
                Web
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Live crawler over Greenhouse, Lever, Workday & 300+ ATS
            </p>
          </div>
        </div>

        {/* Center / Counter */}
        {typeof totalJobs === "number" && (
          <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-800 bg-slate-900/60 px-3 py-1 text-xs text-slate-300">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>
              <strong className="text-white font-medium">{totalJobs.toLocaleString()}</strong> live postings available
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Telegram Auto-Poster button */}
          <button
            onClick={onOpenTelegram}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-md shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-95"
            title="Open Telegram Auto-Poster"
          >
            <Send className="h-3.5 w-3.5" />
            <span className="font-medium">Telegram Post</span>
          </button>

          {/* Saved Jobs button */}
          <button
            onClick={onOpenSaved}
            className="relative flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:border-slate-700 hover:bg-slate-800 hover:text-white"
          >
            <Bookmark className="h-4 w-4 text-amber-400" />
            <span className="hidden sm:inline">Saved Jobs</span>
            {savedCount > 0 && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-black">
                {savedCount}
              </span>
            )}
          </button>

          {/* Add Group button in place of CLI Repo */}
          <button
            onClick={onOpenAddGroup || onOpenTelegram}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-300 transition hover:border-indigo-500/50 hover:bg-slate-800 hover:text-white"
            title="Add & Manage Telegram Groups/Channels"
          >
            <PlusCircle className="h-3.5 w-3.5 text-indigo-400" />
            <span className="hidden sm:inline">Add Group</span>
          </button>

          {/* Lock Dashboard */}
          {onLock && (
            <button
              onClick={onLock}
              className="group flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2.5 py-1.5 text-xs font-medium text-slate-400 transition hover:border-rose-500/50 hover:bg-rose-500/10 hover:text-rose-300"
              title="Lock Dashboard"
            >
              <Lock className="h-3.5 w-3.5 text-slate-400 group-hover:text-rose-400 transition" />
              <span className="hidden sm:inline">Lock</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
