import React from 'react';
import { Sparkles, FileSpreadsheet, FolderTree, FileText, Globe } from 'lucide-react';
import { MOCK_SUGGESTIONS } from '../../services/mockData';
import { Badge } from '../common/Badge';

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
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Suggested Autonomous Actions</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {MOCK_SUGGESTIONS.map((item) => {
          const Icon = getIcon(item.id);
          const isOffline = item.type === 'offline';
          return (
            <button
              key={item.id}
              onClick={() => onSelectSuggestion(item.prompt)}
              className="group text-left p-3.5 rounded-xl bg-[#0F1626]/80 hover:bg-[#151F36] border border-slate-800/80 hover:border-cyan-500/40 transition-all shadow-sm hover:shadow-md hover:shadow-cyan-950/30 flex items-start gap-3"
            >
              <div className="p-2 rounded-lg bg-slate-800/80 group-hover:bg-cyan-500/10 text-slate-300 group-hover:text-cyan-400 border border-slate-700/50 group-hover:border-cyan-500/30 transition-colors shrink-0 mt-0.5">
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors truncate">
                    {item.title}
                  </h4>
                  <Badge variant={isOffline ? 'emerald' : 'cyan'} className="text-[10px] shrink-0 py-0">
                    {isOffline ? 'Offline' : 'Online'}
                  </Badge>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
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
