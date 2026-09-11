import React, { useState, useEffect } from 'react';
import {
  X,
  Clock,
  Trash2,
  ChevronRight,
  Activity,
  Download,
  FileSpreadsheet,
  FileCode,
  AlertTriangle,
  Search,
  Check,
  ShieldCheck,
} from 'lucide-react';
import { ClinicalAnalysisResult, TriageLevel } from '../types';
import { getTriageRepository } from '../repository/triageRepository';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: ClinicalAnalysisResult[];
  onSelectResult: (result: ClinicalAnalysisResult) => void;
  onClearHistory: () => void;
  onDeleteSingle?: (id: string) => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onSelectResult,
  onClearHistory,
  onDeleteSingle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUrgency, setSelectedUrgency] = useState<'ALL' | TriageLevel>('ALL');
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  // Close on Escape key press for accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showClearConfirm) {
          setShowClearConfirm(false);
        } else {
          onClose();
        }
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, showClearConfirm, onClose]);

  if (!isOpen) return null;

  const repo = getTriageRepository();

  const handleExportJSON = async () => {
    try {
      const data = await repo.exportSanitizedJSON();
      const blob = new Blob([data], { type: 'application/json;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `healthbridge_triage_history_${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportNotice('Exported sanitized JSON');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (e) {
      console.error('Failed to export JSON:', e);
    }
  };

  const handleExportCSV = async () => {
    try {
      const data = await repo.exportSanitizedCSV();
      const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `healthbridge_triage_history_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setExportNotice('Exported sanitized CSV');
      setTimeout(() => setExportNotice(null), 3000);
    } catch (e) {
      console.error('Failed to export CSV:', e);
    }
  };

  const filteredHistory = history.filter((item) => {
    const matchesSearch =
      (item.triage?.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.rawInputSummary || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.targetSpecialty || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesUrgency = selectedUrgency === 'ALL' || item.triage?.level === selectedUrgency;
    return matchesSearch && matchesUrgency;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="history-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm transition-opacity"
    >
      <div className="relative flex h-full w-full max-w-lg flex-col border-l border-slate-800 bg-slate-900 p-5 sm:p-6 shadow-2xl">
        {/* Drawer Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h2 id="history-drawer-title" className="text-base font-bold text-white">
                Persistent Triage History
              </h2>
              <p className="text-xs text-slate-400">
                {history.length} {history.length === 1 ? 'record' : 'records'} stored locally
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close history drawer"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action Bar: Export Sanitized JSON & CSV */}
        {history.length > 0 && (
          <div className="mt-3 flex items-center justify-between gap-2 rounded-xl border border-slate-800 bg-slate-950/60 p-2.5">
            <div className="flex items-center gap-1.5 text-xs text-slate-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="font-medium hidden sm:inline">Sanitized Export:</span>
              <span className="font-medium sm:hidden">Export:</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportJSON}
                aria-label="Export sanitized triage records as JSON"
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                title="Download sanitized JSON file without PII"
              >
                <FileCode className="h-3.5 w-3.5 text-cyan-400" />
                <span>JSON</span>
              </button>
              <button
                onClick={handleExportCSV}
                aria-label="Export sanitized triage records as CSV"
                className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs font-semibold text-slate-200 transition hover:bg-slate-700 hover:text-white focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                title="Download sanitized CSV spreadsheet"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-400" />
                <span>CSV</span>
              </button>
            </div>
          </div>
        )}

        {/* Temporary Export Notification Badge */}
        {exportNotice && (
          <div className="mt-2 flex items-center gap-1.5 rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-300 animate-fadeIn">
            <Check className="h-3.5 w-3.5" />
            <span>{exportNotice}</span>
          </div>
        )}

        {/* Search & Filter Bar */}
        {history.length > 0 && (
          <div className="mt-3 space-y-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by diagnosis, symptom, specialty..."
                aria-label="Search triage history"
                className="w-full rounded-lg border border-slate-800 bg-slate-950/70 pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
            </div>
            {/* Urgency Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
              {(
                [
                  { id: 'ALL', label: 'All' },
                  { id: 'EMERGENCY_RED', label: 'Emergency' },
                  { id: 'URGENT_AMBER', label: 'Urgent' },
                  { id: 'ROUTINE_GREEN', label: 'Routine' },
                ] as const
              ).map((chip) => (
                <button
                  key={chip.id}
                  onClick={() => setSelectedUrgency(chip.id)}
                  className={`rounded-full px-2.5 py-0.5 font-medium transition ${
                    selectedUrgency === chip.id
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800/80 text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Records List */}
        <div className="mt-3 flex-1 overflow-y-auto space-y-3 pr-1">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center text-slate-500">
              <Activity className="h-12 w-12 text-slate-800 mb-3" />
              <p className="text-sm font-semibold text-slate-400">No triage sessions logged</p>
              <p className="text-xs text-slate-600 mt-1 max-w-xs">
                Run an evaluation or load an evaluator demo case to test persistent clinical handovers.
              </p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-xs">
              No sessions match your search criteria.
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition-all hover:border-cyan-500/50 hover:bg-slate-900 focus-within:ring-2 focus-within:ring-cyan-400"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                        item.triage?.level === 'EMERGENCY_RED'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.triage?.level === 'URGENT_AMBER'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      }`}
                    >
                      {item.triage?.level?.replace('_', ' ') || 'CLINICAL'}
                    </span>
                    {item.triage?.score && (
                      <span className="rounded bg-slate-800 px-1 py-0.5 text-[10px] font-mono text-slate-400">
                        Score {item.triage.score}/10
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {new Date(item.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <h4 className="mt-2 text-xs font-bold text-slate-200 line-clamp-1 group-hover:text-cyan-300">
                  {item.triage?.title || 'Clinical Evaluation'}
                </h4>
                <p className="mt-1 text-[11px] text-slate-400 line-clamp-2">
                  {item.patientSummary?.plainEnglish || item.rawInputSummary}
                </p>

                <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/60">
                  <span className="line-clamp-1 text-slate-400">
                    To: {item.targetSpecialty || item.recommendedFacility}
                  </span>
                  <button
                    onClick={() => {
                      onSelectResult(item);
                      onClose();
                    }}
                    aria-label={`Open detailed view for ${item.triage?.title}`}
                    className="flex items-center gap-1 rounded bg-cyan-500/10 px-2 py-1 text-[11px] font-semibold text-cyan-300 hover:bg-cyan-500/20 hover:text-cyan-200 transition focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:outline-none"
                  >
                    <span>Detail View</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Clear History Confirmation Dialog or Trigger Button */}
        {history.length > 0 && (
          <div className="border-t border-slate-800 pt-3 mt-auto">
            {showClearConfirm ? (
              <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 p-3.5">
                <div className="flex items-start gap-2.5 text-rose-200">
                  <AlertTriangle className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                  <div>
                    <h5 className="text-xs font-bold text-white">Clear entire triage history?</h5>
                    <p className="text-[11px] text-rose-300/80 mt-0.5 leading-relaxed">
                      All saved local evaluations and SBAR handovers will be deleted permanently.
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setShowClearConfirm(false)}
                    className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-700 focus-visible:ring-1 focus-visible:ring-slate-400 focus-visible:outline-none"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      onClearHistory();
                      setShowClearConfirm(false);
                    }}
                    className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-bold text-white shadow hover:bg-rose-500 focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
                  >
                    Yes, Clear All
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowClearConfirm(true)}
                aria-label="Open clear history confirmation dialog"
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-800 py-2 text-xs font-medium text-slate-400 hover:border-rose-500/30 hover:bg-slate-800 hover:text-rose-400 transition focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:outline-none"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Clear Triage Session History</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
