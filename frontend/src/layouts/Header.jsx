import React from 'react';
import { useLocation } from 'react-router-dom';
import { Wifi, WifiOff, Cpu, AlertCircle } from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { Badge } from '../components/common/Badge';

export function Header() {
  const location = useLocation();
  const { isEffectivelyOnline, selectedProvider, backendStatus } = useSystem();

  const getPageMeta = () => {
    switch (location.pathname) {
      case '/':
        return {
          title: 'Autonomous Workspace',
          subtitle: 'Direct assistant input, interactive planning, and approval console'
        };
      case '/history':
        return {
          title: 'Persistent Task History',
          subtitle: 'Audit trail of executed workflows, execution steps, and verification metrics'
        };
      case '/memory':
        return {
          title: 'Memory & Experience Store',
          subtitle: 'Indexed workflow templates, successful task patterns, and prompt triggers'
        };
      case '/files':
        return {
          title: 'Generated Artifacts',
          subtitle: 'Files, documents, and spreadsheets produced by FORGE automation tools'
        };
      case '/settings':
        return {
          title: 'System & Engine Settings',
          subtitle: 'Configure AI provider, local models, offline rules, and backend integration'
        };
      default:
        return {
          title: 'FORGE AI',
          subtitle: 'Autonomous Computer-Use System'
        };
    }
  };

  const meta = getPageMeta();

  return (
    <header className="h-16 px-6 bg-[#0B0F19]/90 backdrop-blur-md border-b border-slate-800/80 flex items-center justify-between shrink-0 z-20">
      <div>
        <h1 className="text-base font-semibold text-slate-100 flex items-center gap-2">
          {meta.title}
        </h1>
        <p className="text-xs text-slate-400 hidden sm:block">{meta.subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Transparent Mock Mode Alert Pill */}
        {backendStatus.isSimulated && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-mono">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Dev Preview / Standalone Mock</span>
          </div>
        )}

        {/* Offline / Online Pill */}
        <Badge variant={isEffectivelyOnline ? 'emerald' : 'amber'} className="hidden sm:inline-flex py-1 px-3">
          {isEffectivelyOnline ? (
            <>
              <Wifi className="w-3.5 h-3.5" />
              <span>Network Active</span>
            </>
          ) : (
            <>
              <WifiOff className="w-3.5 h-3.5" />
              <span>Offline Airgapped</span>
            </>
          )}
        </Badge>

        {/* Active AI Provider */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-slate-300 text-xs">
          <Cpu className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span className="font-medium text-slate-200">{selectedProvider === 'ollama' ? 'Ollama Local' : 'Groq LPU'}</span>
        </div>
      </div>
    </header>
  );
}
