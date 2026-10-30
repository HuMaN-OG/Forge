import React from 'react';
import { Cpu, Server, Wifi, WifiOff, Wrench } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export function SystemStatusBar() {
  const { 
    isEffectivelyOnline, 
    selectedProvider, 
    selectedModel, 
    backendStatus, 
    automationStatus 
  } = useSystem();

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
      {/* AI Model Telemetry */}
      <div className="p-3.5 rounded-xl bg-[#0F1626] border border-slate-800/80 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 shrink-0">
          <Cpu className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">AI Inference</div>
          <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
            {selectedProvider === 'ollama' ? 'Ollama' : 'Groq LPU'} &bull; <span className="font-mono text-cyan-400">{selectedModel}</span>
          </div>
        </div>
      </div>

      {/* Network / Airgap Status */}
      <div className="p-3.5 rounded-xl bg-[#0F1626] border border-slate-800/80 flex items-center gap-3">
        <div className={`p-2 rounded-lg border shrink-0 ${
          isEffectivelyOnline 
            ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400' 
            : 'bg-amber-500/10 border-amber-500/25 text-amber-400'
        }`}>
          {isEffectivelyOnline ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Network Mode</div>
          <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
            {isEffectivelyOnline ? 'Online Enabled' : 'Offline Airgapped'}
          </div>
        </div>
      </div>

      {/* Backend API Status */}
      <div className="p-3.5 rounded-xl bg-[#0F1626] border border-slate-800/80 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/25 text-blue-400 shrink-0">
          <Server className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Express Backend</div>
          <div className="text-xs font-semibold text-slate-200 truncate mt-0.5 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${backendStatus.status === 'connected' ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
            <span>{backendStatus.status === 'connected' ? 'Connected' : 'Standalone Mock'}</span>
          </div>
        </div>
      </div>

      {/* Automation Engine */}
      <div className="p-3.5 rounded-xl bg-[#0F1626] border border-slate-800/80 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 shrink-0">
          <Wrench className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Automation Tools</div>
          <div className="text-xs font-semibold text-slate-200 truncate mt-0.5">
            {automationStatus.availableToolsCount} Registered Tools
          </div>
        </div>
      </div>
    </div>
  );
}
