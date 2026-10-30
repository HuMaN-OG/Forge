import React from 'react';
import { Wifi, WifiOff, Globe, Lock } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';
import { CONNECTION_MODES } from '../../utils/constants';

export function OfflinePolicyCard() {
  const { connectionMode, setConnectionMode, isBrowserOnline } = useSystem();

  const modes = [
    {
      id: CONNECTION_MODES.AUTO,
      title: 'Adaptive (Auto-Detect)',
      description: 'Allows offline tasks locally. Allows online search tasks only if internet connectivity is verified.',
      icon: Globe
    },
    {
      id: CONNECTION_MODES.FORCE_OFFLINE,
      title: 'Enforced Airgap (Offline Only)',
      description: 'Strictly blocks all external sockets, Playwright browser navigation, and cloud calls. Complete privacy.',
      icon: WifiOff
    },
    {
      id: CONNECTION_MODES.ONLINE_ONLY,
      title: 'Online Priority',
      description: 'Prefers cloud capabilities and web research when internet access is confirmed available.',
      icon: Wifi
    }
  ];

  return (
    <div className="rounded-2xl bg-[#0F1626] border border-slate-800/80 p-5 space-y-4 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Offline Execution & Airgap Policy
            </h3>
            <p className="text-xs text-slate-400">
              Control whether FORGE is permitted to initiate outbound network requests
            </p>
          </div>
        </div>

        <div className="text-xs text-slate-400 flex items-center gap-1.5">
          <span>Browser Hardware:</span>
          <span className={`font-semibold ${isBrowserOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isBrowserOnline ? 'Online' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="space-y-2.5">
        {modes.map((mode) => {
          const isSelected = connectionMode === mode.id;
          const Icon = mode.icon;

          return (
            <div
              key={mode.id}
              onClick={() => setConnectionMode(mode.id)}
              className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                isSelected
                  ? 'bg-cyan-950/20 border-cyan-500/60 ring-1 ring-cyan-500/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                isSelected ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-800 text-slate-400'
              }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-200">{mode.title}</span>
                  {isSelected && (
                    <span className="text-[10px] text-cyan-400 font-mono font-bold uppercase">
                      Active Policy
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  {mode.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
