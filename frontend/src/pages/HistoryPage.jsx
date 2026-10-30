import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database, Search } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskHistoryTable } from '../components/history/TaskHistoryTable';
import { TaskDetailModal } from '../components/history/TaskDetailModal';

export function HistoryPage() {
  const { tasks, reuseTask } = useTasks();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);

  const filterTabs = [
    { id: 'all', label: 'All Executions', count: tasks.length },
    { id: 'completed', label: 'Completed', count: tasks.filter(t => t.status === 'completed').length },
    { id: 'waiting_approval', label: 'Action Needed', count: tasks.filter(t => t.status === 'waiting_approval').length },
    { id: 'failed', label: 'Failed / Denied', count: tasks.filter(t => ['failed', 'rejected'].includes(t.status)).length }
  ];

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = !search || 
        task.title.toLowerCase().includes(search.toLowerCase()) || 
        task.prompt.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'failed' 
          ? ['failed', 'rejected'].includes(task.status.toLowerCase())
          : task.status.toLowerCase() === statusFilter.toLowerCase());

      return matchesSearch && matchesStatus;
    });
  }, [tasks, search, statusFilter]);

  const handleReuse = (task) => {
    reuseTask(task);
    navigate('/');
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header Info Bar */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Audit Trail & Task History</h2>
          <p className="text-xs text-[#71717A]">Chronological record of automated tasks stored authoritatively in SQLite</p>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-[#A1A1AA] bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.06]">
          <Database className="w-3.5 h-3.5 text-sky-400 stroke-[1.8]" />
          <span>{tasks.length} Total Records</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#0F1118] border border-white/[0.06]">
        {/* Status Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                statusFilter === tab.id
                  ? 'bg-white/[0.08] text-white border border-white/[0.08] shadow-xs'
                  : 'text-[#8E8EA0] hover:text-[#EDEDED] hover:bg-white/[0.03]'
              }`}
            >
              <span>{tab.label}</span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-white/[0.05] text-[#A1A1AA]">
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Instant Search Bar */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search audit trail..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-sky-500/40"
          />
        </div>
      </div>

      {/* Audit Table */}
      <TaskHistoryTable
        tasks={filteredTasks}
        onSelectTask={setSelectedTask}
        onReuseTask={handleReuse}
      />

      {/* Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          onReuse={handleReuse}
        />
      )}
    </div>
  );
}
