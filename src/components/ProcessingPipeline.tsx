import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, 
  Loader2, 
  AlertOctagon, 
  BrainCircuit, 
  FileCheck, 
  ShieldCheck, 
  Activity 
} from 'lucide-react';

interface ProcessingPipelineProps {
  isLoading: boolean;
}

export const ProcessingPipeline: React.FC<ProcessingPipelineProps> = ({ isLoading }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Signal Ingestion & Feature Extraction',
      description: 'Multimodal OCR parsing of uploaded photo, symptoms, and vital thresholds',
      icon: Activity,
    },
    {
      title: 'Red-Flag Acute Safety Screen',
      description: 'Rule-out checks for Anaphylaxis, Acute Coronary Syndrome, Stroke FAST, and Sepsis',
      icon: AlertOctagon,
    },
    {
      title: 'Gemini 3.8 Clinical Entity Extraction',
      description: 'Deep medical reasoning, timeline correlation, and differential context formulation',
      icon: BrainCircuit,
    },
    {
      title: 'Standardized SBAR Handover Compilation',
      description: 'Translating human intent into structured Situation, Background, Assessment, Recommendation',
      icon: FileCheck,
    },
    {
      title: 'Clinical Safety Protocol Verification',
      description: 'Cross-validating first aid safety steps, contraindications, and specialist routing',
      icon: ShieldCheck,
    },
  ];

  useEffect(() => {
    if (!isLoading) {
      setCurrentStep(0);
      return;
    }

    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 900);

    return () => clearInterval(interval);
  }, [isLoading, steps.length]);

  if (!isLoading) return null;

  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-slate-900/80 p-6 shadow-2xl backdrop-blur-md">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400">
            <Activity className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">
              Real-Time Clinical Processing Pipeline
            </h3>
            <p className="text-xs text-slate-400">
              Transforming messy inputs into verified clinical action steps
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-3 py-1 text-xs font-semibold text-cyan-300">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Analyzing</span>
        </div>
      </div>

      <div className="mt-6 space-y-4">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const StepIcon = step.icon;

          return (
            <div
              key={index}
              className={`flex items-start gap-3.5 rounded-xl border p-3.5 transition-all ${
                isCurrent
                  ? 'border-cyan-500/50 bg-cyan-950/30 ring-1 ring-cyan-500/30'
                  : isCompleted
                  ? 'border-slate-800 bg-slate-950/40 text-slate-300'
                  : 'border-slate-800/40 bg-slate-950/20 text-slate-600'
              }`}
            >
              <div className="mt-0.5 shrink-0">
                {isCompleted ? (
                  <CheckCircle className="h-5 w-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                ) : (
                  <StepIcon className="h-5 w-5 text-slate-600" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <h4
                    className={`text-sm font-semibold ${
                      isCurrent
                        ? 'text-cyan-200'
                        : isCompleted
                        ? 'text-slate-200'
                        : 'text-slate-500'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <span className="text-[11px] font-mono text-slate-500">
                    Step {index + 1} of {steps.length}
                  </span>
                </div>
                <p
                  className={`text-xs mt-0.5 ${
                    isCurrent
                      ? 'text-cyan-300/80'
                      : isCompleted
                      ? 'text-slate-400'
                      : 'text-slate-600'
                  }`}
                >
                  {step.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
