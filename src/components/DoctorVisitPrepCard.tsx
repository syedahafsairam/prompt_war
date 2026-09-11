import React from 'react';
import { HelpCircle, Pill, Activity, ShieldAlert, HeartPulse, CheckSquare } from 'lucide-react';
import { MedicationDetection, VitalSignMetric } from '../types';

interface DoctorVisitPrepCardProps {
  questions: string[];
  medications: MedicationDetection[];
  vitals: VitalSignMetric[];
}

export const DoctorVisitPrepCard: React.FC<DoctorVisitPrepCardProps> = ({
  questions,
  medications,
  vitals,
}) => {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Questions for Doctor */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
        <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
            <HelpCircle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Questions to Ask Your Provider</h3>
            <p className="text-[11px] text-slate-400">
              Empowering patient questions to ask during examination or discharge
            </p>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {questions.map((q, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-xs text-slate-200"
            >
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-cyan-500/20 text-[10px] font-bold text-cyan-300">
                ?
              </span>
              <span className="leading-relaxed">{q}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Medication Safety & Vital Monitoring */}
      <div className="space-y-6">
        {/* Medication Alerts if detected */}
        {medications && medications.length > 0 && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/15 p-5 shadow-xl backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-2.5 border-b border-amber-500/20 pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/20 text-amber-400">
                <Pill className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Parsed Medication Cautions</h3>
                <p className="text-[11px] text-amber-300/80">
                  Dosage verification and potential drug-drug interaction alerts
                </p>
              </div>
            </div>

            <div className="mt-3.5 space-y-2.5">
              {medications.map((med, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-amber-500/30 bg-slate-950/80 p-3 text-xs"
                >
                  <div className="font-bold text-amber-200">{med.name}</div>
                  <div className="mt-1 text-slate-300">{med.notes}</div>
                  {med.cautionaryWarning && (
                    <div className="mt-2 rounded-lg bg-rose-950/40 p-2 font-medium text-rose-300 text-[11px] flex items-center gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
                      <span>{med.cautionaryWarning}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vital Signs to Watch */}
        {vitals && vitals.length > 0 && (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
            <div className="flex items-center gap-2.5 border-b border-slate-800 pb-3.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400">
                <Activity className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Vital Signs to Monitor</h3>
                <p className="text-[11px] text-slate-400">
                  Target thresholds to watch at home or in transit to clinic
                </p>
              </div>
            </div>

            <div className="mt-3.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              {vitals.map((v, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-800 bg-slate-950/70 p-3"
                >
                  <div className="text-xs font-bold text-slate-200">{v.metric}</div>
                  <div className="mt-1 flex items-center justify-between text-[11px] font-mono">
                    <span className="text-slate-400">Normal: {v.normalRange}</span>
                    <span className="text-rose-400 font-bold">Alert: {v.warningThreshold}</span>
                  </div>
                  <div className="mt-1 text-[11px] text-slate-400">{v.instruction}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
