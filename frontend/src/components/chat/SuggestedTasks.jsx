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
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-[11px] font-medium text-[#687180]">
        <span>Suggested Operations</span>
        <span className="text-[10px] font-mono">Select to load prompt</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        {MOCK_SUGGESTIONS.map((item) => {
          const Icon = getIcon(item.id);
          const isOffline = item.type === 'offline';

          return (
            <button
              key={item.id}
              onClick={() => onSelectSuggestion(item.prompt)}
              className="group text-left p-3 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.05] hover:border-white/[0.12] transition-all flex items-start gap-2.5 active:scale-[0.99]"
            >
              <div className="p-1.5 rounded-md bg-white/[0.04] text-[#929AA8] group-hover:text-[#77D9E8] border border-white/[0.05] transition-colors shrink-0 mt-0.5">
                <Icon className="w-3.5 h-3.5 stroke-[1.75]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1 mb-0.5">
                  <span className="text-xs font-medium text-[#E2E8F0] group-hover:text-[#F1F3F5] transition-colors truncate">
                    {item.title}
                  </span>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${
                    isOffline 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-[#77D9E8]/10 text-[#77D9E8] border-[#77D9E8]/20'
                  }`}>
                    {isOffline ? 'Offline' : 'Online'}
                  </span>
                </div>
                <p className="text-[11px] text-[#687180] line-clamp-1 leading-normal">
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
