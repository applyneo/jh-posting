"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Send,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Settings,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  FileSpreadsheet,
  Download,
  Lock,
  KeyRound,
  LogOut,
} from "lucide-react";

interface TelegramAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ADMIN_PASSWORD = "Chitu@123";

export const TelegramAdminModal: React.FC<TelegramAdminModalProps> = ({ isOpen, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passwordInput, setPasswordInput] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");

  const [techGroups, setTechGroups] = useState<string[]>([
    "-1004456666849", // USA Tech Channel
    "-5336777738",    // USA Tech Group
  ]);
  const [nonTechGroups, setNonTechGroups] = useState<string[]>([
    "-1004474267352", // USA Non-Tech Channel
    "-5460771499",    // USA Non-Tech Group
  ]);
  const [healthGroups, setHealthGroups] = useState<string[]>([
    "-1004461057036", // USA Healthcare Channel
    "-5508137058",    // USA Healthcare Group
  ]);

  const [newChatId, setNewChatId] = useState("");
  const [selectedDomain, setSelectedDomain] = useState<"tech" | "non_tech" | "healthcare">("tech");

  const [isPosting, setIsPosting] = useState(false);
  const [postResult, setPostResult] = useState<{
    ok: boolean;
    message: string;
    totalDelivered?: number;
    jobs?: any[];
  } | null>(null);

  // Check saved session auth
  useEffect(() => {
    try {
      if (
        sessionStorage.getItem("jh_admin_auth") === "true" ||
        localStorage.getItem("jh_admin_auth") === "true"
      ) {
        setIsAuthenticated(true);
      }
    } catch {}
  }, [isOpen]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setAuthError("");
      try {
        sessionStorage.setItem("jh_admin_auth", "true");
        localStorage.setItem("jh_admin_auth", "true");
      } catch {}
    } else {
      setAuthError("Incorrect password. Please try again.");
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasswordInput("");
    try {
      sessionStorage.removeItem("jh_admin_auth");
      localStorage.removeItem("jh_admin_auth");
    } catch {}
  };

  // Load saved custom groups from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("jobhunger_tg_groups");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.tech) setTechGroups(parsed.tech);
        if (parsed.non_tech) setNonTechGroups(parsed.non_tech);
        if (parsed.healthcare) setHealthGroups(parsed.healthcare);
      }
    } catch {}
  }, []);

  const saveGroups = (updated: { tech: string[]; non_tech: string[]; healthcare: string[] }) => {
    try {
      localStorage.setItem("jobhunger_tg_groups", JSON.stringify(updated));
    } catch {}
  };

  const handleAddGroup = () => {
    if (!newChatId.trim()) return;
    const cleanId = newChatId.trim();

    if (selectedDomain === "tech" && !techGroups.includes(cleanId)) {
      const updated = [...techGroups, cleanId];
      setTechGroups(updated);
      saveGroups({ tech: updated, non_tech: nonTechGroups, healthcare: healthGroups });
    } else if (selectedDomain === "non_tech" && !nonTechGroups.includes(cleanId)) {
      const updated = [...nonTechGroups, cleanId];
      setNonTechGroups(updated);
      saveGroups({ tech: techGroups, non_tech: updated, healthcare: healthGroups });
    } else if (selectedDomain === "healthcare" && !healthGroups.includes(cleanId)) {
      const updated = [...healthGroups, cleanId];
      setHealthGroups(updated);
      saveGroups({ tech: techGroups, non_tech: nonTechGroups, healthcare: updated });
    }

    setNewChatId("");
  };

  const handleRemoveGroup = (domain: "tech" | "non_tech" | "healthcare", id: string) => {
    if (domain === "tech") {
      const updated = techGroups.filter((g) => g !== id);
      setTechGroups(updated);
      saveGroups({ tech: updated, non_tech: nonTechGroups, healthcare: healthGroups });
    } else if (domain === "non_tech") {
      const updated = nonTechGroups.filter((g) => g !== id);
      setNonTechGroups(updated);
      saveGroups({ tech: techGroups, non_tech: updated, healthcare: healthGroups });
    } else {
      const updated = healthGroups.filter((g) => g !== id);
      setHealthGroups(updated);
      saveGroups({ tech: techGroups, non_tech: nonTechGroups, healthcare: updated });
    }
  };

  const handleTriggerBroadcast = async () => {
    setIsPosting(true);
    setPostResult(null);

    try {
      const res = await fetch("/api/telegram/broadcast", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": ADMIN_PASSWORD,
        },
        body: JSON.stringify({
          groups: {
            tech: techGroups,
            non_tech: nonTechGroups,
            healthcare: healthGroups,
          },
        }),
      });

      const data = await res.json();
      setPostResult(data);
    } catch (err: any) {
      setPostResult({
        ok: false,
        message: err?.message || "Failed to broadcast to Telegram.",
      });
    } finally {
      setIsPosting(false);
    }
  };

  if (!isOpen) return null;

  // Render Password Lock Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

        {/* Lock Modal */}
        <div className="relative w-full max-w-md overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30">
                <Lock className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Admin Verification</h4>
                <p className="text-[11px] text-slate-400">JobHunger Broadcast Control</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-inner">
              <KeyRound className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-white">Enter Admin Password</h3>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Please enter your password to access the Telegram poster, manage groups, and download the Excel ledger.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    if (authError) setAuthError("");
                  }}
                  placeholder="Enter admin password..."
                  autoFocus
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/80 py-3 pl-4 pr-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {authError && (
                <p className="mt-2 text-xs font-medium text-rose-400 flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>{authError}</span>
                </p>
              )}
            </div>

            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition active:scale-95"
            >
              <span>Unlock Dashboard</span>
            </button>
          </form>

          <p className="text-center text-[11px] text-slate-500">
            Authorized administrators & team members only
          </p>
        </div>
      </div>
    );
  }

  const totalDestinations = techGroups.length + nonTechGroups.length + healthGroups.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/70 p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-lg shadow-blue-500/20">
              <Send className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Telegram Job Broadcast Center
                <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400 border border-emerald-500/20">
                  U.S. Only 🇺🇸
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Post 3 Tech, 3 Non-Tech & 3 Healthcare jobs across all your groups and channels.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-950/60 px-2.5 py-1.5 text-xs text-slate-400 hover:border-slate-700 hover:text-white transition"
              title="Lock / Logout"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Lock</span>
            </button>
            <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Main Action Banner */}
          <div className="rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-slate-900/60 to-slate-950/60 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-400">
                <Sparkles className="h-4 w-4" />
                <span>Instant 1-Click Broadcast</span>
              </div>
              <h4 className="text-base font-bold text-white">Broadcast Today&apos;s 9 Fresh Positions</h4>
              <p className="text-xs text-slate-300">
                Pulls 3 fresh U.S. vacancies per domain, strips tracking links, and sends to {totalDestinations} connected chats.
              </p>
            </div>

            <button
              onClick={handleTriggerBroadcast}
              disabled={isPosting}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 disabled:opacity-50 transition active:scale-95 shrink-0"
            >
              {isPosting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Posting to Telegram...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Post 9 Jobs Now</span>
                </>
              )}
            </button>
          </div>

          {/* Result Alert */}
          {postResult && (
            <div
              className={`rounded-xl border p-4 flex items-start gap-3 ${
                postResult.ok
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-rose-500/30 bg-rose-500/10 text-rose-300"
              }`}
            >
              {postResult.ok ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 text-rose-400 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-semibold text-sm">{postResult.message}</p>
                {postResult.totalDelivered !== undefined && (
                  <p className="text-slate-300">Total messages delivered: {postResult.totalDelivered}</p>
                )}
                {postResult.jobs && (
                  <ul className="mt-2 list-disc pl-4 space-y-0.5 text-[11px] text-slate-300">
                    {postResult.jobs.map((j, idx) => (
                      <li key={idx}>
                        <strong className="capitalize">{j.domain}</strong>: {j.title} at {j.company} ({j.chatCount} chats)
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          {/* 24/7 Automated Schedule Card & Excel Download */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <h5 className="text-sm font-semibold text-white">Daily 24/7 Automated Cron Active</h5>
                <p className="text-xs text-slate-400">
                  Scheduled to post 3 fresh jobs daily at <strong className="text-white">8:40 PM IST</strong> (15:10 UTC).
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/telegram/download-excel"
                download="JobHunger_Telegram_Posting_Ledger.xlsx"
                className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3.5 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/20 transition"
              >
                <FileSpreadsheet className="h-3.5 w-3.5" />
                <span>Download Excel Ledger</span>
              </a>

              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Active
              </span>
            </div>
          </div>

          {/* Add More Groups / Channels (For Friend's Groups) */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-semibold text-white">Add More Telegram Groups & Channels</h5>
                <p className="text-xs text-slate-400">
                  Add your friend&apos;s groups or additional channels below. The bot will automatically post to all of them.
                </p>
              </div>
              <span className="text-xs font-semibold text-indigo-400">{totalDestinations} Total Chats Linked</span>
            </div>

            {/* Input Bar */}
            <div className="flex flex-col sm:flex-row gap-2">
              <select
                value={selectedDomain}
                onChange={(e) => setSelectedDomain(e.target.value as any)}
                className="h-10 rounded-lg border border-slate-800 bg-slate-900 px-3 text-xs text-slate-200 focus:border-indigo-500 focus:outline-none"
              >
                <option value="tech">Tech Category</option>
                <option value="non_tech">Non-Tech Category</option>
                <option value="healthcare">Healthcare Category</option>
              </select>

              <input
                type="text"
                placeholder="Enter Telegram Chat ID (e.g. -1001234567890 or @groupname)"
                value={newChatId}
                onChange={(e) => setNewChatId(e.target.value)}
                className="flex-1 rounded-lg border border-slate-800 bg-slate-900 px-3.5 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
              />

              <button
                onClick={handleAddGroup}
                className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 text-xs font-semibold text-white hover:bg-indigo-500 transition"
              >
                <Plus className="h-4 w-4" />
                <span>Add Group</span>
              </button>
            </div>

            {/* Connected Lists */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              {/* Tech */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
                  <span>💻 Tech ({techGroups.length})</span>
                </div>
                <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                  {techGroups.map((id) => (
                    <div key={id} className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-2 py-1 rounded">
                      <span className="truncate">{id}</span>
                      <button onClick={() => handleRemoveGroup("tech", id)} className="text-slate-600 hover:text-rose-400">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Non-Tech */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
                  <span>💼 Non-Tech ({nonTechGroups.length})</span>
                </div>
                <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                  {nonTechGroups.map((id) => (
                    <div key={id} className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-2 py-1 rounded">
                      <span className="truncate">{id}</span>
                      <button onClick={() => handleRemoveGroup("non_tech", id)} className="text-slate-600 hover:text-rose-400">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Healthcare */}
              <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-300 pb-2 border-b border-slate-800">
                  <span>🩺 Healthcare ({healthGroups.length})</span>
                </div>
                <div className="mt-2 space-y-1.5 max-h-32 overflow-y-auto">
                  {healthGroups.map((id) => (
                    <div key={id} className="flex items-center justify-between text-[11px] text-slate-400 bg-slate-950/60 px-2 py-1 rounded">
                      <span className="truncate">{id}</span>
                      <button onClick={() => handleRemoveGroup("healthcare", id)} className="text-slate-600 hover:text-rose-400">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
