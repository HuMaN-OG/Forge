import React from 'react';
import { Search, RefreshCw } from 'lucide-react';

export function TaskFilterBar({
  search,
  onSearchChange,
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  onReset
}) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0F1626] border border-slate-800/80 mb-6">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search historical tasks by prompt or title..."
          className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
        />
      </div>

      {/* Filter Selectors */}
      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="waiting_approval">Waiting Approval</option>
          <option value="executing">Executing</option>
          <option value="failed">Failed / Rejected</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Types</option>
          <option value="offline">Offline Local</option>
          <option value="online_only">Online Only</option>
        </select>

        {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
          <button
            onClick={onReset}
            title="Reset Filters"
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
