import React, { useState } from 'react';
import { 
  FileText, 
  UserCheck, 
  Copy, 
  Check, 
  Stethoscope, 
  Activity, 
  Sparkles, 
  ShieldCheck,
  AlertCircle 
} from 'lucide-react';
import { SBARHandover } from '../types';

interface SBARHandoverCardProps {
  sbar: SBARHandover;
  plainEnglishSummary: string;
  keyFindings: string[];
}

export const SBARHandoverCard: React.FC<SBARHandoverCardProps> = ({
  sbar,
  plainEnglishSummary,
  keyFindings,
}) => {
  const [activeTab, setActiveTab] = useState<'sbar' | 'patient'>('sbar');
  const [copied, setCopied] = useState(false);

  const handleCopySBAR = () => {
    const formatted = `=== HEALTHBRIDGE CLINICAL SBAR HANDOVER ===
[S] SITUATION:
${sbar.situation}

[B] BACKGROUND:
${sbar.background}

[A] ASSESSMENT & DIFFERENTIAL:
${sbar.assessment}

[R] RECOMMENDATION & ORDERS:
${sbar.recommendation}

CRITICAL VITAL TRIGGERS:
${sbar.vitalTriggers.map((t) => `- ${t}`).join('\n')}
===========================================`;

    navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      {/* Header and Toggle */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/20 text-indigo-400">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Healthcare System Translation Bridge</h3>
              <span className="rounded-full bg-indigo-500/20 px-2 py-0.5 text-[10px] font-semibold text-indigo-300">
                SBAR Standard
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Universal clinical communication bridging raw human symptoms to ER & Specialist triage
            </p>
          </div>
        </div>

        {/* View Mode Toggle Switch */}
        <div className="flex items-center rounded-xl border border-slate-800 bg-slate-950 p-1">
          <button
            onClick={() => setActiveTab('sbar')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'sbar'
                ? 'bg-indigo-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Stethoscope className="h-3.5 w-3.5" />
            <span>Clinician SBAR</span>
          </button>
          <button
            onClick={() => setActiveTab('patient')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
              activeTab === 'patient'
                ? 'bg-cyan-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span>Patient View</span>
          </button>
        </div>
      </div>

      {/* SBAR Clinician Protocol View */}
      {activeTab === 'sbar' ? (
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              Show this directly to the receiving triage nurse or paramedic:
            </span>
            <button
              onClick={handleCopySBAR}
              className="flex items-center gap-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 px-3 py-1.5 text-xs font-bold text-indigo-300 transition-colors hover:bg-indigo-500/20 hover:text-indigo-200"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-400" />
                  <span>Handover Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>Copy Handover for Nurse</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Situation */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-400">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-500/20 text-xs">
                  S
                </span>
                <span>Situation (Acute Chief Event)</span>
              </div>
              <p className="mt-2 text-xs text-slate-200 leading-relaxed font-mono">
                {sbar.situation}
              </p>
            </div>

            {/* Background */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-400">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-500/20 text-xs">
                  B
                </span>
                <span>Background & Comorbidities</span>
              </div>
              <p className="mt-2 text-xs text-slate-200 leading-relaxed font-mono">
                {sbar.background}
              </p>
            </div>

            {/* Assessment */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-cyan-400">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-cyan-500/20 text-xs">
                  A
                </span>
                <span>Clinical Assessment & Differential</span>
              </div>
              <p className="mt-2 text-xs text-slate-200 leading-relaxed font-mono">
                {sbar.assessment}
              </p>
            </div>

            {/* Recommendation */}
            <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
                <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500/20 text-xs">
                  R
                </span>
                <span>Requested Recommendation & Diagnostics</span>
              </div>
              <p className="mt-2 text-xs text-slate-200 leading-relaxed font-mono">
                {sbar.recommendation}
              </p>
            </div>
          </div>

          {/* Critical Vital Triggers */}
          {sbar.vitalTriggers && sbar.vitalTriggers.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-rose-400" />
                <span>Clinical Red-Line Vital Thresholds</span>
              </span>
              <div className="mt-2 flex flex-wrap gap-2">
                {sbar.vitalTriggers.map((trig, idx) => (
                  <span
                    key={idx}
                    className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-1 font-mono text-xs text-rose-300"
                  >
                    {trig}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Patient & Family View */
        <div className="mt-5 space-y-4">
          <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-cyan-400">
              Plain-English Explanation (No Medical Jargon)
            </h4>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              {plainEnglishSummary}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Key Findings From Your Input
            </h4>
            <div className="space-y-2">
              {keyFindings.map((finding, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-300"
                >
                  <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                    {idx + 1}
                  </span>
                  <span>{finding}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
