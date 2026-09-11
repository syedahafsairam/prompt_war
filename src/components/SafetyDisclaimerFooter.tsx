import React from 'react';
import { ShieldCheck, HeartPulse, Award, Info } from 'lucide-react';

export const SafetyDisclaimerFooter: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-slate-800/80 bg-slate-950 py-10 text-xs text-slate-400">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Hackathon Alignment */}
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Award className="h-4 w-4 text-cyan-400" />
              <span>PromptWars x Techverse</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Built as a universal bridge between messy human health intent and complex healthcare/societal systems. Powered by Gemini 3.8 Multimodal AI with structured clinical action output.
            </p>
          </div>

          {/* Safety & SAMD Compliance */}
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Clinical Decision Support Framework</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              Implements structured SBAR (Situation, Background, Assessment, Recommendation) clinician handover protocols, automated red-flag triage screening, and non-blanching rash / cardiac emergency escalations.
            </p>
          </div>

          {/* Regulatory & Safety Notice */}
          <div>
            <div className="flex items-center gap-2 text-slate-200 font-bold">
              <Info className="h-4 w-4 text-amber-400" />
              <span>Medical Safety & Triage Notice</span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              HealthBridge is an informational clinical decision support tool and patient communication bridge. It does not replace emergency medical response or formal diagnostic evaluation. In life-threatening emergencies, dial 911 / 112 immediately.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-slate-900 pt-6 text-[11px] text-slate-600 sm:flex-row">
          <p>© 2026 HealthBridge Clinical Action Engine · PromptWars Hackathon Edition</p>
          <div className="flex items-center gap-4">
            <span>Powered by Gemini 3.8 Flash</span>
            <span>•</span>
            <span>Client-Safe Multimodal Full-Stack Architecture</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
