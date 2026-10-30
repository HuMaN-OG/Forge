import React from 'react';
import { Info } from 'lucide-react';

export function MemoryExplanationBanner() {
  return (
    <div className="rounded-2xl bg-gradient-to-r from-blue-950/40 via-cyan-950/20 to-slate-900 border border-cyan-800/40 p-5 mb-6 text-xs shadow-lg shadow-cyan-950/10">
      <div className="flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="space-y-2 leading-relaxed">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">
              Architectural Clarification: How FORGE Memory Operates
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
              In-Context Retrieval
            </span>
          </div>

          <p className="text-slate-300">
            FORGE AI uses an <strong>in-context procedural retrieval memory architecture</strong> rather than fine-tuning or altering local model weights. Understanding this distinction is essential for deterministic system safety:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
              <span className="font-semibold text-cyan-400 block mb-0.5">1. SQLite Task History</span>
              <p className="text-[11px] text-slate-400">
                Authoritative chronological audit log of past prompts, tool parameters, durations, and output files.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
              <span className="font-semibold text-emerald-400 block mb-0.5">2. Experience Patterns</span>
              <p className="text-[11px] text-slate-400">
                Validated workflow templates injected into future prompts to reproduce successful multi-step automation without trial-and-error.
              </p>
            </div>

            <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
              <span className="font-semibold text-amber-400 block mb-0.5">3. Frozen Model Weights</span>
              <p className="text-[11px] text-slate-400">
                Local Ollama weights remain completely unchanged. Saving execution history never modifies the underlying neural network.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
