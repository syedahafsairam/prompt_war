import React from 'react';
import { AlertOctagon, ShieldAlert, Ban, CheckCircle2, AlertTriangle } from 'lucide-react';
import { RedFlagAlert } from '../types';

interface RedFlagsCardProps {
  redFlags: RedFlagAlert[];
  whatToAvoid: string[];
}

export const RedFlagsCard: React.FC<RedFlagsCardProps> = ({ redFlags, whatToAvoid }) => {
  if ((!redFlags || redFlags.length === 0) && (!whatToAvoid || whatToAvoid.length === 0)) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 backdrop-blur-sm sm:p-6">
      <div className="flex items-center gap-2.5 border-b border-rose-500/20 pb-3.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/20 text-rose-400">
          <AlertOctagon className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white">Critical Red-Flag Warnings & Safety Bounds</h3>
          <p className="text-xs text-rose-300/80">Immediate clinical rule-outs and contraindicated behaviors</p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        {/* Identified Red Flags */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
            <ShieldAlert className="h-4 w-4" />
            <span>High-Risk Clinical Indicators ({redFlags.length})</span>
          </span>

          {redFlags.map((flag) => (
            <div
              key={flag.id}
              className="rounded-xl border border-rose-500/30 bg-slate-950/70 p-3.5 shadow-sm"
            >
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-xs font-bold text-rose-200">{flag.title}</h4>
                <span className="shrink-0 rounded bg-rose-500/20 px-1.5 py-0.5 text-[10px] font-bold text-rose-300">
                  CRITICAL
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-300 font-medium">
                <span className="text-slate-400">Trigger: </span>
                {flag.riskFactor}
              </p>
              <div className="mt-2 rounded-lg bg-rose-950/40 p-2 text-[11px] text-rose-300">
                <span className="font-semibold">Action: </span>
                {flag.immediateMitigation}
              </div>
            </div>
          ))}
        </div>

        {/* Contraindicated Behaviors (What to Avoid) */}
        <div className="space-y-3">
          <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
            <Ban className="h-4 w-4" />
            <span>Contraindicated Actions (Strictly Avoid)</span>
          </span>

          <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4 space-y-2.5">
            {whatToAvoid.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                <div className="mt-0.5 rounded-full bg-rose-500/20 p-0.5 text-rose-400 shrink-0">
                  <Ban className="h-3 w-3" />
                </div>
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
