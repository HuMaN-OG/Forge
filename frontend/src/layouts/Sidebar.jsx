import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Terminal, 
  Clock, 
  Cpu, 
  Folder, 
  Sliders, 
  Plus, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { ForgeLogo } from '../components/common/ForgeLogo';
import { useSystem } from '../context/SystemContext';
import { useTasks } from '../context/TaskContext';

export function Sidebar() {
  const { isEffectivelyOnline, selectedModel, backendStatus } = useSystem();
  const { resetActiveTask } = useTasks();

  const navItems = [
    { to: '/', label: 'Workspace', icon: Terminal, exact: true, badge: null },
    { to: '/history', label: 'Task History', icon: Clock, badge: null },
    { to: '/memory', label: 'Memory Store', icon: Cpu, badge: null },
    { to: '/files', label: 'Artifacts', icon: Folder, badge: null },
    { to: '/settings', label: 'Settings', icon: Sliders, badge: null },
  ];

  return (
    <aside className="w-60 bg-[#0C0E14] border-r border-white/[0.06] flex flex-col h-screen select-none shrink-0 text-xs">
      {/* Brand Header */}
      <div className="h-14 px-4 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <ForgeLogo size={20} />
          <div className="flex items-baseline gap-1.5">
            <span className="font-semibold tracking-tight text-[#F1F3F5] text-sm">FORGE</span>
            <span className="text-[10px] font-mono text-[#687180]">AI</span>
          </div>
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-[#929AA8] border border-white/[0.06]">
          v0.9.2
        </span>
      </div>

      {/* Primary Action */}
      <div className="p-3">
        <button
          onClick={resetActiveTask}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-[#F1F3F5] border border-white/[0.08] hover:border-white/[0.14] transition-all group active:scale-[0.99]"
        >
          <div className="flex items-center gap-2 text-xs font-medium">
            <Plus className="w-3.5 h-3.5 text-[#77D9E8] stroke-[2]" />
            <span>New Task</span>
          </div>
          <span className="text-[10px] font-mono text-[#687180] bg-black/40 px-1.5 py-0.5 rounded border border-white/[0.05]">
            ⌘N
          </span>
        </button>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-2.5 space-y-0.5 overflow-y-auto">
        <div className="px-2 pt-2 pb-1.5 text-[10px] font-semibold text-[#687180] tracking-wider uppercase">
          Operations
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.exact}
              className={({ isActive }) =>
                `flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-white/[0.07] text-[#F1F3F5] shadow-xs'
                    : 'text-[#929AA8] hover:text-[#F1F3F5] hover:bg-white/[0.03]'
                }`
              }
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0 stroke-[1.75]" />
                <span>{item.label}</span>
              </div>
            </NavLink>
          );
        })}
      </nav>

      {/* Engine Telemetry & Operator Profile Footer */}
      <div className="p-3 border-t border-white/[0.05] bg-[#0A0C12] space-y-2">
        <div className="px-2 py-1.5 rounded-lg bg-white/[0.025] border border-white/[0.05] space-y-1.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#687180]">Network</span>
            <div className="flex items-center gap-1.5">
              {isEffectivelyOnline ? (
                <Wifi className="w-3 h-3 text-emerald-400 stroke-[1.75]" />
              ) : (
                <WifiOff className="w-3 h-3 text-amber-400 stroke-[1.75]" />
              )}
              <span className={`text-[10px] font-mono ${isEffectivelyOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {isEffectivelyOnline ? 'Online' : 'Airgap'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#687180]">Model</span>
            <span className="font-mono text-[#77D9E8] text-[10px] truncate max-w-[110px]" title={selectedModel}>
              {selectedModel}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px] pt-1 border-t border-white/[0.04]">
            <span className="text-[#687180]">Backend</span>
            <span className="text-[10px] text-[#929AA8] flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${backendStatus.status === 'connected' ? 'bg-emerald-400' : 'bg-[#77D9E8]'}`} />
              {backendStatus.status === 'connected' ? 'Live' : 'Simulated'}
            </span>
          </div>
        </div>

        {/* Operator Profile */}
        <div className="flex items-center gap-2.5 px-2 py-1 text-xs">
          <div className="w-6 h-6 rounded-md bg-[#162030] border border-[#77D9E8]/30 flex items-center justify-center text-[10px] font-mono font-semibold text-[#77D9E8]">
            V
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[11px] font-medium text-[#F1F3F5] leading-tight truncate">Vansh</div>
            <div className="text-[10px] text-[#687180] leading-tight truncate">Frontend Lead</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
