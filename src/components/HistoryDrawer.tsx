import React from 'react';
import { X, Clock, Trash2, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';
import { ClinicalAnalysisResult } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ClinicalAnalysisResult[];
  onSelectResult: (result: ClinicalAnalysisResult) => void;
  onClearHistory: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onClearHistory,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
      <div className="relative flex h-full w-full max-w-md flex-col border-l border-slate-800 bg-slate-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white">Past Clinical Triages</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* List of past results */}
        <div className="mt-4 flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500">
              <Activity className="h-10 w-10 text-slate-700 mb-2" />
              <p className="text-sm font-medium">No past triage history yet</p>
              <p className="text-xs text-slate-600 mt-1">
                Completed health evaluations will be saved here in your session.
              </p>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectResult(item);
                  onClose();
                }}
                className="group cursor-pointer rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition-all hover:border-cyan-500/50 hover:bg-slate-900"
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${
                      item.triage.level === 'EMERGENCY_RED'
                        ? 'bg-rose-500/20 text-rose-300'
                        : item.triage.level === 'URGENT_AMBER'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    {item.triage.level.replace('_', ' ')}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <h4 className="mt-2 text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-cyan-300">
                  {item.triage.title}
                </h4>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                  {item.rawInputSummary}
                </p>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-800/60">
                  <span>Specialty: {item.targetSpecialty}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-cyan-400" />
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {history.length > 0 && (
          <div className="border-t border-slate-800 pt-4 mt-auto">
            <button
              onClick={onClearHistory}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-800 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Session History</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
