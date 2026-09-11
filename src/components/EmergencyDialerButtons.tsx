import React, { useState } from 'react';
import { PhoneCall, Copy, Check, Info } from 'lucide-react';
import { copyEmergencyNumber } from '../utils/emergencyTel';

export interface EmergencyDialerButtonsProps {
  className?: string;
  showTitle?: boolean;
  onActivated?: (number: '911' | '112') => void;
}

export const EmergencyDialerButtons: React.FC<EmergencyDialerButtonsProps> = ({
  className = '',
  showTitle = true,
  onActivated,
}) => {
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [dialerNotice, setDialerNotice] = useState<string | null>(null);

  const handleLinkActivation = (number: '911' | '112') => {
    // CRITICAL: Do NOT call e.preventDefault() or e.stopPropagation()
    // Mobile browsers rely on unrestricted top-level navigation to trigger telephony
    setDialerNotice('Your device was asked to open its dialer; this browser may not support calls.');
    if (onActivated) {
      onActivated(number);
    }
  };

  const handleCopy = async (number: '911' | '112') => {
    const success = await copyEmergencyNumber(number);
    if (success) {
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(null), 2500);
    }
  };

  return (
    <div
      id="emergency-dialer-buttons-container"
      className={`rounded-xl border border-rose-500/50 bg-slate-950/90 p-4 shadow-xl shadow-rose-950/30 ${className}`}
    >
      {showTitle && (
        <div className="flex items-center justify-between mb-3 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500/20 text-rose-400">
              <PhoneCall className="h-3.5 w-3.5 animate-pulse" />
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-rose-200">
              Immediate Emergency Dispatch
            </span>
          </div>
          <span className="text-[10px] font-bold text-rose-400/80 uppercase tracking-wider">
            Mobile 1-Touch
          </span>
        </div>
      )}

      {/* Grid of 911 and 112 Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {/* 911 Call & Copy Unit */}
        <div className="flex items-stretch gap-1.5 rounded-lg border border-rose-500/40 bg-slate-900/90 p-1.5">
          <a
            id="emergency-call-911-anchor"
            href="tel:911"
            target="_top"
            rel="noopener noreferrer"
            onClick={() => handleLinkActivation('911')}
            aria-label="Call 911 Emergency Services"
            className="flex-1 flex items-center justify-center gap-2 rounded-md bg-rose-600 px-3 py-2.5 text-xs font-black text-white shadow-md shadow-rose-950/40 transition hover:bg-rose-500 active:scale-[0.98] text-center no-underline"
          >
            <PhoneCall className="h-4 w-4 shrink-0" />
            <span className="tracking-wide">Call 911</span>
          </a>

          <button
            type="button"
            id="emergency-copy-911-button"
            onClick={() => handleCopy('911')}
            aria-label="Copy 911 emergency number to clipboard"
            title="Copy 911 to clipboard"
            className="flex items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white shrink-0 active:scale-95"
          >
            {copiedNumber === '911' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px]">Copy 911</span>
              </>
            )}
          </button>
        </div>

        {/* 112 Call & Copy Unit */}
        <div className="flex items-stretch gap-1.5 rounded-lg border border-rose-500/40 bg-slate-900/90 p-1.5">
          <a
            id="emergency-call-112-anchor"
            href="tel:112"
            target="_top"
            rel="noopener noreferrer"
            onClick={() => handleLinkActivation('112')}
            aria-label="Call 112 Emergency Services"
            className="flex-1 flex items-center justify-center gap-2 rounded-md bg-rose-600 px-3 py-2.5 text-xs font-black text-white shadow-md shadow-rose-950/40 transition hover:bg-rose-500 active:scale-[0.98] text-center no-underline"
          >
            <PhoneCall className="h-4 w-4 shrink-0" />
            <span className="tracking-wide">Call 112</span>
          </a>

          <button
            type="button"
            id="emergency-copy-112-button"
            onClick={() => handleCopy('112')}
            aria-label="Copy 112 emergency number to clipboard"
            title="Copy 112 to clipboard"
            className="flex items-center justify-center gap-1 rounded-md border border-slate-700 bg-slate-800/90 px-2.5 py-2 text-xs font-semibold text-slate-300 transition hover:bg-slate-700 hover:text-white shrink-0 active:scale-95"
          >
            {copiedNumber === '112' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-[11px] font-bold text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-[11px]">Copy 112</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Neutral Post-Activation Notice */}
      {dialerNotice && (
        <div
          id="emergency-dialer-neutral-notice"
          role="status"
          aria-live="polite"
          className="mt-3 flex items-start gap-2 rounded-lg border border-cyan-500/30 bg-cyan-950/40 p-2.5 text-xs text-cyan-200"
        >
          <Info className="h-4 w-4 shrink-0 text-cyan-400 mt-0.5" />
          <p className="leading-relaxed">{dialerNotice}</p>
        </div>
      )}
    </div>
  );
};
