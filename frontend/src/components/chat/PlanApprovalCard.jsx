import React from 'react';
import { ShieldAlert, CheckCircle, XCircle, Wrench, Lock } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export function PlanApprovalCard({ task, onApprove, onReject }) {
  if (!task || !task.approvalDetails) return null;

  const isPending = task.status === 'waiting_approval';
  const isApproved = task.approvalStatus === 'approved';
  const isRejected = task.approvalStatus === 'rejected';

  return (
    <div className="my-4 rounded-xl forge-glass-floating border border-amber-500/30 p-5 shadow-2xl animate-in fade-in duration-200 text-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 pb-3.5 border-b border-white/[0.06]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4 stroke-[1.75]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#F1F3F5] tracking-tight">
              Action Authorization Required
            </h3>
            <p className="text-[11px] text-[#687180] mt-0.5">
              Human-in-the-loop permission gate for autonomous computer-use
            </p>
          </div>
        </div>

        <Badge
          variant={isPending ? 'amber' : isApproved ? 'emerald' : 'rose'}
          dot
          className="text-[10px]"
        >
          {isPending ? 'Pending Decision' : isApproved ? 'Authorized' : 'Denied'}
        </Badge>
      </div>

      {/* Target & Details Matrix */}
      <div className="py-3.5 space-y-3">
        <div className="p-3 rounded-lg bg-black/40 border border-white/[0.05] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#687180] font-medium flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5 text-[#77D9E8] stroke-[1.75]" />
              <span>Target Tool & Operation</span>
            </span>
            <span className="font-mono text-[#77D9E8] text-[10px]">{task.plannedTool}</span>
          </div>
          <p className="text-xs font-mono text-[#F1F3F5] pl-5">
            {task.approvalDetails.action}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
            <span className="text-[10px] font-semibold text-[#687180] uppercase tracking-wider block">Scope of Impact</span>
            <p className="text-[11px] text-[#D1D5DB] leading-relaxed">
              {task.approvalDetails.target}
            </p>
          </div>

          <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
            <span className="text-[10px] font-semibold text-[#687180] uppercase tracking-wider block">Security Isolation</span>
            <div className="flex items-center gap-1.5 text-[11px] text-[#D1D5DB]">
              <Lock className="w-3 h-3 text-[#77D9E8] stroke-[1.75]" />
              <span>{task.approvalDetails.riskLevel}</span>
            </div>
            <p className="text-[10px] text-[#687180] mt-0.5">
              Restricted to permitted local workspace folder. No system registries or external credentials touched.
            </p>
          </div>
        </div>
      </div>

      {/* Authorization Actions */}
      {isPending && (
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between">
          <span className="text-[11px] text-[#687180]">
            Execution is held in pause until you grant authorization.
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="danger"
              size="sm"
              icon={XCircle}
              onClick={() => onReject('Declined by operator')}
            >
              Decline & Cancel
            </Button>

            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle}
              onClick={onApprove}
            >
              Authorize Execution
            </Button>
          </div>
        </div>
      )}

      {isApproved && (
        <div className="pt-2 text-[11px] text-emerald-400 flex items-center gap-1.5 font-medium">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Authorization granted. Execution is proceeding through the verification pipeline.</span>
        </div>
      )}

      {isRejected && (
        <div className="pt-2 text-[11px] text-rose-400 flex items-center gap-1.5 font-medium">
          <XCircle className="w-3.5 h-3.5" />
          <span>Execution safely cancelled by operator. Workspace state was preserved without modifications.</span>
        </div>
      )}
    </div>
  );
}
