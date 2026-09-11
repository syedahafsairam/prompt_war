import React from 'react';
import { 
  Printer, 
  X, 
  AlertTriangle, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileText,
  Clock,
  ArrowDown
} from 'lucide-react';
import { ClinicalAnalysisResult } from '../types';

interface PrintableSBARDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: ClinicalAnalysisResult;
  isPopupBlocked?: boolean;
}

export const PrintableSBARDocumentModal: React.FC<PrintableSBARDocumentModalProps> = ({
  isOpen,
  onClose,
  result,
  isPopupBlocked = false,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const dateFormatted = new Date(result.timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
  });

  const sourceInputKey = result.sourceInputType || result.inputClassification?.detectedType;
  let sourceDisplay = 'Clinical Narrative Notes';
  if (sourceInputKey === 'PRESCRIPTION_DOCUMENT') {
    sourceDisplay = 'Prescription / Medication Document';
  } else if (sourceInputKey === 'GENERAL_SYMPTOM') {
    sourceDisplay = result.hasImage ? 'General Symptom / Multimodal Photo' : 'General Symptom Notes';
  } else if (sourceInputKey === 'TRAFFIC_NEWS_OTHER') {
    sourceDisplay = 'Traffic / News / Other (Non-Clinical)';
  } else if (result.hasImage) {
    sourceDisplay = 'Multimodal Medical Visual';
  }

  const handlePrint = () => {
    window.print();
  };

  const handleCopyText = () => {
    const handoverText = `HEALTHBRIDGE CLINICAL SBAR HANDOVER
ID: ${result.id}
TIMESTAMP: ${dateFormatted}
SOURCE INPUT: ${sourceDisplay}
URGENCY: ${result.triage.level.replace('_', ' ')} (Severity: ${result.triage.score}/10) - ${result.triage.timeframe}
SPECIALTY: ${result.targetSpecialty} | FACILITY: ${result.recommendedFacility}

SITUATION:
${result.sbar.situation}

BACKGROUND:
${result.sbar.background}

ASSESSMENT:
${result.sbar.assessment}

RECOMMENDATION:
${result.sbar.recommendation}

WARNINGS & RED FLAGS:
${result.redFlags.map(rf => `- ${rf.title}: ${rf.criticalWarning} (Mitigation: ${rf.immediateMitigation})`).join('\n')}

WHAT TO AVOID:
${result.patientSummary?.whatToAvoid?.map(w => `- ${w}`).join('\n') || 'None'}

VITAL TRIGGERS:
${result.sbar.vitalTriggers.join(', ')}

MEDICATIONS / DRUG INTERACTIONS:
${result.prescriptionsOrMedsDetected.map(m => `- ${m.name}: ${m.notes}`).join('\n')}
`;
    navigator.clipboard.writeText(handoverText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="printable-sbar-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-3 sm:p-5 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Controls Header (Hidden in Print via CSS) */}
        <div className="no-print flex items-center justify-between border-b border-slate-800 bg-slate-950 px-5 py-3.5">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400">
              <Printer className="h-4 w-4" />
            </span>
            <div>
              <h2 id="printable-sbar-title" className="text-sm font-bold text-white">
                Dedicated Clinical Handover Sheet (Print Preview & Fallback)
              </h2>
              <p className="text-xs text-slate-400">
                SBAR protocol format for triage nurses, EMS responders, and attending physicians
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyText}
              className="flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-slate-800 hover:text-white"
              title="Copy plain text SBAR handover to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5 text-slate-400" />}
              <span>{copied ? 'Copied' : 'Copy Text'}</span>
            </button>

            <button
              onClick={handlePrint}
              aria-label="Print SBAR Handover Sheet to physical printer or PDF"
              className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-cyan-900/30 transition-all hover:bg-cyan-500 active:scale-95"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Document</span>
            </button>

            <button
              onClick={onClose}
              aria-label="Close print preview modal"
              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Popup Blocked Notification Notice */}
        {isPopupBlocked && (
          <div className="no-print border-b border-amber-500/30 bg-amber-950/40 px-5 py-2.5 text-xs text-amber-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400" />
            <span>
              <strong>Popup Blocked Notice:</strong> Your browser or iframe prevented opening a new print window. Your dedicated print-ready SBAR sheet is rendered below. Click <strong>Print Document</strong> to send to your printer or PDF.
            </span>
          </div>
        )}

        {/* Dedicated Printable SBAR Paper Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-950/40">
          <div
            id="printable-sbar-document"
            className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 sm:p-10 text-slate-900 shadow-xl"
          >
            {/* Header Document Grid */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h1 className="text-xl font-extrabold uppercase tracking-wide text-slate-950">
                    HealthBridge Clinical Handover
                  </h1>
                  <p className="text-xs font-medium text-slate-600 uppercase tracking-wider mt-0.5">
                    Universal SBAR Triage Protocol · Clinical Decision Support Sheet
                  </p>
                </div>
                <div className="text-left sm:text-right text-xs text-slate-600 font-mono">
                  <div><strong>Record ID:</strong> {result.id}</div>
                  <div><strong>Date/Time:</strong> {dateFormatted}</div>
                  <div><strong>Input Source:</strong> {sourceDisplay}</div>
                  <div><strong>Specialty Target:</strong> {result.targetSpecialty}</div>
                </div>
              </div>
            </div>

            {/* Urgency Acuity Banner */}
            <div className={`mt-4 rounded-lg border-2 p-3.5 ${
              result.triage.level === 'EMERGENCY_RED'
                ? 'border-rose-600 bg-rose-50 text-rose-950'
                : result.triage.level === 'URGENT_AMBER'
                ? 'border-amber-600 bg-amber-50 text-amber-950'
                : 'border-emerald-600 bg-emerald-50 text-emerald-950'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-black uppercase tracking-wider">
                  TRIAGE: {result.triage.level.replace('_', ' ')} · Severity {result.triage.score}/10
                </span>
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded border border-current">
                  Timeframe: {result.triage.timeframe}
                </span>
              </div>
              <p className="mt-1 text-xs leading-relaxed text-slate-800">
                <strong>{result.triage.title}</strong> — {result.triage.rationale}
              </p>
            </div>

            {/* Warnings & Contraindications Box */}
            {((result.redFlags && result.redFlags.length > 0) || (result.patientSummary?.whatToAvoid && result.patientSummary.whatToAvoid.length > 0)) && (
              <div className="mt-4 rounded-lg border-l-4 border-rose-600 bg-rose-50 p-3.5 text-xs text-rose-950">
                <div className="font-extrabold uppercase tracking-wider text-rose-900 mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>Critical Clinical Warnings & Contraindications (Immediate Action)</span>
                </div>
                {result.redFlags && result.redFlags.length > 0 && (
                  <ul className="list-disc pl-4 space-y-1 mb-2 text-rose-900">
                    {result.redFlags.map((rf) => (
                      <li key={rf.id}>
                        <strong>RED FLAG: {rf.title}:</strong> {rf.criticalWarning} (Immediate Mitigation: {rf.immediateMitigation})
                      </li>
                    ))}
                  </ul>
                )}
                {result.patientSummary?.whatToAvoid && result.patientSummary.whatToAvoid.length > 0 && (
                  <div>
                    <div className="font-bold text-rose-950 uppercase text-[11px] mt-1 mb-0.5">
                      Contraindications / Strictly What Patient Must NOT Do:
                    </div>
                    <ul className="list-disc pl-4 space-y-0.5 text-rose-900 text-[11.5px]">
                      {result.patientSummary.whatToAvoid.map((w, idx) => (
                        <li key={idx}>{w}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* SBAR 4-Quadrant Clinical Grid */}
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Situation */}
              <div className="rounded-lg border border-slate-300 p-3 bg-white">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-rose-700 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-rose-600 text-[11px] font-bold text-white">
                    S
                  </span>
                  <span>Situation (Acute Chief Event)</span>
                </div>
                <p className="font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {result.sbar.situation}
                </p>
              </div>

              {/* Background */}
              <div className="rounded-lg border border-slate-300 p-3 bg-white">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-amber-700 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-amber-600 text-[11px] font-bold text-white">
                    B
                  </span>
                  <span>Background & Comorbidities</span>
                </div>
                <p className="font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {result.sbar.background}
                </p>
              </div>

              {/* Assessment */}
              <div className="rounded-lg border border-slate-300 p-3 bg-white">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-sky-700 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-sky-600 text-[11px] font-bold text-white">
                    A
                  </span>
                  <span>Clinical Assessment & Differential</span>
                </div>
                <p className="font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {result.sbar.assessment}
                </p>
              </div>

              {/* Recommendation */}
              <div className="rounded-lg border border-slate-300 p-3 bg-white">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase text-emerald-700 mb-1">
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-emerald-600 text-[11px] font-bold text-white">
                    R
                  </span>
                  <span>Recommendation & Requested Diagnostics</span>
                </div>
                <p className="font-mono text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                  {result.sbar.recommendation}
                </p>
              </div>
            </div>

            {/* Vital Signs Thresholds */}
            {result.sbar.vitalTriggers && result.sbar.vitalTriggers.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs">
                <div className="font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Critical Vital Sign Escalation Thresholds:
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.sbar.vitalTriggers.map((v, i) => (
                    <span key={i} className="rounded border border-slate-300 bg-white px-2 py-0.5 font-mono font-semibold text-rose-800">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Extracted Prescriptions / Drug Interactions */}
            {result.extractedPrescriptions && result.extractedPrescriptions.length > 0 && (
              <div className="mt-4 rounded-lg border border-slate-300 bg-slate-50 p-3 text-xs">
                <div className="font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Extracted Prescription Medication Items (Strict Non-Hallucination Policy):
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse font-sans text-xs">
                    <thead>
                      <tr className="border-b border-slate-300 bg-slate-200/70">
                        <th className="p-1.5 font-bold">Medicine</th>
                        <th className="p-1.5 font-bold">Dose</th>
                        <th className="p-1.5 font-bold">Frequency</th>
                        <th className="p-1.5 font-bold">Uncertainty Flags</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.extractedPrescriptions.map((med) => (
                        <tr key={med.id} className="border-b border-slate-200">
                          <td className="p-1.5 font-semibold text-slate-900">{med.medicineName}</td>
                          <td className="p-1.5 font-mono text-slate-800">{med.dose}</td>
                          <td className="p-1.5 text-slate-800">{med.frequency}</td>
                          <td className="p-1.5 text-rose-700 text-[11px]">
                            {med.uncertaintyFlags.length > 0 ? med.uncertaintyFlags.join('; ') : 'None (Legible)'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Clinician Sign-off Footer */}
            <div className="mt-8 border-t border-dashed border-slate-400 pt-4 text-xs text-slate-600">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <div className="h-6 border-b border-slate-500 mb-1"></div>
                  <div className="font-semibold">Attending Clinician / Triage Nurse Name</div>
                </div>
                <div>
                  <div className="h-6 border-b border-slate-500 mb-1"></div>
                  <div className="font-semibold">Professional License / Badge #</div>
                </div>
                <div>
                  <div className="h-6 border-b border-slate-500 mb-1"></div>
                  <div className="font-semibold">Time & Date of Handover Acknowledgment</div>
                </div>
              </div>
            </div>

            {/* SaMD Legal Disclaimer */}
            <div className="mt-6 border-t border-slate-200 pt-3 text-[10px] leading-relaxed text-slate-500 text-justify">
              <strong>HealthBridge Decision Support Notice:</strong> This synthesized SBAR handover document is generated to augment human medical communication and triage workflow. It does not replace independent clinical evaluation or licensed medical diagnosis. For life-threatening emergencies, dial 911 or 112 immediately.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
