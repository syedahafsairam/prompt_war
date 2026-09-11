import React, { useState, useEffect, useRef } from 'react';
import { 
  HeartPulse, 
  Sparkles, 
  ArrowDown, 
  RotateCcw, 
  AlertCircle, 
  CheckCircle2, 
  Printer, 
  Copy, 
  ShieldAlert, 
  Clock, 
  ChevronRight,
  Stethoscope
} from 'lucide-react';
import { Navbar } from './components/Navbar';
import { InputPanel } from './components/InputPanel';
import { ProcessingPipeline } from './components/ProcessingPipeline';
import { TriageHeroBanner } from './components/TriageHeroBanner';
import { RedFlagsCard } from './components/RedFlagsCard';
import { SBARHandoverCard } from './components/SBARHandoverCard';
import { ActionPlanChecklist } from './components/ActionPlanChecklist';
import { DoctorVisitPrepCard } from './components/DoctorVisitPrepCard';
import { EmergencyHotlinesModal } from './components/EmergencyHotlinesModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { JudgeDemoModal } from './components/JudgeDemoModal';
import { SafetyDisclaimerFooter } from './components/SafetyDisclaimerFooter';
import { PrintableSBARDocumentModal } from './components/PrintableSBARDocumentModal';
import { MultimodalClassificationAndPrescriptionPanel } from './components/MultimodalClassificationAndPrescriptionPanel';
import { ClinicalAnalysisResult, SampleCase } from './types';
import { SAMPLE_CASES } from './data/sampleCases';
import { getTriageRepository } from './repository/triageRepository';
import { openPrintWindowOrFallback } from './utils/printHandover';

