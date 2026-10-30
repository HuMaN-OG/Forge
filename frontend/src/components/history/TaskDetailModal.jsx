import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
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
    <Modal isOpen={isOpen} onClose={onClose} title="Task Execution Audit Details" maxWidth="max-w-3xl">
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-100">{task.title}</h3>
            <Badge variant={task.status === 'completed' ? 'emerald' : task.status === 'failed' ? 'rose' : 'amber'}>
              {statusStyle.label}
            </Badge>
          </div>

          <p className="text-xs text-slate-300 font-mono bg-black/30 p-2.5 rounded-lg border border-slate-800/80">
            "{task.prompt}"
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-xs text-slate-400">
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Task ID</span>
              <span className="font-mono text-slate-200">{task.id}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">AI Model</span>
              <span className="text-slate-200">{task.provider || 'Ollama (llama3:8b)'}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Duration</span>
              <span className="text-slate-200">{formatDuration(task.durationSeconds)}</span>
            </div>
            <div>
              <span className="block text-[10px] uppercase font-bold text-slate-400">Timestamp</span>
              <span className="text-slate-200">{formatDate(task.createdAt)}</span>
            </div>
          </div>
        </div>

        {/* 7-Stage Workflow Step Inspection */}
        <div>
          <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Workflow Execution Pipeline Stages</span>
          </h4>

          <div className="space-y-2">
            {task.steps?.map((step, idx) => {
              const isCompleted = step.status === 'completed';
              const isFailed = step.status === 'failed' || step.status === 'rejected';

              return (
                <div
                  key={step.id || idx}
                  className={`p-3 rounded-xl border flex items-start gap-3 ${
                    isCompleted
                      ? 'bg-slate-900/40 border-slate-800 text-slate-200'
                      : isFailed
                        ? 'bg-rose-950/20 border-rose-800/40 text-rose-300'
                        : 'bg-slate-900/20 border-slate-800/40 text-slate-400'
                  }`}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : isFailed ? (
                      <XCircle className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Clock className="w-4 h-4 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-semibold text-cyan-300 uppercase font-mono">
                        {step.stage}
                      </span>
                      <span className="text-[10px] text-slate-400 uppercase font-mono">
                        {step.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
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
          <div className="p-3.5 rounded-xl bg-emerald-950/20 border border-emerald-800/40 text-xs space-y-1">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Automated Verification Output ({task.verificationDetails.verifier})</span>
            </span>
            <p className="text-slate-300 pl-5">
              {task.verificationDetails.metrics}
            </p>
          </div>
        )}

        {/* Artifacts Produced */}
        {task.artifacts && task.artifacts.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <FolderArchive className="w-4 h-4 text-cyan-400" />
              <span>Produced Artifacts</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {task.artifacts.map((art, idx) => (
                <div key={idx} className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-xs flex items-center justify-between">
                  <span className="font-mono text-cyan-300 truncate">{art.name}</span>
                  <span className="text-slate-400">{Math.round(art.size / 1024)} KB</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Footer Controls */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Authoritative persistent records reside in SQLite on the backend.
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
