import React from 'react';
import { Info, Database, Workflow, ShieldCheck } from 'lucide-react';

export function MemoryExplanationBanner() {
  return (
    <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 text-xs space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-white/[0.04]">
        <div className="flex items-center gap-2">
          <Info className="w-3.5 h-3.5 text-[#77D9E8] stroke-[1.75]" />
          <h3 className="text-xs font-semibold text-[#F1F3F5] tracking-tight">
            Memory Architecture: In-Context Procedural Retrieval
          </h3>
        </div>
        <span className="text-[10px] font-mono text-[#929AA8] bg-white/[0.03] px-2 py-0.5 rounded border border-white/[0.05]">
          Deterministic Execution
        </span>
      </div>

      <p className="text-[11px] text-[#929AA8] leading-relaxed">
        FORGE AI utilizes dynamic in-context retrieval rather than modifying local LLM neural network weights. Understanding this distinction ensures predictable and verifiable automation:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
        <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#F1F3F5]">
            <Database className="w-3 h-3 text-[#77D9E8] stroke-[1.75]" />
            <span>SQLite Execution Log</span>
          </div>
          <p className="text-[11px] text-[#687180] leading-normal">
            Authoritative chronological history of past tool arguments, outputs, and verification hashes.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#F1F3F5]">
            <Workflow className="w-3 h-3 text-emerald-400 stroke-[1.75]" />
            <span>Experience Templates</span>
          </div>
          <p className="text-[11px] text-[#687180] leading-normal">
            Validated procedural workflows injected into future prompts to reproduce successful multi-step actions.
          </p>
        </div>

        <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
          <div className="flex items-center gap-1.5 text-[11px] font-medium text-[#F1F3F5]">
            <ShieldCheck className="w-3 h-3 text-amber-400 stroke-[1.75]" />
            <span>Frozen Model Weights</span>
          </div>
          <p className="text-[11px] text-[#687180] leading-normal">
            Local Ollama model parameters remain strictly read-only. Saving tasks never modifies neural weights.
          </p>
        </div>
      </div>
    </div>
  );
}
