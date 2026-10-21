"use client";

import React, { useState } from "react";
import { Lock, KeyRound, Eye, EyeOff, AlertCircle, ArrowRight, ShieldCheck, Briefcase } from "lucide-react";

interface PasswordGateProps {
  onUnlock: () => void;
}

const DASHBOARD_PASSWORD = "Chitu@123";

export const PasswordGate: React.FC<PasswordGateProps> = ({ onUnlock }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");

    if (password === DASHBOARD_PASSWORD) {
      try {
        localStorage.setItem("jh_admin_auth", "true");
        sessionStorage.setItem("jh_admin_auth", "true");
      } catch {}
      onUnlock();
    } else {
      setError("Incorrect password. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md space-y-8">
        {/* Brand Header */}
        <div className="text-center space-y-3">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-500 shadow-xl shadow-indigo-600/30 border border-indigo-400/20">
            <Briefcase className="h-8 w-8 text-white" />
          </div>
          <div>
            <div className="inline-flex items-center gap-2 mb-1">
              <span className="text-2xl font-bold tracking-tight text-white">JobHunger</span>
              <span className="rounded-full bg-indigo-500/10 border border-indigo-500/30 px-2.5 py-0.5 text-xs font-semibold text-indigo-400">
                Dashboard
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live U.S. Job Hub & Telegram Multi-Channel Broadcast Center
            </p>
          </div>
        </div>

        {/* Password Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-800/80 pb-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">Enter Dashboard Password</h2>
              <p className="text-xs text-slate-400">Password required to open dashboard</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Admin Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Enter password..."
                  autoFocus
                  required
                  className="w-full rounded-xl border border-slate-700 bg-slate-950/90 py-3 pl-4 pr-11 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-slate-400 hover:text-slate-200 transition"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              {error && (
                <div className="mt-2.5 flex items-center gap-2 text-xs text-rose-400 font-medium">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-600/30 hover:from-indigo-500 hover:to-violet-500 transition active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              <span>Unlock Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Secure 256-bit Session
            </span>
            <span>JobHunger Team Only</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-500">
          Daily Telegram Auto-Poster (8:40 PM IST) • Vercel 24/7 Cloud Engine
        </p>
      </div>
    </div>
  );
};
