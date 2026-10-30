import React from 'react';
import { 
  RotateCw, 
  Clock
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { formatDate, formatDuration, getStatusStyle } from '../../utils/formatters';

export function TaskHistoryTable({ tasks, onSelectTask, onReuseTask }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-12 text-center rounded-2xl bg-[#0F1626] border border-slate-800/80">
        <Clock className="w-10 h-10 text-slate-400 mx-auto mb-3" />
        <h4 className="text-sm font-semibold text-slate-300">No Task History Found</h4>
        <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
          Tasks you run from the Autonomous Workspace will be persisted here along with execution logs and output verifications.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800/80 bg-[#0F1626] overflow-hidden shadow-lg shadow-black/20">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">Task / Goal</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Environment</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Created</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {tasks.map((task) => {
              const statusStyle = getStatusStyle(task.status);
              return (
                <tr 
                  key={task.id}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectTask(task)}
                >
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      {task.title}
                    </div>
                    <p className="text-slate-400 text-[11px] truncate max-w-md mt-0.5 font-mono">
                      {task.prompt}
                    </p>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {statusStyle.label}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <Badge variant={task.type === 'offline' ? 'emerald' : 'cyan'} className="text-[10px] py-0">
                      {task.type === 'offline' ? 'Offline Local' : 'Online External'}
                    </Badge>
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap font-mono">
                    {formatDuration(task.durationSeconds)}
                  </td>

                  <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                    {formatDate(task.createdAt)}
                  </td>

                  <td className="py-3.5 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectTask(task)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onReuseTask(task)}
                        title="Load prompt into Workspace"
                        className="p-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 transition-colors"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
