import React, { useState } from 'react';
import { 
  X, 
  PhoneCall, 
  AlertTriangle, 
  ShieldCheck, 
  Copy, 
  Check, 
  Info, 
  FlaskConical,
  ExternalLink
} from 'lucide-react';
import { handleEmergencyCallAction, copyEmergencyNumber, TelActionResult } from '../utils/emergencyTel';
import { EmergencyDialerButtons } from './EmergencyDialerButtons';

interface EmergencyHotlinesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencyHotlinesModal: React.FC<EmergencyHotlinesModalProps> = ({ isOpen, onClose }) => {
  const [isTestMode, setIsTestMode] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [lastActionResult, setLastActionResult] = useState<TelActionResult | null>(null);

  if (!isOpen) return null;

  const primaryEmergencyNumbers = [
    { 
      number: '911', 
      label: 'Call 911',
      country: 'United States & Canada', 
      service: 'Police, Fire, Emergency Medical Services (EMS)' 
    },
    { 
      number: '112', 
      label: 'Call 112',
      country: 'European Union, India & Global GSM', 
      service: 'Universal Global Emergency Dispatcher' 
    },
  ];

  const additionalHotlines = [
    { country: 'United Kingdom', number: '999', label: 'Call 999', service: '999 (Life-Threatening Emergency Dispatch)' },
    { country: 'India - Direct Medical', number: '108', label: 'Call 108', service: 'National Ambulance & Emergency Transport' },
    { country: 'US Crisis & Suicide Lifeline', number: '988', label: 'Call 988', service: '24/7 Mental Health Crisis Hotline' },
    { country: 'US Poison Control Center', number: '1-800-222-1222', label: 'Call 1-800-222-1222', service: 'Toxic Ingestion / Overdose Triage' },
  ];

  const redFlagSigns = [
    'Crushing chest pressure, left arm or jaw numbness, or sudden shortness of breath',
    'Sudden face drooping, arm weakness, or slurred speech (Stroke F.A.S.T.)',
    'Non-blanching purple/red rash that does NOT fade under glass tumbler with high fever',
    'Severe allergic reaction (throat tightness, lip edema, wheezing, hives)',
    'Uncontrolled arterial bleeding or deep penetrating physical trauma',
    'Sudden severe "thunderclap" headache or loss of consciousness',
  ];

  const handleCall = (number: string, service: string) => {
    const res = handleEmergencyCallAction(number, service, isTestMode);
    setLastActionResult(res);
  };

