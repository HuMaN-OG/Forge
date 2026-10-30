import React from 'react';
import { 
  Trash2, 
  CheckCircle, 
  Repeat, 
  Tag, 
  ListOrdered, 
  MessageSquareQuote,
  Clock 
} from 'lucide-react';
import { Badge } from '../common/Badge';

export function ExperienceCard({ record, onDelete }) {
  return (
    <div className="rounded-2xl bg-[#0F1626] border border-slate-800/80 p-5 space-y-4 hover:border-slate-700 transition-all shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold text-slate-100">{record.patternName}</h3>
            <Badge variant="cyan" className="text-[10px]">
              {record.category}
            </Badge>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            {record.description}
          </p>
        </div>

        <button
          onClick={() => onDelete(record)}
          title="Delete experience pattern"
          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Reuse Count</span>
          <span className="font-semibold text-cyan-400 flex items-center gap-1">
            <Repeat className="w-3 h-3" />
            {record.useCount} times
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Verification Rate</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            {record.successRate}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold block">Last Invoked</span>
          <span className="text-slate-300 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {record.lastUsed}
          </span>
        </div>
      </div>

      {/* Stored Workflow Steps */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <ListOrdered className="w-3.5 h-3.5 text-cyan-400" />
          <span>Procedural Execution Steps</span>
        </div>
        <ol className="space-y-1.5 text-xs text-slate-300">
          {record.storedWorkflows.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-900/40 border border-slate-800/60 font-mono text-[11px]">
              <span className="text-cyan-400 font-bold shrink-0">{idx + 1}.</span>
              <span className="text-slate-200">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Trigger Phrases & Feedback */}
      <div className="space-y-2 pt-2 border-t border-slate-800/60 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3 h-3 text-slate-400 shrink-0" />
          <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Triggers:</span>
          {record.triggerPhrases.map((phrase, idx) => (
            <span key={idx} className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px] border border-slate-700/60">
              "{phrase}"
            </span>
          ))}
        </div>

        {record.feedback && (
          <div className="flex items-start gap-2 p-2.5 rounded-lg bg-cyan-950/20 border border-cyan-800/30 text-cyan-300 text-xs">
            <MessageSquareQuote className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
            <span className="italic">{record.feedback}</span>
          </div>
        )}
      </div>
    </div>
  );
}
