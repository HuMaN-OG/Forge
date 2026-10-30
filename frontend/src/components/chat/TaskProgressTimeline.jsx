import React, { useState } from 'react';
import { 
  Check, 
  Loader2, 
  X, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck
} from 'lucide-react';
import { WORKFLOW_STAGES } from '../../utils/constants';

export function TaskProgressTimeline({ task }) {
  const [showLogs, setShowLogs] = useState(true);

  if (!task) return null;

  // Determine current active step index
  const activeStepIdx = task.steps?.findIndex(s => s.status === 'in_progress') ?? -1;
  const currentStep = task.steps?.[activeStepIdx] || task.steps?.[task.steps.length - 1];

  return (
    <div className="rounded-2xl bg-[#0E1017] border border-white/[0.08] overflow-hidden text-xs shadow-xl animate-in fade-in duration-200">
      {/* macOS-style Window Header Bar */}
      <div className="px-4 py-3 bg-[#131620] border-b border-white/[0.06] flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* macOS window dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]/80 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27C93F]/80 inline-block" />
          </div>

          <div className="h-3 w-px bg-white/[0.1] mx-0.5" />

          <div className="flex items-center gap-2">
            <Terminal className="w-3.5 h-3.5 text-sky-400 stroke-[1.8]" />
            <span className="font-semibold text-white text-xs">Runtime Pipeline</span>
            <span className="text-[10px] font-mono text-[#71717A]">#{task.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            task.type === 'offline' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
          }`}>
            {task.type === 'offline' ? 'Offline Sandbox' : 'Online API'}
          </span>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] text-[#A1A1AA] hover:text-white bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] transition-colors"
          >
            <span className="font-mono text-[10px]">Console</span>
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Stepper Pipeline */}
      <div className="p-4 space-y-3">
        <div className="grid grid-cols-7 gap-1.5">
          {WORKFLOW_STAGES.map((stage, idx) => {
            const matchedStep = task.steps?.find(s => s.stage === stage.id);
            const isDone = matchedStep?.status === 'completed';
            const isInProgress = matchedStep?.status === 'in_progress';
            const isRejected = matchedStep?.status === 'rejected';

            return (
              <div
                key={stage.id}
                className={`p-2 rounded-xl border text-left transition-all ${
                  isDone
                    ? 'bg-emerald-500/[0.08] border-emerald-500/25 text-emerald-300'
                    : isInProgress
                      ? 'bg-gradient-to-b from-indigo-500/20 to-sky-500/10 border-sky-400/50 text-white ring-1 ring-sky-400/30 shadow-xs'
                      : isRejected
                        ? 'bg-rose-500/10 border-rose-500/25 text-rose-300'
                        : 'bg-white/[0.02] border-white/[0.04] text-[#52525B]'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-mono opacity-70">0{idx + 1}</span>
                  {isDone ? (
                    <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                  ) : isInProgress ? (
                    <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                  ) : isRejected ? (
                    <X className="w-3 h-3 text-rose-400" />
                  ) : (
                    <span className="w-1.5 h-1.5 rounded-full bg-white/[0.12]" />
                  )}
                </div>
                <div className="text-[11px] font-medium truncate">{stage.label}</div>
              </div>
            );
          })}
        </div>

        {/* Current State Capsule */}
        {currentStep && (
          <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.025] border border-white/[0.05] text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
              <span className="text-[#A1A1AA]">Current Stage:</span>
              <span className="font-semibold text-white uppercase font-mono">{currentStep.stage}</span>
            </div>
            <span className="text-[#71717A] truncate max-w-sm font-sans">{currentStep.message}</span>
          </div>
        )}

        {/* Expandable Live Terminal Log Stream */}
        {showLogs && (
          <div className="rounded-xl bg-black/70 border border-white/[0.06] p-3.5 font-mono text-[11px] space-y-1.5 max-h-48 overflow-y-auto">
            {task.steps?.map((step) => {
              if (step.status === 'pending') return null;
              return (
                <div key={step.id} className="flex items-start gap-2.5 text-[#A1A1AA] leading-relaxed">
                  <span className={`text-[9px] font-mono uppercase px-1.5 py-0.2 rounded font-bold shrink-0 mt-0.5 ${
                    step.status === 'completed'
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                      : step.status === 'in_progress'
                        ? 'bg-indigo-950 text-sky-300 border border-indigo-700/50 animate-pulse'
                        : step.status === 'rejected'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800/40'
                          : 'bg-white/[0.05] text-[#71717A]'
                  }`}>
                    {step.stage}
                  </span>
                  <span className="text-[#EDEDED] flex-1">{step.message}</span>
                </div>
              );
            })}

            {task.verificationDetails && (
              <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-2 text-emerald-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Verification Output: {task.verificationDetails.metrics}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
