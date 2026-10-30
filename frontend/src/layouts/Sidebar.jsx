import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Sparkles, 
  Clock, 
  BrainCircuit, 
  FolderGit2, 
  SlidersHorizontal, 
  Plus, 
  MessageSquare,
  Trash2
} from 'lucide-react';
import { ForgeLogo } from '../components/common/ForgeLogo';
import { useSystem } from '../context/SystemContext';
import { useTasks } from '../context/TaskContext';

export function Sidebar() {
  const { isEffectivelyOnline, selectedModel } = useSystem();
  const { 
    conversations = [], 
    activeConversationId, 
    switchConversation, 
    startNewConversation, 
    deleteConversation 
  } = useTasks();

  const navigation = [
    { to: '/', label: 'Assistant Workspace', icon: Sparkles, exact: true },
    { to: '/history', label: 'Task History', icon: Clock },
    { to: '/memory', label: 'Memory & Recipes', icon: BrainCircuit },
    { to: '/files', label: 'Generated Files', icon: FolderGit2 },
    { to: '/settings', label: 'Preferences', icon: SlidersHorizontal },
  ];

  return (
    <aside className="w-64 bg-[#0D0E12] border-r border-white/[0.06] flex flex-col h-screen select-none shrink-0 text-[13px]">
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-white/[0.05] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shadow-xs">
            <ForgeLogo size={18} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-white tracking-tight text-sm">Forge</span>
              <span className="text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/25">
                AI
              </span>
            </div>
            <p className="text-[11px] text-[#71717A]">Computer-Use Assistant</p>
          </div>
        </div>
      </div>

      {/* New Task Action Button */}
      <div className="px-4 pt-4 pb-2">
        <button
          onClick={() => startNewConversation(`Session ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`)}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500/20 via-sky-500/15 to-transparent hover:from-indigo-500/30 hover:via-sky-500/25 text-[#E0E7FF] border border-indigo-500/30 hover:border-indigo-500/50 transition-all duration-150 group active:scale-[0.99] shadow-xs"
        >
          <div className="flex items-center gap-2 font-medium text-xs">
            <Plus className="w-4 h-4 text-sky-400 group-hover:rotate-90 transition-transform duration-200" />
            <span>New Task</span>
          </div>
          <span className="text-[10px] font-mono text-[#A5B4FC]/70 bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-500/20">
            ⌘N
          </span>
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-4 overflow-y-auto">
        <div>
          <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-[#52525B] uppercase tracking-wider">
            Workspace
          </div>
          <div className="space-y-1">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.exact}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 ${
                      isActive
                        ? 'bg-white/[0.08] text-white shadow-xs border border-white/[0.08]'
                        : 'text-[#8E8EA0] hover:text-[#EDEDED] hover:bg-white/[0.03]'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0 stroke-[1.8]" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>

        {/* Sessions & History Navigation */}
        {conversations.length > 0 && (
          <div>
            <div className="px-3 pt-2 pb-1.5 text-[10px] font-semibold text-[#52525B] uppercase tracking-wider flex items-center justify-between">
              <span>Saved Sessions</span>
              <span className="text-[9px] font-mono opacity-60">{conversations.length}</span>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto pr-1">
              {conversations.slice(0, 15).map((conv) => {
                const isActive = activeConversationId === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => switchConversation(conv.id)}
                    className={`group flex items-center justify-between px-3 py-1.5 rounded-lg text-xs cursor-pointer transition-colors ${
                      isActive
                        ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25 font-medium'
                        : 'text-[#8E8EA0] hover:text-[#EDEDED] hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-sky-400' : 'text-[#71717A]'}`} />
                      <span className="truncate text-[11px]">{conv.title || 'Conversation'}</span>
                    </div>
                    {conversations.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(conv.id);
                        }}
                        title="Delete session"
                        className="opacity-0 group-hover:opacity-100 hover:text-rose-400 transition-opacity p-0.5"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* System Status & Operator Profile Footer */}
      <div className="p-3.5 border-t border-white/[0.05] bg-[#0A0B0E]/60 space-y-2.5">
        {/* Status Pill Card */}
        <div className="p-2.5 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-[#A1A1AA] text-[11px]">System Ready</span>
            </div>
            <span className="text-[10px] font-mono text-[#71717A] bg-white/[0.04] px-1.5 py-0.5 rounded">
              Local Airgap
            </span>
          </div>
          <div className="text-[10px] text-[#71717A] flex items-center justify-between pt-1 border-t border-white/[0.04]">
            <span className="truncate max-w-[130px]">{selectedModel}</span>
            <span className="text-emerald-400/90 font-mono text-[9px]">100% Offline</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
