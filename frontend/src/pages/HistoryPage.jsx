import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, Database } from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { TaskFilterBar } from '../components/history/TaskFilterBar';
import { TaskHistoryTable } from '../components/history/TaskHistoryTable';
import { TaskDetailModal } from '../components/history/TaskDetailModal';

export function HistoryPage() {
  const { tasks, reuseTask } = useTasks();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState(null);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch = !search || 
        task.title.toLowerCase().includes(search.toLowerCase()) || 
        task.prompt.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'failed' 
          ? ['failed', 'rejected'].includes(task.status.toLowerCase())
          : task.status.toLowerCase() === statusFilter.toLowerCase());

      const matchesType = typeFilter === 'all' || task.type === typeFilter;

      return matchesSearch && matchesStatus && matchesType;
    });
  }, [tasks, search, statusFilter, typeFilter]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const handleReuse = (task) => {
    reuseTask(task);
    navigate('/');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0F1626] border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
            <History className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Task Execution History & Metrics
            </h2>
            <p className="text-xs text-slate-400">
              Complete chronological audit trail stored authoritatively in SQLite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span>Total Records: {tasks.length}</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <TaskFilterBar
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusChange={setStatusFilter}
        typeFilter={typeFilter}
        onTypeChange={setTypeFilter}
        onReset={handleResetFilters}
      />

      {/* Tasks Table */}
      <TaskHistoryTable
        tasks={filteredTasks}
        onSelectTask={setSelectedTask}
        onReuseTask={handleReuse}
      />

      {/* Task Details Modal */}
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
