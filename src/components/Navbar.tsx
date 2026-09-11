import React from 'react';
import { Activity, ShieldAlert, History, PhoneCall, Sparkles, HeartPulse } from 'lucide-react';

interface NavbarProps {
  onOpenHotlines: () => void;
  onOpenHistory: () => void;
  onOpenJudgeDemo: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHotlines,
  onOpenHistory,
  onOpenJudgeDemo,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-md shadow-cyan-900/30">
            <HeartPulse className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-bold tracking-tight text-white truncate">
                HealthBridge
              </span>
              <span className="hidden md:inline-flex rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-400">
                PromptWars x Techverse
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 lg:block">
              Universal Clinical Action & SBAR Triage Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Tools */}
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2.5">
          {/* Judge Demo & Evaluator Guide Trigger */}
          <button
            id="judge-demo-nav-btn"
            onClick={onOpenJudgeDemo}
            className="flex items-center gap-1.5 rounded-lg border border-cyan-500/40 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-cyan-300 shadow-sm transition hover:border-cyan-400 hover:bg-cyan-500/25 hover:text-white active:scale-95 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="Open Judge Demo Hub & Architecture Guide"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
            <span className="hidden sm:inline">Judge Demo Hub</span>
            <span className="sm:hidden">Judge Demo</span>
          </button>

          {/* Past Triage History Trigger */}
          <button
            id="open-history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-2 sm:px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
            title="View Past Triages"
          >
            <History className="h-4 w-4 text-slate-400 shrink-0" />
            <span className="hidden sm:inline">History</span>
            {historyCount > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-semibold text-cyan-300">
                {historyCount}
              </span>
            )}
          </button>

          {/* Emergency Hotlines Trigger */}
          <button
            id="emergency-hotlines-btn"
            onClick={onOpenHotlines}
            className="flex shrink-0 items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/15 px-2.5 sm:px-3 py-1.5 text-xs font-bold text-rose-300 shadow-sm transition-colors hover:bg-rose-500/25 hover:text-rose-100 active:scale-95 whitespace-nowrap focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
            title="Emergency Services (911 / 112)"
          >
            <PhoneCall className="h-3.5 w-3.5 shrink-0 text-rose-400 animate-pulse" />
            <span className="hidden sm:inline">Emergency 911 / 112</span>
            <span className="sm:hidden font-extrabold text-rose-200">911 / 112</span>
          </button>
        </div>
      </div>
    </header>
  );
};
