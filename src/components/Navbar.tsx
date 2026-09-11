import React from 'react';
import { Activity, ShieldAlert, History, PhoneCall, Sparkles, HeartPulse } from 'lucide-react';

interface NavbarProps {
  onOpenHotlines: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHotlines,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand identity */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-500 shadow-md shadow-cyan-900/30">
            <HeartPulse className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-bold tracking-tight text-white">HealthBridge</span>
              <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-400">
                PromptWars x Techverse
              </span>
            </div>
            <p className="hidden text-xs text-slate-400 sm:block">
              Universal Clinical Action & SBAR Triage Engine
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Tools */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Gemini AI Protocol Badge */}
          <div className="hidden items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/90 px-2.5 py-1.5 text-xs text-slate-300 md:flex">
            <Sparkles className="h-3.5 w-3.5 text-blue-400" />
            <span>Gemini 3.8 Multimodal</span>
          </div>

          {/* Past Triage History Trigger */}
          <button
            id="open-history-btn"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/80 px-3 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:border-slate-700 hover:bg-slate-800 hover:text-white"
            title="View Past Triages"
          >
            <History className="h-4 w-4 text-slate-400" />
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
            className="flex items-center gap-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-1.5 text-xs font-semibold text-rose-300 shadow-sm transition-colors hover:bg-rose-500/20 hover:text-rose-200"
          >
            <PhoneCall className="h-3.5 w-3.5 text-rose-400 animate-pulse" />
            <span>Emergency 911 / 112</span>
          </button>
        </div>
      </div>
    </header>
  );
};
