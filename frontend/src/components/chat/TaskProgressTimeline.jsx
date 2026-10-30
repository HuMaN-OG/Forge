import React from 'react';
import { Check, Loader2, X, Minus, Terminal, CheckCircle2 } from 'lucide-react';
import { WORKFLOW_STAGES } from '../../utils/constants';

export function TaskProgressTimeline({ task }) {
  if (!task) return null;

  return (
    <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 space-y-3.5 my-3 text-xs">
      {/* Title & Environment Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-[#77D9E8] stroke-[1.75]" />
          <span className="font-semibold text-[#F1F3F5] text-xs">Autonomous Pipeline</span>
          <span className="text-[10px] font-mono text-[#687180]">#{task.id}</span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-[#929AA8]">
          <span>{task.provider || 'Ollama (Local)'}</span>
          <span className="text-[#687180]">&bull;</span>
          <span className={task.type === 'offline' ? 'text-emerald-400' : 'text-[#77D9E8]'}>
            {task.type === 'offline' ? 'Offline' : 'Online'}
          </span>
        </div>
      </div>

      {/* Refined Segmented Progress Bar */}
      <div className="grid grid-cols-7 gap-1.5 py-1">
        {WORKFLOW_STAGES.map((stage) => {
          const matchedStep = task.steps?.find(s => s.stage === stage.id);
          const isDone = matchedStep?.status === 'completed';
          const isInProgress = matchedStep?.status === 'in_progress';
          const isRejected = matchedStep?.status === 'rejected';

          return (
            <div
              key={stage.id}
              className={`px-2 py-1.5 rounded-md border text-left transition-all ${
                isDone
                  ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-emerald-300'
                  : isInProgress
                    ? 'bg-[#77D9E8]/10 border-[#77D9E8]/30 text-[#77D9E8]'
                    : isRejected
                      ? 'bg-rose-500/[0.06] border-rose-500/20 text-rose-300'
                      : 'bg-white/[0.02] border-white/[0.04] text-[#687180]'
              }`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-[9px] font-mono tracking-tight uppercase opacity-70">
                  {stage.label.slice(0, 3)}
                </span>
                {isDone ? (
                  <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[2.5]" />
                ) : isInProgress ? (
                  <Loader2 className="w-2.5 h-2.5 animate-spin text-[#77D9E8]" />
                ) : isRejected ? (
                  <X className="w-2.5 h-2.5 text-rose-400" />
                ) : (
                  <Minus className="w-2 h-2 text-[#687180]" />
                )}
              </div>
              <div className="text-[10px] font-medium truncate">{stage.label}</div>
            </div>
          );
        })}
      </div>

      {/* Execution Telemetry Log Stream */}
      <div className="rounded-lg bg-black/40 border border-white/[0.04] p-3 font-mono text-[11px] space-y-1.5 max-h-40 overflow-y-auto">
        {task.steps?.map((step) => {
          if (step.status === 'pending') return null;
          return (
            <div key={step.id} className="flex items-start gap-2 text-[#929AA8] leading-relaxed">
              <span className={`text-[9px] uppercase px-1 py-0.2 rounded font-bold shrink-0 mt-0.5 ${
                step.status === 'completed'
                  ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/40'
                  : step.status === 'in_progress'
                    ? 'bg-[#162030] text-[#77D9E8] border border-[#77D9E8]/30'
                    : step.status === 'rejected'
                      ? 'bg-rose-950/70 text-rose-400 border border-rose-800/40'
                      : 'bg-white/[0.05] text-[#687180]'
              }`}>
                {step.stage}
              </span>
              <span className="text-[#D1D5DB] flex-1">{step.message}</span>
            </div>
          );
        })}

        {task.verificationDetails && (
          <div className="mt-2 pt-2 border-t border-white/[0.05] flex items-center gap-2 text-emerald-300 text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Verified: {task.verificationDetails.metrics}</span>
          </div>
        )}
      </div>
    </div>
  );
}