export default function App() {
  const [currentResult, setCurrentResult] = useState<ClinicalAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isHotlinesOpen, setIsHotlinesOpen] = useState<boolean>(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isJudgeDemoOpen, setIsJudgeDemoOpen] = useState<boolean>(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState<boolean>(false);
  const [isPopupBlocked, setIsPopupBlocked] = useState<boolean>(false);
  const [history, setHistory] = useState<ClinicalAnalysisResult[]>([]);

  const resultsRef = useRef<HTMLDivElement>(null);
  const repo = getTriageRepository();

  // Load history from repository on initial mount
  useEffect(() => {
    async function loadStoredHistory() {
      try {
        const records = await repo.getAll();
        setHistory(records);
      } catch (e) {
        console.warn('Failed to load local history from repository', e);
      }
    }
    loadStoredHistory();
  }, []);

  // Save history via repository abstraction
  const saveToHistory = async (item: ClinicalAnalysisResult) => {
    try {
      await repo.save(item);
      const updated = await repo.getAll();
      setHistory(updated);
    } catch (e) {
      console.warn('Failed to persist history via repository', e);
      setHistory((prev) => [item, ...prev.filter((p) => p.id !== item.id)].slice(0, 20));
    }
  };

  const handleClearHistory = async () => {
    try {
      await repo.clear();
      setHistory([]);
    } catch (e) {
      console.warn('Failed to clear history via repository', e);
      setHistory([]);
    }
  };

  // 1-Click Complete System Reset
  const handleResetAll = async () => {
    setCurrentResult(null);
    setErrorMessage(null);
    setIsLoading(false);
    await handleClearHistory();
    setIsJudgeDemoOpen(false);
  };

  // Trigger analysis call to server
  const handleAnalyze = async (payload: {
    text: string;
    image?: { data: string; mimeType: string };
    audio?: { data: string; mimeType: string; duration?: number; name?: string };
    urgencyHint?: string;
  }) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/analyze-health-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data: ClinicalAnalysisResult = await response.json();
      setCurrentResult(data);
      await saveToHistory(data);

      // Scroll smoothly to output
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 250);
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setErrorMessage(err.message || 'An unexpected error occurred while analyzing health input.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPresetCase = (c: SampleCase, autoRun = false) => {
    if (autoRun) {
      handleAnalyze({
        text: c.rawText,
        image: c.imageDataUri ? { data: c.imageDataUri, mimeType: 'image/jpeg' } : undefined,
        urgencyHint: c.category,
      });
    }
  };

  const handlePrint = () => {
    if (!currentResult) return;
    const outcome = openPrintWindowOrFallback(currentResult);
    if (outcome.isPopupBlocked) {
      setIsPopupBlocked(true);
      setIsPrintModalOpen(true);
    } else {
      setIsPopupBlocked(false);
      setIsPrintModalOpen(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Navbar
        onOpenHotlines={() => setIsHotlinesOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenJudgeDemo={() => setIsJudgeDemoOpen(true)}
        historyCount={history.length}
      />

      {/* Main Container */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header Hero Title */}
        <div className="mb-8 text-center sm:text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300 mb-3">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Universal Healthcare Bridge · Gemini 3.8 Multimodal</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Bridging Messy Human Symptoms to Verified Clinical Action
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Upload frantic symptom notes, messy photos of rashes, or confusing prescriptions. HealthBridge rapidly structures your inputs into life-saving triage decisions, standardized SBAR hospital handover notes, and prioritized step-by-step action plans.
          </p>
        </div>

        {/* Top Section: Input Panel & Live Pipeline View */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
          {/* Left Column: Input Form (Takes 7 or 8 columns on large screens) */}
          <div className={`${isLoading ? 'lg:col-span-6' : currentResult ? 'lg:col-span-5' : 'lg:col-span-8 lg:col-start-3'}`}>
            <InputPanel onAnalyze={handleAnalyze} isLoading={isLoading} />
          </div>

          {/* Right Column: Processing Pipeline when Loading, or Quick Guidance */}
          {isLoading && (
            <div className="lg:col-span-6">
              <ProcessingPipeline isLoading={isLoading} />
            </div>
          )}

          {/* If not loading and has current result in two-column split on desktop */}
          {!isLoading && currentResult && (
            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="rounded-2xl border border-slate-800/80 bg-slate-900/40 p-6 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                    <span>Clinical Action Plan Ready</span>
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">
                    ID: {currentResult.id}
                  </span>
                </div>

                <h3 className="mt-2 text-xl font-bold text-white">
                  {currentResult.triage.title}
                </h3>
                <p className="mt-2 text-xs text-slate-300 leading-relaxed line-clamp-3">
                  {currentResult.triage.rationale}
                </p>

                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => resultsRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow transition-all hover:bg-cyan-500"
                  >
                    <span>View Full Clinical Action Card</span>
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>

                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3.5 py-2.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>Print Handover Sheet</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Error Alert Display */}
        {errorMessage && (
          <div className="mt-6 rounded-xl border border-rose-500/50 bg-rose-950/40 p-4 text-rose-200 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-sm font-bold">Analysis System Notice</h4>
              <p className="text-xs text-rose-300/90 mt-1">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Structured Action Plan Output Card Section */}
        {currentResult && (
          <div ref={resultsRef} className="mt-12 space-y-8 scroll-mt-6">
            {/* Section Header Divider */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 font-bold text-xs">
                  02
                </span>
                <h2 className="text-lg font-bold tracking-tight text-white">
                  Verified Clinical Action Plan & Hospital Handover
                </h2>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Processed at {new Date(currentResult.timestamp).toLocaleTimeString()} · Protocol v4.2
              </span>
            </div>

            {/* 1. Triage Urgency Hero Banner */}
            <TriageHeroBanner
              result={currentResult}
              onOpenHotlines={() => setIsHotlinesOpen(true)}
              onPrint={handlePrint}
            />

            {/* 1b. Multimodal Classification & Medication Extraction Verification Panel */}
            <MultimodalClassificationAndPrescriptionPanel
              classification={currentResult.inputClassification}
              sourceInputType={currentResult.sourceInputType}
              extractedPrescriptions={currentResult.extractedPrescriptions}
              onUpdatePrescriptionConfirmations={(updated) => {
                setCurrentResult((prev) => (prev ? { ...prev, extractedPrescriptions: updated } : null));
              }}
            />

            {/* 2. Red-Flag Warnings & Contraindications */}
            <RedFlagsCard
              redFlags={currentResult.redFlags}
              whatToAvoid={currentResult.patientSummary.whatToAvoid}
            />

            {/* 3. Healthcare System SBAR Bridge (Handover for Doctors/Nurses vs Patient View) */}
            <SBARHandoverCard
              sbar={currentResult.sbar}
              plainEnglishSummary={currentResult.patientSummary.plainEnglish}
              keyFindings={currentResult.patientSummary.keyFindings}
            />

            {/* 4. Prioritized Step-by-Step Action Plan Checklist */}
            <ActionPlanChecklist steps={currentResult.actionSteps} />

            {/* 5. Doctor Visit Preparation, Medication Checks & Vital Thresholds */}
            <DoctorVisitPrepCard
              questions={currentResult.questionsForDoctor}
              medications={currentResult.prescriptionsOrMedsDetected}
              vitals={currentResult.vitalSignsToWatch}
            />
          </div>
        )}
      </main>

      {/* Emergency Global Hotlines Modal */}
      <EmergencyHotlinesModal
        isOpen={isHotlinesOpen}
        onClose={() => setIsHotlinesOpen(false)}
      />

      {/* Triage History Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectResult={(item) => {
          setCurrentResult(item);
          setTimeout(() => {
            resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }, 150);
        }}
        onClearHistory={handleClearHistory}
      />

      {/* Dedicated Printable SBAR Handover Document Modal (Print & Inline Fallback) */}
      {currentResult && (
        <PrintableSBARDocumentModal
          isOpen={isPrintModalOpen}
          onClose={() => setIsPrintModalOpen(false)}
          result={currentResult}
          isPopupBlocked={isPopupBlocked}
        />
      )}

      {/* Evaluator Guide & Judge Demo Hub Modal */}
      <JudgeDemoModal
        isOpen={isJudgeDemoOpen}
        onClose={() => setIsJudgeDemoOpen(false)}
        onSelectCase={handleSelectPresetCase}
        onResetAll={handleResetAll}
      />

      {/* Footer with safety protocols & Hackathon attribution */}
      <SafetyDisclaimerFooter />
    </div>
  );
}
