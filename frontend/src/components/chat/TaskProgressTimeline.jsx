import React from 'react';
import { 
  CheckCircle2, 
  CircleDashed, 
  Clock, 
  Shield,
  FileCheck2,
  Terminal,
  Database,
  Cpu
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { WORKFLOW_STAGES } from '../../utils/constants';

export function TaskProgressTimeline({ task }) {
  if (!task) return null;

  const getStageIcon = (stageId) => {
    switch (stageId) {
      case 'UNDERSTAND': return Cpu;
      case 'PLAN': return Terminal;
      case 'APPROVE': return Shield;
      case 'EXECUTE': return CircleDashed;
      case 'VERIFY': return FileCheck2;
      case 'STORE': return Database;
      case 'LEARN': return CheckCircle2;
      default: return Clock;
    }
  };

  return (
    <div className="rounded-2xl bg-[#0F1626] border border-slate-800 p-5 space-y-4 my-4 shadow-lg shadow-black/20">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-100">
            Autonomous Execution Pipeline
          </h3>
          <span className="text-xs text-slate-400 font-mono">({task.id})</span>
        </div>

        <Badge variant={task.type === 'offline' ? 'emerald' : 'cyan'}>
          {task.type === 'offline' ? 'Offline Local Engine' : 'Online Engine'}
        </Badge>
      </div>

      {/* Horizontal Step Pipeline Nodes */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 pt-1 pb-2">
        {WORKFLOW_STAGES.map((stage, idx) => {
          const matchedStep = task.steps?.find(s => s.stage === stage.id);
          const isDone = matchedStep?.status === 'completed';
          const isInProgress = matchedStep?.status === 'in_progress';
          const isRejected = matchedStep?.status === 'rejected';
          const isSkipped = matchedStep?.status === 'skipped';
          const StageIcon = getStageIcon(stage.id);

          return (
            <div
              key={stage.id}
              className={`p-2.5 rounded-xl border text-left transition-all ${
                isDone
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                  : isInProgress
                    ? 'bg-cyan-500/15 border-cyan-400/50 text-cyan-200 ring-1 ring-cyan-500/30 shadow-md shadow-cyan-950/40'
                    : isRejected
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
                      : isSkipped
                        ? 'bg-slate-900/40 border-slate-800/60 text-slate-400 opacity-60'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-mono opacity-60">0{idx + 1}</span>
                <StageIcon className={`w-3.5 h-3.5 ${
                  isInProgress ? 'animate-spin text-cyan-400' : ''
                }`} />
              </div>
              <div className="text-xs font-semibold truncate">{stage.label}</div>
              <div className="text-[10px] capitalize opacity-80 mt-0.5 truncate">
                {isInProgress ? 'Active' : isDone ? 'Done' : isRejected ? 'Rejected' : isSkipped ? 'Skipped' : 'Pending'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Live Log Stream */}
      <div className="rounded-xl bg-[#090D17] border border-slate-800/80 p-3.5 font-mono text-xs space-y-2 max-h-48 overflow-y-auto">
        <div className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800/60 pb-1 flex items-center justify-between">
          <span>Execution Telemetry & State Log</span>
          <span className="text-cyan-400 font-normal lowercase">provider: {task.provider}</span>
        </div>

        {task.steps?.map((step) => {
          if (step.status === 'pending') return null;
          return (
            <div key={step.id} className="flex items-start gap-2.5">
              <span className={`text-[10px] uppercase px-1.5 py-0.5 rounded font-bold shrink-0 ${
                step.status === 'completed'
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/50'
                  : step.status === 'in_progress'
                    ? 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/50 animate-pulse'
                    : step.status === 'rejected'
                      ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                      : 'bg-slate-800 text-slate-400'
              }`}>
                {step.stage}
              </span>
              <p className="text-slate-300 text-xs leading-relaxed">
                {step.message}
              </p>
            </div>
          );
        })}

        {task.verificationDetails && (
          <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-start gap-2 text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block">Post-Execution Verification Passed</span>
              <span className="text-slate-400 text-[11px]">{task.verificationDetails.metrics}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
