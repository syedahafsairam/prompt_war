import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldAlert,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Activity,
  ArrowRight,
  Terminal,
  Cpu,
  Brain,
  FileCheck2,
  Stethoscope,
  Info,
  ExternalLink,
} from 'lucide-react';
import { SAMPLE_CASES } from '../data/sampleCases';
import { ClinicalAnalysisResult, SampleCase } from '../types';
import { runHealthBridgeTestSuite, TestSuiteReport } from '../tests/triage.test';

interface JudgeDemoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCase: (c: SampleCase, autoRun?: boolean) => void;
  onResetAll: () => void;
}

export const JudgeDemoModal: React.FC<JudgeDemoModalProps> = ({
  isOpen,
  onClose,
  onSelectCase,
  onResetAll,
}) => {
  const [activeTab, setActiveTab] = useState<'CASES' | 'ARCHITECTURE' | 'TESTS'>('CASES');
  const [testReport, setTestReport] = useState<TestSuiteReport | null>(null);
  const [isRunningTests, setIsRunningTests] = useState(false);

  if (!isOpen) return null;

  const handleExecuteTests = async () => {
    setIsRunningTests(true);
    try {
      const report = await runHealthBridgeTestSuite();
      setTestReport(report);
    } catch (err) {
      console.error('In-browser test run error:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="judge-demo-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-4 backdrop-blur-md overflow-y-auto"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-2xl border border-cyan-500/30 bg-slate-900 shadow-2xl shadow-cyan-950/40 text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-blue-600/30 text-cyan-300 border border-cyan-500/40">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="judge-demo-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                  HealthBridge · PromptWars Evaluator Hub
                </h2>
                <span className="rounded bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 uppercase tracking-wide border border-cyan-500/30">
                  Judge Demo
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Universal Bridge between Messy Human Intent and Hospital Clinical Systems
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close judge demo modal"
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Regulatory & Scope Callout */}
        <div className="flex items-center justify-between gap-3 border-b border-amber-500/30 bg-amber-950/30 px-5 py-2.5 text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-400 shrink-0" />
            <span>
              <strong>Clinical Decision Support (CDS) Notice:</strong> Formatted for triage priority & hospital handoffs, not autonomous medical diagnosis.
            </span>
          </div>
          <button
            onClick={onResetAll}
            aria-label="Reset entire application to pristine state"
            className="flex items-center gap-1 shrink-0 rounded bg-slate-800 px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:bg-slate-700 hover:text-white transition focus-visible:ring-1 focus-visible:ring-amber-400 focus-visible:outline-none"
          >
            <RotateCcw className="h-3 w-3" />
            <span>1-Click Reset</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('CASES')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 transition ${
              activeTab === 'CASES'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="h-4 w-4" />
            <span>Evaluation Preset Cases ({SAMPLE_CASES.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('ARCHITECTURE')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 transition ${
              activeTab === 'ARCHITECTURE'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>How This Works & Gemini Architecture</span>
          </button>
          <button
            onClick={() => setActiveTab('TESTS')}
            className={`flex items-center gap-2 border-b-2 py-3 px-3 transition ${
              activeTab === 'TESTS'
                ? 'border-cyan-400 text-cyan-300'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Terminal className="h-4 w-4" />
            <span>Automated Test Suite (19 Tests)</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* TAB 1: PRESET CASES */}
          {activeTab === 'CASES' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <h3 className="text-sm font-bold text-white">Select a Clinical Scenario for Immediate Evaluation</h3>
                  <p className="text-xs text-slate-400">
                    Each preset case represents a distinct clinical challenge: Acute Coronary, Pediatric Petechiae, Drug Interaction, or Diabetic Foot Complication.
                  </p>
                </div>
                <span className="text-[11px] font-mono text-cyan-400/90 bg-cyan-950/60 px-2.5 py-1 rounded border border-cyan-800/60 shrink-0">
                  Deterministic fallback verified
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {SAMPLE_CASES.map((sc) => (
                  <div
                    key={sc.id}
                    className="flex flex-col justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition-all hover:border-cyan-500/50 hover:bg-slate-900"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`rounded px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide border ${sc.badgeColor}`}
                        >
                          {sc.tag}
                        </span>
                        <span className="text-[11px] text-slate-400 font-medium">
                          {sc.category}
                        </span>
                      </div>

                      <h4 className="mt-2 text-sm font-bold text-white">{sc.title}</h4>
                      <p className="mt-1 text-xs text-slate-300 leading-relaxed line-clamp-3">
                        {sc.description}
                      </p>

                      <div className="mt-3 rounded-lg bg-slate-900/90 p-2.5 text-[11px] text-slate-400 border border-slate-800">
                        <strong className="text-slate-300 block mb-0.5">Clinical Red Flag Screen:</strong>
                        <span className="line-clamp-2">{sc.hint}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-end gap-2 pt-3 border-t border-slate-800/80">
                      <button
                        onClick={() => {
                          onSelectCase(sc, false);
                          onClose();
                        }}
                        className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:outline-none"
                      >
                        Populate Input
                      </button>
                      <button
                        onClick={() => {
                          onSelectCase(sc, true);
                          onClose();
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md hover:bg-cyan-500 transition focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                      >
                        <Play className="h-3 w-3 fill-current" />
                        <span>Run Full Triage</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: ARCHITECTURE & HOW THIS WORKS */}
          {activeTab === 'ARCHITECTURE' && (
            <div className="space-y-6 text-xs text-slate-300 leading-relaxed">
              {/* Core Concept */}
              <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-cyan-300">
                  <Brain className="h-4 w-4" />
                  <span>The Problem: Human Fear vs. Clinical Precision</span>
                </div>
                <p className="mt-2">
                  When health crises occur, patients provide messy, frantic, and emotional descriptions (e.g., "my chest feels weird like an elephant", "toddler has purple rash that doesn’t fade"). Emergency doctors and triage nurses, on the other hand, require standardized, actionable data structured into the universal hospital <strong>SBAR</strong> (Situation, Background, Assessment, Recommendation) handover framework.
                </p>
                <p className="mt-2">
                  HealthBridge serves as the <strong>intelligent cognitive bridge</strong> between the two.
                </p>
              </div>

              {/* Gemini 3.8 Multimodal Workflow */}
              <div className="space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-cyan-400" />
                  <span>Google Gemini 3.8 Multimodal Action Engine</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <div className="text-cyan-400 font-bold mb-1">1. Multimodal Intake</div>
                    <p className="text-slate-400">
                      Accepts unstructured text, photos of dermatological lesions, and medicine labels simultaneously via Gemini inline data buffers.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <div className="text-cyan-400 font-bold mb-1">2. Clinical Safety Guardrails</div>
                    <p className="text-slate-400">
                      System instructions enforce medical knowledge bases: AHA Acute Coronary Syndrome criteria, pediatric non-blanching glass tests, and Beers criteria.
                    </p>
                  </div>
                  <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
                    <div className="text-cyan-400 font-bold mb-1">3. Deterministic Fallback</div>
                    <p className="text-slate-400">
                      If Gemini API is offline or unkeyed, our deterministic local rule engine triggers instantaneously, ensuring zero user abandonment.
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety & Compliance */}
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileCheck2 className="h-4 w-4 text-emerald-400" />
                  <span>SaMD (Software as a Medical Device) Safety Standards</span>
                </h4>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li><strong>Zero PII Logging:</strong> Patient text and image payloads are sanitized and never written to server console logs.</li>
                  <li><strong>Red-Flag Precedence:</strong> Critical life threats immediately override routine recommendations, activating 911/112 emergency routing.</li>
                  <li><strong>Hospital Handover:</strong> Synthesizes medical-grade SBAR with vitals triggers for immediate presentation to receiving emergency teams.</li>
                  <li><strong>Decision Support Distinction:</strong> Explicitly marked as decision support to prevent false diagnostic security.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: AUTOMATED TEST SUITE */}
          {activeTab === 'TESTS' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <div>
                  <h4 className="text-sm font-bold text-white">Full-Stack Test Runner</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Covers Triage Reducer, Urgency Mapping, Persistence Adapter, Malformed Input, and Fallback Behavior.
                  </p>
                  <p className="text-xs font-mono text-cyan-400 mt-1">
                    Terminal command: <code className="bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">npm test</code>
                  </p>
                </div>
                <button
                  onClick={handleExecuteTests}
                  disabled={isRunningTests}
                  className="flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-bold text-white shadow hover:bg-cyan-500 disabled:opacity-50 transition shrink-0 focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:outline-none"
                >
                  <Terminal className="h-4 w-4" />
                  <span>{isRunningTests ? 'Running Suite...' : 'Run Automated Tests'}</span>
                </button>
              </div>

              {testReport && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/80 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      <span className="text-xs font-bold text-white">
                        {testReport.passed}/{testReport.total} Tests Passed
                      </span>
                      {testReport.failed > 0 && (
                        <span className="text-xs font-bold text-rose-400">
                          ({testReport.failed} failed)
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Total Execution Time: {testReport.durationMs}ms
                    </span>
                  </div>

                  <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">
                    {testReport.results.map((r) => (
                      <div
                        key={r.id}
                        className={`flex items-center justify-between rounded-lg p-2.5 border ${
                          r.passed
                            ? 'border-emerald-500/20 bg-emerald-950/20 text-emerald-200'
                            : 'border-rose-500/30 bg-rose-950/30 text-rose-200'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {r.passed ? (
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                          ) : (
                            <AlertTriangle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                          )}
                          <span className="font-semibold text-slate-300">[{r.suite}]</span>
                          <span className="line-clamp-1">{r.name}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 shrink-0 ml-2">
                          {r.durationMs}ms
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-800 bg-slate-950/90 px-5 py-3 text-xs text-slate-400">
          <span>PromptWars x Techverse · Production Build</span>
          <button
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700 hover:text-white transition focus-visible:ring-1 focus-visible:ring-cyan-400 focus-visible:outline-none"
          >
            Close Evaluator Hub
          </button>
        </div>
      </div>
    </div>
  );
};
