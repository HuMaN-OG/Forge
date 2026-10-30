import React from 'react';
import { FileSpreadsheet, FolderTree, FileText, Globe } from 'lucide-react';
import { MOCK_SUGGESTIONS } from '../../services/mockData';

export function SuggestedTasks({ onSelectSuggestion }) {
  const getIcon = (id) => {
    switch (id) {
      case 'sug-1': return FileSpreadsheet;
      case 'sug-2': return FolderTree;
      case 'sug-3': return FileText;
      default: return Globe;
    }
  };

  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between text-xs text-[#71717A] px-1 font-medium">
        <span>Suggested starter automations</span>
        <span className="text-[11px] font-mono">1-click to launch</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {MOCK_SUGGESTIONS.map((item) => {
          const Icon = getIcon(item.id);
          const isOffline = item.type === 'offline';

          return (
            <button
              key={item.id}
              onClick={() => onSelectSuggestion(item.prompt)}
              className="group text-left p-4 rounded-2xl bg-white/[0.025] hover:bg-white/[0.06] border border-white/[0.06] hover:border-indigo-500/30 transition-all duration-200 flex items-start gap-3.5 active:scale-[0.99] shadow-xs"
            >
              <div className="p-2.5 rounded-xl bg-white/[0.04] text-[#A1A1AA] group-hover:text-sky-400 group-hover:bg-sky-500/10 border border-white/[0.06] group-hover:border-sky-500/20 transition-all duration-200 shrink-0 mt-0.5">
                <Icon className="w-4 h-4 stroke-[1.8]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-xs font-semibold text-[#EDEDED] group-hover:text-white transition-colors truncate">
                    {item.title}
                  </span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isOffline 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  }`}>
                    {isOffline ? 'Offline' : 'Online'}
                  </span>
                </div>
                <p className="text-[11px] text-[#8E8EA0] line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
