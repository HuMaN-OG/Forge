import React from 'react';
import { ShieldAlert, CheckCircle, XCircle, Wrench, Lock } from 'lucide-react';

export function PlanApprovalCard({ task, onApprove, onReject }) {
  if (!task || !task.approvalDetails) return null;

  const isPending = task.status === 'waiting_approval';
  const isApproved = task.approvalStatus === 'approved';
  const isRejected = task.approvalStatus === 'rejected';

  return (
    <div className="my-5 rounded-2xl forge-glass-floating border border-amber-500/35 p-6 shadow-2xl animate-in fade-in duration-200 text-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center shrink-0 shadow-sm">
            <ShieldAlert className="w-5 h-5 stroke-[2]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white tracking-tight">
              Action Authorization Required
            </h3>
            <p className="text-[12px] text-[#A1A1AA] mt-0.5">
              Human-in-the-loop permission gate for local computer automation
            </p>
          </div>
        </div>

        <span className={`text-[11px] font-medium px-3 py-1 rounded-full border ${
          isPending 
            ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' 
            : isApproved 
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
        }`}>
          {isPending ? 'Pending Your Approval' : isApproved ? 'Authorized by Operator' : 'Denied by Operator'}
        </span>
      </div>

      {/* Main Action Specification */}
      <div className="py-4 space-y-3.5">
        <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#A1A1AA] font-medium flex items-center gap-2">
              <Wrench className="w-3.5 h-3.5 text-sky-400" />
              <span>Target Tool & Operation</span>
            </span>
            <span className="font-mono text-sky-400 text-[11px] bg-sky-950/60 px-2 py-0.5 rounded border border-sky-500/25">
              {task.plannedTool}
            </span>
          </div>
          <p className="text-sm font-mono text-white pl-5 font-semibold">
            {task.approvalDetails.action}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[11px] font-medium text-[#71717A] uppercase tracking-wider block">Expected Impact</span>
            <p className="text-[#D4D4D8] leading-relaxed">
              {task.approvalDetails.target}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
            <span className="text-[11px] font-medium text-[#71717A] uppercase tracking-wider block">Security & Sandbox</span>
            <div className="flex items-center gap-1.5 text-[#D4D4D8]">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              <span>{task.approvalDetails.riskLevel}</span>
            </div>
            <p className="text-[11px] text-[#71717A] mt-1">
              Actions are restricted to permitted local workspace directories. No system configuration or passwords modified.
            </p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {isPending && (
        <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
          <span className="text-xs text-[#71717A]">
            Execution is suspended until you grant permission.
          </span>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onReject('Declined by operator')}
              className="px-4 py-2 rounded-xl text-xs font-medium text-rose-300 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all duration-150 cursor-pointer active:scale-95"
            >
              Decline & Cancel
            </button>

            <button
              onClick={onApprove}
              className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-500 to-sky-600 hover:from-emerald-400 hover:to-sky-500 shadow-md shadow-sky-950/40 border border-sky-400/40 transition-all duration-150 cursor-pointer active:scale-95 flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 stroke-[2.2]" />
              <span>Authorize & Run</span>
            </button>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="pt-2 text-xs text-emerald-400 flex items-center gap-2 font-medium">
          <CheckCircle className="w-4 h-4 stroke-[2]" />
          <span>Execution authorized by operator. Proceeding through verification pipeline.</span>
        </div>
      )}

      {isRejected && (
        <div className="pt-2 text-xs text-rose-400 flex items-center gap-2 font-medium">
          <XCircle className="w-4 h-4 stroke-[2]" />
          <span>Execution safely declined by operator. Workspace preserved with zero changes.</span>
        </div>
      )}
    </div>
  );
}