  const handleCopy = async (number: string) => {
    const success = await copyEmergencyNumber(number);
    if (success) {
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2500);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="emergency-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/85 p-3 sm:p-5 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-2xl rounded-2xl border border-rose-500/40 bg-slate-900 p-5 shadow-2xl shadow-rose-950/60 sm:p-7 max-h-[94vh] flex flex-col">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
          aria-label="Close emergency modal"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-rose-500/20 text-rose-400">
            <PhoneCall className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h2 id="emergency-modal-title" className="text-xl font-black tracking-wide text-white">
              Emergency Services & Telephony Dispatch
            </h2>
            <p className="text-xs text-rose-300">
              Immediate direct emergency calling for life-threatening acute presentations
            </p>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
          {/* Safe Test Mode Switcher */}
          <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <FlaskConical className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Evaluator Safe Test Mode (Simulated Calling)
                </div>
                <div className="text-[11px] text-slate-300 leading-tight">
                  Prevents placing real calls to dispatchers. Validates RFC 3966 <code className="text-amber-200">tel:</code> URI format without dialing emergency services.
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsTestMode(!isTestMode)}
              role="switch"
              aria-checked={isTestMode}
              className={`shrink-0 flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold transition-all ${
                isTestMode 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30' 
                  : 'border border-slate-700 bg-slate-800 text-slate-300 hover:border-slate-600'
              }`}
            >
              <span>{isTestMode ? 'Test Mode: ACTIVE' : 'Test Mode: OFF'}</span>
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${isTestMode ? 'bg-slate-950' : 'bg-slate-500'}`} />
            </button>
          </div>

          {/* Action Feedback Banner (NEVER claims call succeeded) */}
          {lastActionResult && (
            <div className={`rounded-xl border p-3 text-xs ${
              lastActionResult.isTestMode
                ? 'border-amber-500/40 bg-amber-950/40 text-amber-200'
                : 'border-cyan-500/40 bg-cyan-950/40 text-cyan-200'
            }`}>
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <Info className="h-4 w-4" />
                <span>
                  {lastActionResult.isTestMode ? 'Safe Test Mode Verification' : 'Telephony Hand-off Initiated'}
                </span>
              </div>
              <p className="leading-relaxed">{lastActionResult.message}</p>
            </div>
          )}

          {/* Primary Hotlines: 911 and 112 Grid */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-300 mb-2">
              Primary Emergency Dispatch (One-Touch Dial & Copy)
            </div>
            {isTestMode ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {primaryEmergencyNumbers.map((hotline) => (
                  <div 
                    key={hotline.number} 
                    className="flex flex-col justify-between rounded-xl border border-amber-500/40 bg-slate-950/80 p-4 shadow-lg"
                  >
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-black tracking-tight text-white">{hotline.number}</span>
                        <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wide">Test Mode</span>
                      </div>
                      <div className="mt-1 text-xs font-medium text-slate-200">{hotline.country}</div>
                      <div className="mt-0.5 text-[11px] text-slate-400 leading-tight">{hotline.service}</div>
                    </div>
                    <div className="mt-4 flex items-center gap-2">
                      <button
                        onClick={() => handleCall(hotline.number, hotline.country)}
                        aria-label={`Test Call ${hotline.number} in safe test mode`}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-extrabold text-slate-950 transition hover:bg-amber-400 active:scale-95"
                      >
                        <FlaskConical className="h-3.5 w-3.5" />
                        <span>Test {hotline.label}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmergencyDialerButtons showTitle={false} />
            )}
          </div>

          {/* Additional Global & Regional Hotlines */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Additional International Hotlines & Specialized Centers
            </div>
            <div className="space-y-2">
              {additionalHotlines.map((h) => (
                <div
                  key={h.number}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3 transition-colors hover:border-slate-700 hover:bg-slate-900"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-white">{h.country}</span>
                      <span className="font-mono text-xs font-semibold text-rose-300">({h.number})</span>
                    </div>
                    <div className="text-xs text-slate-400">{h.service}</div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {isTestMode ? (
                      <button
                        onClick={() => handleCall(h.number, h.country)}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-amber-500/20 border border-amber-500/40 px-3 py-1.5 text-xs font-bold text-amber-300 hover:bg-amber-500/30"
                      >
                        <FlaskConical className="h-3 w-3" />
                        <span>Test {h.number}</span>
                      </button>
                    ) : (
                      <a
                        href={`tel:${h.number.split(' ')[0]}`}
                        target="_top"
                        rel="noopener noreferrer"
                        onClick={() => {
                          setLastActionResult({
                            telUri: `tel:${h.number.split(' ')[0]}`,
                            number: h.number,
                            isTestMode: false,
                            actionTaken: 'real_dial_attempted',
                            message: 'Your device was asked to open its dialer; this browser may not support calls.',
                            timestamp: new Date().toLocaleTimeString(),
                          });
                        }}
                        className="flex items-center justify-center gap-1.5 rounded-lg bg-rose-600/90 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-rose-500"
                      >
                        <PhoneCall className="h-3 w-3" />
                        <span>{h.label}</span>
                      </a>
                    )}

                    <button
                      onClick={() => handleCopy(h.number)}
                      className="flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
                      title="Copy number"
                    >
                      {copiedNumber === h.number ? (
                        <Check className="h-3.5 w-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="h-3.5 w-3.5 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Browser / Device Limitations Notice */}
          <div className="rounded-xl border border-slate-700 bg-slate-950/60 p-3.5 text-xs text-slate-300 space-y-1.5">
            <div className="flex items-center gap-1.5 font-bold text-slate-200">
              <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0" />
              <span>Browser & Device Telephony Limitations Notice</span>
            </div>
            <p className="text-[11.5px] leading-relaxed text-slate-400">
              Web browsers and desktop computers cannot directly place cellular calls without connected telephony hardware or a VoIP handler. On mobile phones, clicking &ldquo;Call&rdquo; opens your native device phone dialer. On desktop computers or restricted browser sandboxes, please manually dial <strong>911</strong> or <strong>112</strong> on a cellular phone or landline. HealthBridge cannot monitor call connection or dispatch status.
            </p>
          </div>

          {/* Red Flag Checklist */}
          <div className="rounded-xl border border-rose-500/20 bg-rose-950/20 p-3.5">
            <div className="text-xs font-bold text-rose-300 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Immediate Indications for Emergency Dispatch</span>
            </div>
            <ul className="grid grid-cols-1 gap-1 text-[11px] text-slate-300 sm:grid-cols-2">
              {redFlagSigns.map((sign, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  <span>{sign}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-t border-slate-800 pt-3 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>HealthBridge Clinical Safety & Patient Protection Protocol</span>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-2 font-semibold text-slate-200 hover:bg-slate-700"
          >
            Close Window
          </button>
        </div>
      </div>
    </div>
  );
};
