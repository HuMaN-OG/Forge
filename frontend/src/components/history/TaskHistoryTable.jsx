import React from 'react';
import { RotateCw, Clock, CornerDownRight } from 'lucide-react';
import { formatDate, formatDuration, getStatusStyle } from '../../utils/formatters';

export function TaskHistoryTable({ tasks, onSelectTask, onReuseTask }) {
  if (!tasks || tasks.length === 0) {
    return (
      <div className="p-10 text-center rounded-xl bg-[#10141D] border border-white/[0.06] text-xs">
        <Clock className="w-8 h-8 text-[#687180] mx-auto mb-2.5 stroke-[1.5]" />
        <h4 className="text-xs font-semibold text-[#F1F3F5]">No Task History Recorded</h4>
        <p className="text-[11px] text-[#687180] mt-1 max-w-sm mx-auto">
          Tasks executed in the autonomous workspace will be indexed here with execution telemetry and output verifications.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/[0.06] bg-[#10141D] overflow-hidden text-xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.05] bg-white/[0.015] text-[10px] font-mono text-[#687180] uppercase tracking-wider">
              <th className="py-2.5 px-4 font-medium">Operation / Goal</th>
              <th className="py-2.5 px-3 font-medium">Status</th>
              <th className="py-2.5 px-3 font-medium">Environment</th>
              <th className="py-2.5 px-3 font-medium">Duration</th>
              <th className="py-2.5 px-3 font-medium">Created</th>
              <th className="py-2.5 px-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.04]">
            {tasks.map((task) => {
              const statusStyle = getStatusStyle(task.status);
              return (
                <tr 
                  key={task.id}
                  onClick={() => onSelectTask(task)}
                  className="hover:bg-white/[0.025] transition-colors cursor-pointer group"
                >
                  <td className="py-3 px-4">
                    <div className="font-medium text-[#E2E8F0] group-hover:text-[#F1F3F5] transition-colors text-xs">
                      {task.title}
                    </div>
                    <div className="text-[#687180] text-[11px] truncate max-w-md mt-0.5 font-mono flex items-center gap-1.5">
                      <CornerDownRight className="w-3 h-3 text-[#687180] shrink-0" />
                      <span className="truncate">{task.prompt}</span>
                    </div>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                      {statusStyle.label}
                    </span>
                  </td>

                  <td className="py-3 px-3 whitespace-nowrap">
                    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      task.type === 'offline' 
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                        : 'bg-[#77D9E8]/10 text-[#77D9E8] border-[#77D9E8]/20'
                    }`}>
                      {task.type === 'offline' ? 'Offline Local' : 'Online API'}
                    </span>
                  </td>

                  <td className="py-3 px-3 text-[#929AA8] whitespace-nowrap font-mono text-[11px]">
                    {formatDuration(task.durationSeconds)}
                  </td>

                  <td className="py-3 px-3 text-[#687180] whitespace-nowrap text-[11px]">
                    {formatDate(task.createdAt)}
                  </td>

                  <td className="py-3 px-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onSelectTask(task)}
                        className="px-2 py-1 rounded bg-white/[0.03] hover:bg-white/[0.08] text-[#929AA8] hover:text-[#F1F3F5] text-[11px] font-medium border border-white/[0.06] transition-colors"
                      >
                        Inspect
                      </button>
                      <button
                        onClick={() => onReuseTask(task)}
                        title="Load prompt into Workspace"
                        className="p-1 rounded bg-white/[0.03] hover:bg-white/[0.08] text-[#929AA8] hover:text-[#77D9E8] border border-white/[0.06] transition-colors"
                      >
                        <RotateCw className="w-3.5 h-3.5 stroke-[1.75]" />
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
