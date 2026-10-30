import React from 'react';
import { Search, RotateCcw } from 'lucide-react';

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
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#10141D] border border-white/[0.06] text-xs">
      {/* Search Input */}
      <div className="relative flex-1">
        <Search className="w-3.5 h-3.5 text-[#687180] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter audit log by prompt, tool, or task title..."
          className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F1F3F5] placeholder-[#687180] focus:outline-none focus:border-[#77D9E8]/40"
        />
      </div>

      {/* Select Filters */}
      <div className="flex items-center gap-2">
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-[#929AA8] focus:outline-none focus:border-[#77D9E8]/40 cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="completed">Completed</option>
          <option value="waiting_approval">Waiting Approval</option>
          <option value="executing">Executing</option>
          <option value="failed">Failed / Denied</option>
        </select>

        <select
          value={typeFilter}
          onChange={(e) => onTypeChange(e.target.value)}
          className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-[#929AA8] focus:outline-none focus:border-[#77D9E8]/40 cursor-pointer"
        >
          <option value="all">All Environments</option>
          <option value="offline">Offline Local</option>
          <option value="online_only">Online External</option>
        </select>

        {(search || statusFilter !== 'all' || typeFilter !== 'all') && (
          <button
            onClick={onReset}
            title="Reset Filters"
            className="p-1.5 rounded-lg bg-white/[0.04] text-[#929AA8] hover:text-[#F1F3F5] hover:bg-white/[0.08] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[1.75]" />
          </button>
        )}
      </div>
    </div>
  );
}
