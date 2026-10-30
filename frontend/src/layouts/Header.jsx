import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSystem } from '../context/SystemContext';
import { ShieldCheck, Cpu } from 'lucide-react';

export function Header() {
  const location = useLocation();
  const { isEffectivelyOnline, selectedProvider, selectedModel, backendStatus } = useSystem();

  const getBreadcrumb = () => {
    switch (location.pathname) {
      case '/': return { section: 'Studio', title: 'Assistant Workspace' };
      case '/history': return { section: 'Audit', title: 'Task History' };
      case '/memory': return { section: 'Experience', title: 'Memory & Recipes' };
      case '/files': return { section: 'Storage', title: 'Generated Files' };
      case '/settings': return { section: 'Config', title: 'Preferences & Engine' };
      default: return { section: 'Forge', title: 'Workspace' };
    }
  };

  const { section, title } = getBreadcrumb();

  return (
    <header className="h-14 px-8 border-b border-white/[0.05] flex items-center justify-between shrink-0 z-20 text-xs">
      <div className="flex items-center gap-2">
        <span className="text-[#71717A] font-medium">{section}</span>
        <span className="text-[#52525B]">/</span>
        <h1 className="font-semibold text-[#EDEDED]">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Transparent Mock Mode Pill */}
        {backendStatus.isSimulated && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[#A1A1AA] text-[11px]">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            <span>Standalone Dev Preview</span>
          </div>
        )}

        {/* Engine Target */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#D4D4D8]">
          <Cpu className="w-3.5 h-3.5 text-sky-400 stroke-[1.8]" />
          <span>{selectedProvider === 'ollama' ? 'Ollama' : 'Groq'}</span>
          <span className="text-[#52525B]">&bull;</span>
          <span className="font-mono text-white text-[10px]">{selectedModel}</span>
        </div>

        {/* Airgap badge */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#A1A1AA]">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 stroke-[1.8]" />
          <span>{isEffectivelyOnline ? 'Online Allowed' : 'Airgap Protected'}</span>
        </div>
      </div>
    </header>
  );
}
