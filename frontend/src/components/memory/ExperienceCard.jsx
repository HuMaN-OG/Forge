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
    <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 space-y-3.5 hover:border-white/[0.12] transition-colors text-xs">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-semibold text-[#F1F3F5] tracking-tight">{record.patternName}</h3>
            <Badge variant="cyan" className="text-[10px]">
              {record.category}
            </Badge>
          </div>
          <p className="text-[11px] text-[#929AA8] leading-relaxed">
            {record.description}
          </p>
        </div>

        <button
          onClick={() => onDelete(record)}
          title="Delete experience pattern"
          className="p-1 rounded-md text-[#687180] hover:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all"
        >
          <Trash2 className="w-3.5 h-3.5 stroke-[1.75]" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-2 p-2 rounded-lg bg-black/30 border border-white/[0.04] text-[11px]">
        <div>
          <span className="text-[10px] text-[#687180] uppercase font-mono block">Invocations</span>
          <span className="font-mono text-[#77D9E8] font-medium flex items-center gap-1 mt-0.5">
            <Repeat className="w-3 h-3 stroke-[1.75]" />
            {record.useCount} times
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#687180] uppercase font-mono block">Verification</span>
          <span className="font-mono text-emerald-400 font-medium flex items-center gap-1 mt-0.5">
            <CheckCircle className="w-3 h-3 stroke-[1.75]" />
            {record.successRate}
          </span>
        </div>
        <div>
          <span className="text-[10px] text-[#687180] uppercase font-mono block">Last Used</span>
          <span className="font-mono text-[#929AA8] flex items-center gap-1 mt-0.5">
            <Clock className="w-3 h-3 stroke-[1.75]" />
            {record.lastUsed}
          </span>
        </div>
      </div>

      {/* Procedural Steps */}
      <div className="space-y-1.5">
        <div className="text-[10px] font-semibold text-[#687180] uppercase tracking-wider flex items-center gap-1.5">
          <ListOrdered className="w-3 h-3 text-[#77D9E8] stroke-[1.75]" />
          <span>Procedural Workflow Steps</span>
        </div>
        <ol className="space-y-1 text-[11px] text-[#929AA8]">
          {record.storedWorkflows.map((step, idx) => (
            <li key={idx} className="flex items-start gap-2 p-1.5 rounded bg-black/20 border border-white/[0.03] font-mono text-[10px]">
              <span className="text-[#77D9E8] font-bold shrink-0">{idx + 1}.</span>
              <span className="text-[#D1D5DB]">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Trigger Phrases & Feedback */}
      <div className="space-y-2 pt-2 border-t border-white/[0.04] text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3 h-3 text-[#687180] shrink-0 stroke-[1.75]" />
          <span className="text-[10px] font-mono text-[#687180] mr-1">Triggers:</span>
          {record.triggerPhrases.map((phrase, idx) => (
            <span key={idx} className="px-1.5 py-0.2 rounded bg-white/[0.03] text-[#929AA8] text-[10px] font-mono border border-white/[0.05]">
              "{phrase}"
            </span>
          ))}
        </div>

        {record.feedback && (
          <div className="flex items-start gap-1.5 p-2 rounded bg-white/[0.02] border border-white/[0.04] text-[#929AA8] text-[11px]">
            <MessageSquareQuote className="w-3.5 h-3.5 shrink-0 text-[#77D9E8] mt-0.5 stroke-[1.75]" />
            <span className="italic">{record.feedback}</span>
          </div>
        )}
      </div>
    </div>
  );
}
