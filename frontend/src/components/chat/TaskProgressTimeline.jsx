import React, { useState } from 'react';
import { 
  Check, 
  Loader2, 
  X, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  ShieldCheck, 
  Sparkles
} from 'lucide-react';
import { WORKFLOW_STAGES } from '../../utils/constants';

export function TaskProgressTimeline({ task }) {
  const [showLogs, setShowLogs] = useState(true);

  if (!task) return null;

  return (
    <div className="rounded-2xl bg-[#11131B] border border-white/[0.08] p-5 space-y-4 my-4 text-xs shadow-lg">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="font-semibold text-white text-xs">Autonomous Pipeline Execution</h4>
            <span className="text-[11px] text-[#71717A] font-mono">Task ID: #{task.id}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
            task.type === 'offline' 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
          }`}>
            {task.type === 'offline' ? 'Offline Local Engine' : 'Online API'}
          </span>

          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] text-[#A1A1AA] hover:text-white bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] transition-colors"
          >
            <Terminal className="w-3 h-3 text-sky-400" />
            <span>Logs</span>
            {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Stepper Progress Nodes */}
      <div className="grid grid-cols-7 gap-2 py-1">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const matchedStep = task.steps?.find(s => s.stage === stage.id);
          const isDone = matchedStep?.status === 'completed';
          const isInProgress = matchedStep?.status === 'in_progress';
          const isRejected = matchedStep?.status === 'rejected';

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isDone
                  ? 'bg-emerald-500/[0.08] border-emerald-500/20 text-emerald-300'
                  : isInProgress
                    ? 'bg-indigo-500/15 border-indigo-400/40 text-indigo-200 ring-1 ring-indigo-500/30 shadow-sm'
                    : isRejected
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-300'
                      : 'bg-white/[0.02] border-white/[0.04] text-[#52525B]'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono opacity-70">0{idx + 1}</span>
                {isDone ? (
                  <Check className="w-3 h-3 text-emerald-400 stroke-[2.5]" />
                ) : isInProgress ? (
                  <Loader2 className="w-3 h-3 animate-spin text-sky-400" />
                ) : isRejected ? (
                  <X className="w-3 h-3 text-rose-400" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/[0.15]" />
                )}
              </div>
              <div className="text-[11px] font-medium truncate">{stage.label}</div>
              <div className="text-[9px] font-mono opacity-60 capitalize mt-0.5">
                {isInProgress ? 'Running' : isDone ? 'Done' : isRejected ? 'Declined' : 'Pending'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Expandable Live Terminal Output */}
      {showLogs && (
        <div className="rounded-xl bg-black/60 border border-white/[0.06] p-3.5 font-mono text-[11px] space-y-2 max-h-48 overflow-y-auto">
          <div className="text-[10px] text-[#71717A] uppercase tracking-wider font-semibold border-b border-white/[0.05] pb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>Real-time Runtime Console</span>
            </span>
            <span>Ollama Inference</span>
          </div>

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
                <span className="text-[#E4E4E7] flex-1">{step.message}</span>
              </div>
            );
          })}

          {task.verificationDetails && (
            <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center gap-2 text-emerald-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Verified Checksum: {task.verificationDetails.metrics}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
