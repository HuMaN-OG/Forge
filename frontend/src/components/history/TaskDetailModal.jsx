import React from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  RotateCw, 
  ShieldCheck, 
  FolderArchive 
} from 'lucide-react';
import { formatDate, formatDuration, getStatusStyle } from '../../utils/formatters';

export function TaskDetailModal({ task, isOpen, onClose, onReuse }) {
  if (!task) return null;

  const statusStyle = getStatusStyle(task.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Task Execution Audit Record" subtitle={`Task ID: ${task.id}`} maxWidth="max-w-3xl">
      <div className="space-y-5 text-xs">
        {/* Header Summary */}
        <div className="p-3.5 rounded-lg bg-black/40 border border-white/[0.05] space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xs font-semibold text-[#F1F3F5]">{task.title}</h3>
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
              {statusStyle.label}
            </span>
          </div>

          <div className="text-[11px] text-[#D1D5DB] font-mono bg-white/[0.02] p-2.5 rounded border border-white/[0.04]">
            "{task.prompt}"
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-[11px] text-[#687180]">
            <div>
              <span className="block text-[10px] uppercase font-mono text-[#687180]">Inference Engine</span>
              <span className="text-[#929AA8]">{task.provider || 'Ollama (qwen3:4b)'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-mono text-[#687180]">Duration</span>
              <span className="text-[#929AA8] font-mono">{formatDuration(task.durationSeconds)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-mono text-[#687180]">Environment</span>
              <span className="text-[#929AA8]">{task.type === 'offline' ? 'Offline Local' : 'Online API'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-mono text-[#687180]">Recorded At</span>
              <span className="text-[#929AA8]">{formatDate(task.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 7-Stage Workflow Step Inspection */}
        <div>
          <div className="text-[10px] font-semibold text-[#687180] uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#77D9E8] stroke-[1.75]" />
            <span>Workflow Execution Pipeline Stages</span>
          </div>

          <div className="space-y-1.5">
            {task.steps?.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isFailed = step.status === 'failed' || step.status === 'rejected';

              return (
                <div
                  key={step.id || idx}
                  className={`p-2.5 rounded-lg border flex items-start gap-2.5 ${
                    isCompleted
                      ? 'bg-white/[0.015] border-white/[0.04] text-[#D1D5DB]'
                      : isFailed
                        ? 'bg-rose-950/20 border-rose-800/30 text-rose-300'
                        : 'bg-white/[0.01] border-white/[0.03] text-[#687180]'
                  }`}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : isFailed ? (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    ) : (
                      <Clock className="w-3.5 h-3.5 text-[#687180]" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[11px] font-semibold text-[#77D9E8] uppercase font-mono">
                        {step.stage}
                      </span>
                      <span className="text-[9px] text-[#687180] uppercase font-mono">
                        {step.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#929AA8] leading-relaxed">
                      {step.message}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Summary */}
        {task.verificationDetails && (
          <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-[11px] space-y-1">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cryptographic Output Verification ({task.verificationDetails.verifier})</span>
            </span>
            <p className="text-[#D1D5DB] pl-5">
              {task.verificationDetails.metrics}
            </p>
          </div>
        )}

        {/* Artifacts Produced */}
        {task.artifacts && task.artifacts.length > 0 && (
          <div>
            <div className="text-[10px] font-semibold text-[#687180] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FolderArchive className="w-3.5 h-3.5 text-[#77D9E8] stroke-[1.75]" />
              <span>Produced Artifacts</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {task.artifacts.map((art, idx) => (
                <div key={idx} className="p-2 rounded bg-black/30 border border-white/[0.04] text-[11px] flex items-center justify-between">
                  <span className="font-mono text-[#77D9E8] truncate">{art.name}</span>
                  <span className="text-[#687180] text-[10px]">{Math.round(art.size / 1024)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Actions */}
        <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
          <span className="text-[10px] text-[#687180]">
            Stored authoritatively in backend SQLite database.
          </span>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={RotateCw}
              onClick={() => {
                onClose();
                onReuse(task);
              }}
            >
              Reuse Prompt in Workspace
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
