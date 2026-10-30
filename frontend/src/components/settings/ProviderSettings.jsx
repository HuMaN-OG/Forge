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
    <div className="rounded-2xl bg-[#0F1626] border border-slate-800/80 p-5 space-y-5 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              AI Inference Provider & Models
            </h3>
            <p className="text-xs text-slate-400">
              Configure local offline Ollama models or high-speed cloud inference
            </p>
          </div>
        </div>
      </div>

      {/* Provider Selector Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? 'bg-cyan-950/20 border-cyan-500/60 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-100">{provider.name}</span>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                  isOffline 
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                    : 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                }`}>
                  {isOffline ? 'Offline Capable' : 'Cloud Online'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed mb-3">
                {provider.description}
              </p>
              <div className="text-[11px] font-mono text-cyan-300">
                Default: {provider.defaultModel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Model Selection Dropdown */}
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Active Model Target
        </label>
        <select
          value={selectedModel}
          onChange={(e) => setSelectedModel(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-cyan-500/50"
        >
          {currentProvider.models.map((mod) => (
            <option key={mod} value={mod}>
              {mod} {mod === currentProvider.defaultModel ? '(Recommended)' : ''}
            </option>
          ))}
        </select>
        <p className="text-[11px] text-slate-400">
          Ensure the model is pulled locally via <code className="text-cyan-400">ollama pull {selectedModel}</code> on your machine if running offline.
        </p>
      </div>

      {/* Privacy Notice */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs flex items-start gap-2.5 text-slate-300">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p className="text-[11px] text-slate-400 leading-relaxed">
          When <strong>Ollama (Local LLM)</strong> is active, all prompt analysis, workflow planning, and task outputs remain strictly on your local device. Zero prompts are transmitted over external networks.
        </p>
      </div>
    </div>
  );
}
