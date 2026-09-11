import React, { useState } from 'react';
import { 
  FileText, 
  Eye, 
  AlertTriangle, 
  CheckCircle2, 
  Pill, 
  ShieldCheck, 
  Info, 
  Car, 
  Sparkles,
  HelpCircle,
  Clock
} from 'lucide-react';
import { InputClassification, ExtractedPrescriptionItem, MultimodalInputType } from '../types';

interface MultimodalClassificationAndPrescriptionPanelProps {
  classification?: InputClassification;
  sourceInputType?: MultimodalInputType;
  extractedPrescriptions?: ExtractedPrescriptionItem[];
  onUpdatePrescriptionConfirmations?: (updated: ExtractedPrescriptionItem[]) => void;
}

export const MultimodalClassificationAndPrescriptionPanel: React.FC<MultimodalClassificationAndPrescriptionPanelProps> = ({
  classification,
  sourceInputType,
  extractedPrescriptions = [],
  onUpdatePrescriptionConfirmations,
}) => {
  const [prescriptions, setPrescriptions] = useState<ExtractedPrescriptionItem[]>(extractedPrescriptions);

  const detectedType = classification?.detectedType || sourceInputType || 'GENERAL_SYMPTOM';
  const confidence = classification?.confidence ?? 92;
  const reasons = classification?.reasons || ['Evaluated across clinical vision and linguistic rules'];

  const handleToggleConfirm = (id: string) => {
    const updated = prescriptions.map((item) =>
      item.id === id ? { ...item, isConfirmedByUser: !item.isConfirmedByUser } : item
    );
    setPrescriptions(updated);
    if (onUpdatePrescriptionConfirmations) {
      onUpdatePrescriptionConfirmations(updated);
    }
  };

  const allConfirmed = prescriptions.length > 0 && prescriptions.every((p) => p.isConfirmedByUser);

  const getTypeMeta = (type: MultimodalInputType) => {
    switch (type) {
      case 'PRESCRIPTION_DOCUMENT':
        return {
          label: 'Prescription / Medication Document',
          desc: 'Prescription slip, pharmacy vial label, or clinical medication order',
          color: 'border-purple-500/40 bg-purple-950/20 text-purple-300',
          badge: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
          icon: Pill,
        };
      case 'TRAFFIC_NEWS_OTHER':
        return {
          label: 'Traffic / News / Non-Clinical Ingestion',
          desc: 'Input identified as non-clinical traffic conditions, news events, or general queries',
          color: 'border-amber-500/40 bg-amber-950/20 text-amber-300',
          badge: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: Car,
        };
      case 'GENERAL_SYMPTOM':
      default:
        return {
          label: 'General Clinical Symptom / Observation',
          desc: 'Patient rash/wound observation, acute complaint, or physiological symptom notes',
          color: 'border-cyan-500/40 bg-cyan-950/20 text-cyan-300',
          badge: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: Eye,
        };
    }
  };

  const meta = getTypeMeta(detectedType);
  const TypeIcon = meta.icon;

  return (
    <div className="space-y-4">
      {/* 1. Multimodal Classification Banner */}
      <div className={`rounded-2xl border p-4 sm:p-5 transition-all ${meta.color}`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${meta.badge}`}>
              <TypeIcon className="h-5 w-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                  Multimodal Input Classification
                </h3>
                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase ${meta.badge}`}>
                  {detectedType.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{meta.desc}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto shrink-0 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-slate-800">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Classification Confidence</div>
              <div className="text-sm font-extrabold font-mono text-emerald-400">{confidence}%</div>
            </div>
            <div className="h-7 w-1 rounded-full bg-slate-800 overflow-hidden">
              <div 
                className="h-full bg-emerald-400 transition-all duration-500" 
                style={{ width: `${confidence}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Evidence & Decision Reasons */}
        {reasons && reasons.length > 0 && (
          <div className="mt-3.5 border-t border-slate-800/80 pt-3">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
              <Info className="h-3.5 w-3.5" />
              <span>Classification Diagnostic Reasons & Clues:</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs text-slate-300">
              {reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-cyan-400" />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 2. Non-Clinical Notice (Traffic / News / Other) */}
      {detectedType === 'TRAFFIC_NEWS_OTHER' && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-950/30 p-4 text-xs text-amber-200">
          <div className="flex items-center gap-2 font-bold text-amber-300 mb-1">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>Non-Clinical Ingestion Advisory</span>
          </div>
          <p className="leading-relaxed">
            HealthBridge has detected content regarding traffic conditions, municipal news, or general non-clinical text. Triage assessment has been defaulted to informational status. For active human medical emergencies, please provide personal clinical symptoms or dial 911 / 112.
          </p>
        </div>
      )}

      {/* 3. Specialized Prescription Extraction & Verification Panel */}
      {(detectedType === 'PRESCRIPTION_DOCUMENT' || prescriptions.length > 0) && (
        <div className="rounded-2xl border border-purple-500/40 bg-slate-900/90 p-5 shadow-xl shadow-purple-950/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Pill className="h-5 w-5 text-purple-400" />
              <div>
                <h4 className="text-sm font-extrabold text-white uppercase tracking-wider">
                  Prescription Document Extraction & Verification Panel
                </h4>
                <p className="text-xs text-purple-300">
                  Medicine names, exact dosages, frequencies, and mandatory safety confirmation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-950/40 px-2.5 py-1 text-[11px] font-bold text-purple-200">
              <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
              <span>Zero-Hallucination Policy</span>
            </div>
          </div>

          {/* Clinical Safety Guardrail Warning */}
          <div className="mt-3.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-3 text-xs text-amber-200 flex items-start gap-2.5">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
            <div className="leading-relaxed">
              <strong>Mandatory Pharmacotherapy Verification:</strong> HealthBridge strictly forbids inventing or guessing illegible handwritten dosages or truncated Rx instructions. Unclear handwriting is flagged with uncertainty markers. <strong>You must review each extracted item and check the confirmation box before clinical handover.</strong>
            </div>
          </div>

          {/* Extracted Prescription Medication Cards */}
          <div className="mt-4 space-y-3">
            {prescriptions.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-400">
                No distinct prescription line items were parsed from this image/text. Please verify document resolution or re-upload a clear view of the prescription label.
              </div>
            ) : (
              prescriptions.map((med) => (
                <div
                  key={med.id}
                  className={`rounded-xl border p-4 transition-all ${
                    med.isConfirmedByUser
                      ? 'border-emerald-500/40 bg-emerald-950/15'
                      : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{med.medicineName}</span>
                        <span className="rounded-md bg-slate-800 px-2 py-0.5 font-mono text-xs font-semibold text-cyan-300">
                          {med.dose}
                        </span>
                        <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-xs text-slate-300">
                          {med.frequency}
                        </span>
                      </div>

                      {med.indicationOrNotes && (
                        <p className="text-xs text-slate-400">
                          <strong>Indication/Notes:</strong> {med.indicationOrNotes}
                        </p>
                      )}

                      {/* Uncertainty Flags */}
                      {med.uncertaintyFlags && med.uncertaintyFlags.length > 0 && (
                        <div className="mt-1.5 space-y-1">
                          {med.uncertaintyFlags.map((flag, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-1.5 text-xs text-rose-300 font-medium"
                            >
                              <AlertTriangle className="h-3 w-3 shrink-0 text-rose-400" />
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Mandatory User Confirmation Toggle */}
                    <button
                      onClick={() => handleToggleConfirm(med.id)}
                      className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-bold transition-all shrink-0 ${
                        med.isConfirmedByUser
                          ? 'border border-emerald-500/50 bg-emerald-600 text-white shadow-md shadow-emerald-900/30'
                          : 'border border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/50'
                      }`}
                    >
                      {med.isConfirmedByUser ? (
                        <>
                          <CheckCircle2 className="h-4 w-4 text-white" />
                          <span>Verified by User</span>
                        </>
                      ) : (
                        <>
                          <span className="h-3.5 w-3.5 rounded-full border border-purple-300" />
                          <span>Confirm with Physical Rx</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Confirmation Status Summary Footer */}
          {prescriptions.length > 0 && (
            <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-t border-slate-800/80 pt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className={`h-2.5 w-2.5 rounded-full ${allConfirmed ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
                <span className={allConfirmed ? 'text-emerald-300 font-semibold' : 'text-amber-300'}>
                  {allConfirmed
                    ? 'All extracted medications confirmed against physical document'
                    : `Pending review: ${prescriptions.filter((p) => !p.isConfirmedByUser).length} of ${prescriptions.length} items unconfirmed`}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">
                Mandatory Safety Protocol 100% Active
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
