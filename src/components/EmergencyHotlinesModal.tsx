import React from 'react';
import { X, PhoneCall, AlertTriangle, ShieldCheck, ExternalLink } from 'lucide-react';

interface EmergencyHotlinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyHotlinesModal: React.FC<EmergencyHotlinesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const hotlines = [
    { country: 'United States & Canada', number: '911', service: 'Police, Fire, Emergency Medical Services (EMS)' },
    { country: 'European Union & India / Global GSM', number: '112', service: 'Universal Emergency Dispatcher' },
    { country: 'United Kingdom', number: '999 / 111', service: '999 (Life-threatening) / 111 (NHS Urgent Medical)' },
    { country: 'India - Direct Medical', number: '108 / 102', service: 'National Ambulance & Emergency Obstetric Transport' },
    { country: 'United States Crisis & Suicide Lifeline', number: '988', service: '24/7 Free & Confidential Mental Health Support' },
    { country: 'US Poison Control Center', number: '1-800-222-1222', service: 'Immediate Expert Triage for Ingested Toxins / Overdose' },
  ];

  const redFlagSigns = [
    'Crushing chest pressure, left arm or jaw numbness, or sudden shortness of breath',
    'Sudden face drooping, arm weakness, or slurred speech (Stroke F.A.S.T.)',
    'Non-blanching purple/red rash that does NOT fade under a glass tumbler with fever',
    'Severe allergic reaction (throat swelling, lip edema, wheezing, hives)',
    'Uncontrolled arterial bleeding or deep penetrating physical trauma',
    'Sudden severe "thunderclap" headache or loss of consciousness',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl rounded-2xl border border-rose-500/30 bg-slate-900 p-6 shadow-2xl shadow-rose-950/40 sm:p-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
            <PhoneCall className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Emergency Services & Crisis Hotlines</h2>
            <p className="text-xs text-rose-300/80">
              Immediate direct communication for life-threatening acute emergencies
            </p>
          </div>
        </div>

        {/* When to Call Immediately Notice */}
        <div className="mt-5 rounded-xl border border-rose-500/30 bg-rose-950/30 p-4">
          <div className="flex items-center gap-2 text-rose-300 font-semibold text-sm">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Call Immediately If You Observe Any Of These Warning Signs:</span>
          </div>
          <ul className="mt-2.5 grid grid-cols-1 gap-1.5 text-xs text-slate-300 sm:grid-cols-2">
            {redFlagSigns.map((sign, idx) => (
              <li key={idx} className="flex items-start gap-1.5">
                <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                <span>{sign}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Hotline List */}
        <div className="mt-5 max-h-60 overflow-y-auto pr-1">
          <div className="space-y-2.5">
            {hotlines.map((h, i) => (
              <div
                key={i}
                className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-3.5 transition-colors hover:border-slate-700 hover:bg-slate-900"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{h.country}</div>
                  <div className="text-xs text-slate-400">{h.service}</div>
                </div>
                <a
                  href={`tel:${h.number.split(' ')[0]}`}
                  className="flex items-center gap-1.5 rounded-lg bg-rose-600 px-3.5 py-2 text-xs font-bold text-white shadow transition hover:bg-rose-500"
                >
                  <PhoneCall className="h-3.5 w-3.5" />
                  <span>{h.number}</span>
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Footer info */}
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-t border-slate-800 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>HealthBridge prioritizes user safety above all else.</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 font-medium text-slate-200 hover:bg-slate-700"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
