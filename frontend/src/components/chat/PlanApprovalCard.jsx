import React from 'react';
import { ShieldAlert, CheckCircle2, XCircle, Wrench } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export function PlanApprovalCard({ task, onApprove, onReject }) {
  if (!task || !task.approvalDetails) return null;

  const isPending = task.status === 'waiting_approval';
  const isApproved = task.approvalStatus === 'approved';
  const isRejected = task.approvalStatus === 'rejected';

  return (
    <div className="my-5 rounded-2xl bg-gradient-to-b from-[#141C2E] to-[#0E1524] border-2 border-amber-500/40 p-5 shadow-xl shadow-amber-950/20">
      {/* Header Banner */}
      <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-700/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Action Authorization Required
            </h3>
            <p className="text-xs text-slate-400">
              Human-in-the-loop permission gate for computer-use execution
            </p>
          </div>
        </div>

        <Badge
          variant={isPending ? 'amber' : isApproved ? 'emerald' : 'rose'}
          className="text-xs py-1"
        >
          {isPending ? 'Pending Authorization' : isApproved ? 'Authorized by Operator' : 'Authorization Rejected'}
        </Badge>
      </div>

      {/* Action Details Grid */}
      <div className="py-4 space-y-3">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
            <Wrench className="w-3.5 h-3.5" />
            <span>Target Tool & Operation</span>
          </div>
          <p className="text-sm font-mono text-slate-200 pl-5">
            {task.approvalDetails.action}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-semibold text-slate-400 block mb-1">Expected Outcome</span>
            <p className="text-slate-300 leading-relaxed">
              {task.approvalDetails.target}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="font-semibold text-slate-400 block mb-1">Safety & Risk Level</span>
            <div className="flex items-center gap-1.5 text-slate-300">
              <span className={`inline-block w-2 h-2 rounded-full ${task.type === 'offline' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              <span>{task.approvalDetails.riskLevel}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Restricted to permitted local workspace folder. No system files touched.
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-800/30 text-xs text-cyan-200">
          <strong>Notice:</strong> FORGE will not proceed with this tool invocation until you grant explicit authorization below.
        </div>
      </div>

      {/* Action Controls */}
      {isPending && (
        <div className="pt-3 border-t border-slate-700/60 flex items-center justify-end gap-3">
          <Button
            variant="danger"
            size="md"
            icon={XCircle}
            onClick={() => onReject('Declined by user')}
          >
            Decline & Abort
          </Button>

          <Button
            variant="primary"
            size="md"
            icon={CheckCircle2}
            onClick={onApprove}
            className="glow-cyan-pulse"
          >
            Authorize & Execute
          </Button>
        </div>
      )}

      {isApproved && (
        <div className="pt-2 text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="w-4 h-4" />
          <span>Execution permitted by operator. Step is currently running or completed.</span>
        </div>
      )}

      {isRejected && (
        <div className="pt-2 text-xs text-rose-400 flex items-center gap-1.5 font-medium">
          <XCircle className="w-4 h-4" />
          <span>Execution was safely denied by operator. No files or system state were altered.</span>
        </div>
      )}
    </div>
  );
}
