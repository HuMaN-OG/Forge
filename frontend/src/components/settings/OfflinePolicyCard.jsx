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
      description: 'Permits offline automation locally. Enables web actions only if active network connection is present.',
      icon: Globe
    },
    {
      id: CONNECTION_MODES.FORCE_OFFLINE,
      title: 'Enforced Airgap (Offline Only)',
      description: 'Strictly blocks outbound sockets, Playwright browser navigation, and external API requests. Complete privacy.',
      icon: WifiOff
    },
    {
      id: CONNECTION_MODES.ONLINE_ONLY,
      title: 'Online Priority',
      description: 'Requires verified internet connection. Prioritizes cloud planning and online data gathering.',
      icon: Wifi
    }
  ];

  return (
    <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 space-y-3.5 text-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Lock className="w-3.5 h-3.5 text-amber-400 stroke-[1.75]" />
          <h3 className="font-semibold text-[#F1F3F5] text-xs">Offline Policy & Airgap Enforcement</h3>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#687180]">
          <span>Interface:</span>
          <span className={isBrowserOnline ? 'text-emerald-400' : 'text-amber-400'}>
            {isBrowserOnline ? 'Online' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="space-y-2">
        {modes.map((mode) => {
          const isSelected = connectionMode === mode.id;
          const Icon = mode.icon;

          return (
            <div
              key={mode.id}
              onClick={() => setConnectionMode(mode.id)}
              className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 ${
                isSelected
                  ? 'bg-white/[0.05] border-[#77D9E8]/40 ring-1 ring-[#77D9E8]/20'
                  : 'bg-white/[0.015] border-white/[0.04] hover:border-white/[0.09]'
              }`}
            >
              <div className={`p-1.5 rounded-md shrink-0 mt-0.5 ${
                isSelected ? 'bg-[#77D9E8]/15 text-[#77D9E8]' : 'bg-white/[0.03] text-[#687180]'
              }`}>
                <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-[#F1F3F5]">{mode.title}</span>
                  {isSelected && (
                    <span className="text-[9px] font-mono text-[#77D9E8] uppercase tracking-wider">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-[#687180] mt-0.5 leading-relaxed">
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
