import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';

export function Header() {
  const location = useLocation();
  const { isEffectivelyOnline, selectedProvider, backendStatus } = useSystem();

  const getBreadcrumb = () => {
    switch (location.pathname) {
      case '/': return { section: 'Workspace', title: 'Autonomous Console' };
      case '/history': return { section: 'Audit', title: 'Task History' };
      case '/memory': return { section: 'Index', title: 'Memory Store' };
      case '/files': return { section: 'Filesystem', title: 'Generated Artifacts' };
      case '/settings': return { section: 'Preferences', title: 'System & Engine' };
      default: return { section: 'FORGE', title: 'Assistant' };
    }
  };

  const { section, title } = getBreadcrumb();

  return (
    <header className="h-13 px-6 bg-[#090B10]/80 backdrop-blur-md border-b border-white/[0.05] flex items-center justify-between shrink-0 z-20 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-[#687180] font-medium">{section}</span>
        <span className="text-[#687180] font-mono">/</span>
        <h1 className="font-semibold text-[#F1F3F5] tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Transparent Mock Mode Pill */}
        {backendStatus.isSimulated && (
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.07] text-[#929AA8] text-[11px] font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Standalone Dev Mode</span>
          </div>
        )}

        {/* Airgap / Network Status */}
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#929AA8]">
          <span className={`w-1.5 h-1.5 rounded-full ${isEffectivelyOnline ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span>{isEffectivelyOnline ? 'Online Permitted' : 'Airgap Enforced'}</span>
        </div>

        {/* AI Provider */}
        <div className="hidden md:flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-[#929AA8]">
          <span className="text-[#77D9E8] font-medium">{selectedProvider === 'ollama' ? 'Ollama' : 'Groq'}</span>
        </div>
      </div>
    </header>
  );
}
