import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Database } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Header Info Bar */}
      <div className="flex items-center justify-between px-1 text-xs">
        <div>
          <h2 className="text-sm font-semibold text-[#F1F3F5] tracking-tight">Audit Trail & Task History</h2>
          <p className="text-[11px] text-[#687180]">Authoritative chronological log from backend SQLite store</p>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#929AA8] bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.06]">
          <Database className="w-3 h-3 text-[#77D9E8] stroke-[1.75]" />
          <span>{tasks.length} Records</span>
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
