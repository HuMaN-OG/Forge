import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { AI_PROVIDERS } from '../../utils/constants';

export function ProviderSettings() {
  const { 
    selectedProvider, 
    setSelectedProvider, 
    selectedModel, 
    setSelectedModel 
  } = useSystem();

  const currentProvider = AI_PROVIDERS[selectedProvider.toUpperCase()] || AI_PROVIDERS.OLLAMA;

  return (
    <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 space-y-4 text-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-[#77D9E8] stroke-[1.75]" />
          <h3 className="font-semibold text-[#F1F3F5] text-xs">AI Inference Engine & Model Targets</h3>
        </div>
        <span className="text-[10px] font-mono text-[#687180]">Local Airgap Priority</span>
      </div>

      {/* Provider Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {Object.values(AI_PROVIDERS).map((provider) => {
          const isSelected = selectedProvider === provider.id;
          const isOffline = provider.type === 'offline';

          return (
            <div
              key={provider.id}
              onClick={() => {
                setSelectedProvider(provider.id);
                setSelectedModel(provider.defaultModel);
              }}
              className={`p-3 rounded-lg border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-white/[0.05] border-[#77D9E8]/40 ring-1 ring-[#77D9E8]/20'
                  : 'bg-white/[0.015] border-white/[0.05] hover:border-white/[0.1]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-medium text-[#F1F3F5]">{provider.name}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                  isOffline 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                    : 'bg-[#6EA8FF]/10 text-[#6EA8FF] border-[#6EA8FF]/20'
                }`}>
                  {isOffline ? 'Offline Capable' : 'Cloud Online'}
                </span>
              </div>
              <p className="text-[11px] text-[#687180] leading-relaxed mb-2">
                {provider.description}
              </p>
              <div className="text-[10px] font-mono text-[#77D9E8]">
                Default: {provider.defaultModel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Selection Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-[11px] font-medium text-[#929AA8]">
          Selected Model Target
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1.5 text-xs text-[#F1F3F5] font-mono focus:outline-none focus:border-[#77D9E8]/40 cursor-pointer"
        >
          {currentProvider.models.map((mod) => (
            <option key={mod} value={mod} className="bg-[#121620]">
              {mod} {mod === currentProvider.defaultModel ? '(Recommended)' : ''}
            </option>
          ))}
        </select>
        <p className="text-[10px] text-[#687180]">
          Verify model presence locally via <code className="text-[#77D9E8] font-mono">ollama pull {selectedModel}</code> on your workstation.
        </p>
      </div>

      {/* Security Statement */}
      <div className="p-2.5 rounded-lg bg-black/30 border border-white/[0.04] flex items-start gap-2 text-[11px] text-[#929AA8]">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5 stroke-[1.75]" />
        <p className="leading-relaxed">
          When <strong>Ollama (Local LLM)</strong> is engaged, all prompt tokens, multi-step execution graphs, and output artifacts remain entirely on local hardware. Zero network telemetry.
        </p>
      </div>
    </div>
  );
}
