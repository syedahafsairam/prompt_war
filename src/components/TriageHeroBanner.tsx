import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Building2, 
  Stethoscope, 
  PhoneCall, 
  Copy, 
  Printer, 
  Check, 
  ShieldAlert, 
  Sparkles,
  Gauge
} from 'lucide-react';
import { ClinicalAnalysisResult, TriageLevel } from '../types';

interface TriageHeroBannerProps {
  result: ClinicalAnalysisResult;
  onOpenHotlines: () => void;
  onPrint: () => void;
}

export const TriageHeroBanner: React.FC<TriageHeroBannerProps> = ({
  result,
  onOpenHotlines,
  onPrint,
}) => {
  const [copiedSbar, setCopiedSbar] = React.useState(false);

  const getTriageTheme = (level: TriageLevel) => {
    switch (level) {
      case 'EMERGENCY_RED':
        return {
          bg: 'bg-gradient-to-r from-rose-950/80 via-red-900/60 to-slate-900',
          border: 'border-rose-500/50',
          glow: 'shadow-rose-950/50',
          badgeBg: 'bg-rose-500 text-white',
          textColor: 'text-rose-200',
          iconColor: 'text-rose-400',
          accentBorder: 'border-rose-500/30',
          scoreColor: 'text-rose-400',
          badgeText: 'LEVEL 1: IMMEDIATE EMERGENCY',
        };
      case 'URGENT_AMBER':
        return {
          bg: 'bg-gradient-to-r from-amber-950/70 via-amber-900/40 to-slate-900',
          border: 'border-amber-500/50',
          glow: 'shadow-amber-950/40',
          badgeBg: 'bg-amber-500 text-slate-950',
          textColor: 'text-amber-200',
          iconColor: 'text-amber-400',
          accentBorder: 'border-amber-500/30',
          scoreColor: 'text-amber-400',
          badgeText: 'LEVEL 2: URGENT MEDICAL EVALUATION',
        };
      case 'ROUTINE_GREEN':
        return {
          bg: 'bg-gradient-to-r from-emerald-950/60 via-emerald-900/30 to-slate-900',
          border: 'border-emerald-500/50',
          glow: 'shadow-emerald-950/30',
          badgeBg: 'bg-emerald-500 text-slate-950',
          textColor: 'text-emerald-200',
          iconColor: 'text-emerald-400',
          accentBorder: 'border-emerald-500/30',
          scoreColor: 'text-emerald-400',
          badgeText: 'LEVEL 3: ROUTINE CLINICAL VISIT',
        };
      default:
        return {
          bg: 'bg-gradient-to-r from-cyan-950/60 via-blue-900/30 to-slate-900',
          border: 'border-cyan-500/50',
          glow: 'shadow-cyan-950/30',
          badgeBg: 'bg-cyan-500 text-slate-950',
          textColor: 'text-cyan-200',
          iconColor: 'text-cyan-400',
          accentBorder: 'border-cyan-500/30',
          scoreColor: 'text-cyan-400',
          badgeText: 'LEVEL 4: SELF-CARE & MONITORING',
        };
    }
  };

  const theme = getTriageTheme(result.triage.level);

  const handleCopyQuickSbar = () => {
    const sbarText = `CLINICAL SBAR HANDOVER [HealthBridge]:
SITUATION: ${result.sbar.situation}
BACKGROUND: ${result.sbar.background}
ASSESSMENT: ${result.sbar.assessment}
RECOMMENDATION: ${result.sbar.recommendation}
FACILITY: ${result.recommendedFacility} | SPECIALTY: ${result.targetSpecialty}`;

    navigator.clipboard.writeText(sbarText);
    setCopiedSbar(true);
    setTimeout(() => setCopiedSbar(false), 2000);
  };

  const isEmergency = result.triage.level === 'EMERGENCY_RED';

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${theme.border} ${theme.bg} p-6 shadow-2xl ${theme.glow} backdrop-blur-md sm:p-8`}
    >
      {/* Top badges */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-5">
        <div className="flex flex-wrap items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-xs font-black tracking-wide uppercase ${theme.badgeBg}`}>
            {theme.badgeText}
          </span>
          <span className="flex items-center gap-1 rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-0.5 text-xs text-slate-300">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span>Timeframe: {result.triage.timeframe}</span>
          </span>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyQuickSbar}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
            title="Copy SBAR clinician summary to clipboard"
          >
            {copiedSbar ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>Copied SBAR</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span>Copy SBAR</span>
              </>
            )}
          </button>

          <button
            onClick={onPrint}
            className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900/80 px-3 py-1.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white"
            title="Print Clinical Handover Sheet"
          >
            <Printer className="h-3.5 w-3.5 text-slate-400" />
            <span>Print Sheet</span>
          </button>
        </div>
      </div>

      {/* Main Title & Clinical Rationale */}
      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {result.triage.title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-300">
            {result.triage.rationale}
          </p>

          {/* System Navigation Targets: Specialty & Facility */}
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="mt-0.5 rounded-lg bg-blue-500/10 p-2 text-blue-400">
                <Stethoscope className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Target Clinical Specialty
                </span>
                <p className="text-xs font-bold text-white mt-0.5">{result.targetSpecialty}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/70 p-3.5">
              <div className="mt-0.5 rounded-lg bg-indigo-500/10 p-2 text-indigo-400">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Recommended Clinical Facility
                </span>
                <p className="text-xs font-bold text-white mt-0.5">{result.recommendedFacility}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Severity Meter & Emergency Trigger Box */}
        <div className="flex flex-col justify-between rounded-xl border border-slate-800/90 bg-slate-950/80 p-5">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-semibold">
                <Gauge className="h-4 w-4 text-cyan-400" />
                <span>Acuity Index</span>
              </span>
              <span className={`font-mono text-sm font-bold ${theme.scoreColor}`}>
                {result.triage.score} / 10
              </span>
            </div>

            {/* Severity bar */}
            <div className="mt-2.5 h-2.5 w-full overflow-hidden rounded-full bg-slate-800">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  result.triage.score >= 8
                    ? 'bg-rose-500'
                    : result.triage.score >= 6
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${result.triage.score * 10}%` }}
              />
            </div>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 font-mono">
              <span>Non-Urgent</span>
              <span>Moderate</span>
              <span>Critical</span>
            </div>
          </div>

          {/* Emergency Escalation Trigger */}
          <div className="mt-5">
            {isEmergency ? (
              <button
                onClick={onOpenHotlines}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-3 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-rose-900/50 transition-all hover:bg-rose-500 active:scale-[0.98]"
              >
                <PhoneCall className="h-4 w-4 animate-bounce" />
                <span>Call Emergency Dispatch (911 / 112)</span>
              </button>
            ) : (
              <button
                onClick={onOpenHotlines}
                className="w-full flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              >
                <PhoneCall className="h-4 w-4 text-slate-400" />
                <span>Emergency Hotlines Directory</span>
              </button>
            )}
            <p className="mt-2 text-center text-[10px] text-slate-500">
              Confidence Score: {result.verificationMetadata.confidenceScore}% · Verified Protocol
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
