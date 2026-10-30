import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Bot, 
  Terminal, 
  History, 
  Cpu, 
  FolderArchive, 
  Settings, 
  PlusCircle, 
  Wifi, 
  WifiOff 
} from 'lucide-react';
import { useSystem } from '../context/SystemContext';
import { useTasks } from '../context/TaskContext';
import { Badge } from '../components/common/Badge';

export function Sidebar() {
  const { isEffectivelyOnline, selectedModel, backendStatus } = useSystem();
  const { resetActiveTask } = useTasks();

  const navLinks = [
    { to: '/', label: 'Workspace', icon: Terminal, exact: true },
    { to: '/history', label: 'Task History', icon: History },
    { to: '/memory', label: 'Memory & Experience', icon: Cpu },
    { to: '/files', label: 'Generated Files', icon: FolderArchive },
    { to: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0A0E18] border-r border-slate-800/80 flex flex-col h-screen select-none shrink-0">
      {/* Brand Identity */}
      <div className="p-5 border-b border-slate-800/60 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/25 ring-1 ring-cyan-400/40">
            <Bot className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold tracking-wider text-slate-100 text-base">FORGE</span>
              <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">AI</span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">Autonomous Computer-Use</p>
          </div>
        </div>
      </div>

      {/* New Task Action */}
      <div className="px-4 py-4">
        <button
          onClick={resetActiveTask}
          className="w-full flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm shadow-md shadow-cyan-500/20 active:scale-[0.98] transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Assistant Task</span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1.5 overflow-y-auto">
        <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
          Workspace Sections
        </div>
        {navLinks.map((link) => {
          const Icon = link.icon;
          return (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.exact}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{link.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Hardware & System Telemetry Footer */}
      <div className="p-4 border-t border-slate-800/80 bg-[#080C14]">
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Environment</span>
            <Badge variant={isEffectivelyOnline ? 'emerald' : 'amber'} className="text-[10px] py-0 px-2">
              {isEffectivelyOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Offline Airgap</span>
                </>
              )}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">AI Engine</span>
            <span className="font-mono text-cyan-400 text-[11px] truncate max-w-[110px]" title={selectedModel}>
              {selectedModel}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-800/60">
            <span className="text-slate-400">Backend API</span>
            <div className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${backendStatus.status === 'connected' ? 'bg-emerald-400' : 'bg-cyan-400 animate-pulse'}`} />
              <span className="text-[11px] text-slate-300">
                {backendStatus.status === 'connected' ? 'Connected' : 'Simulated'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 px-1 font-mono">
          <span>FORGE v0.9.2</span>
          <span>Bhuvan &bull; Vansh</span>
        </div>
      </div>
    </aside>
  );
}
