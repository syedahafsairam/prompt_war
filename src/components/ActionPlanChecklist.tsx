import React, { useState } from 'react';
import { CheckCircle2, Circle, ListOrdered, CheckSquare, Shield, AlertCircle, Heart } from 'lucide-react';
import { ActionStep } from '../types';

interface ActionPlanChecklistProps {
  steps: ActionStep[];
}

export const ActionPlanChecklist: React.FC<ActionPlanChecklistProps> = ({ steps }) => {
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});

  const toggleStep = (id: string) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const completedCount = Object.values(completedSteps).filter(Boolean).length;
  const progressPercent = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'FIRST_AID':
        return 'First Aid & Stabilization';
      case 'LOGISTICS':
        return 'Transport & Documentation';
      case 'MEDICATION_SAFETY':
        return 'Medication Safety';
      default:
        return 'Vital Signs Monitoring';
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <ListOrdered className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Prioritized Clinical Action Protocol</h3>
            <p className="text-xs text-slate-400">
              Check off verified life-saving steps in real-time as you or caregivers execute them
            </p>
          </div>
        </div>

        {/* Progress Tracker */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs font-bold text-emerald-400">
              {completedCount} of {steps.length} Steps Done
            </span>
            <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-800">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Step List */}
      <div className="mt-5 space-y-3">
        {steps.map((step, idx) => {
          const isDone = Boolean(completedSteps[step.id]);

          return (
            <div
              key={step.id || idx}
              onClick={() => toggleStep(step.id)}
              className={`group flex cursor-pointer items-start gap-3.5 rounded-xl border p-4 transition-all ${
                isDone
                  ? 'border-emerald-500/40 bg-emerald-950/15 opacity-75'
                  : 'border-slate-800 bg-slate-950/70 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <button
                type="button"
                className="mt-0.5 text-slate-400 transition-colors group-hover:text-emerald-400"
                aria-label={isDone ? 'Mark uncompleted' : 'Mark completed'}
              >
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : (
                  <Circle className="h-5 w-5 text-slate-500" />
                )}
              </button>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-800 text-[11px] font-bold text-slate-300">
                    {idx + 1}
                  </span>
                  <h4
                    className={`text-sm font-bold ${
                      isDone ? 'line-through text-slate-400' : 'text-slate-100'
                    }`}
                  >
                    {step.title}
                  </h4>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-extrabold tracking-wider uppercase ${getPriorityStyle(
                      step.priority
                    )}`}
                  >
                    {step.priority}
                  </span>
                  <span className="rounded-md bg-slate-800/80 px-2 py-0.5 text-[10px] text-slate-400">
                    {getCategoryLabel(step.category)}
                  </span>
                </div>

                <p
                  className={`mt-1.5 text-xs leading-relaxed ${
                    isDone ? 'text-slate-500' : 'text-slate-300'
                  }`}
                >
                  {step.instruction}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
