import React, { useState, useEffect } from 'react';
import { Cpu, Search, Sparkles, Trash2 } from 'lucide-react';
import { memoryService } from '../services/memoryService';
import { MemoryExplanationBanner } from '../components/memory/MemoryExplanationBanner';
import { ExperienceCard } from '../components/memory/ExperienceCard';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';

export function MemoryPage() {
  const [records, setRecords] = useState([]);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    memoryService.getRecords(search, category).then((data) => {
      if (isCurrent) setRecords(data);
    }).catch((err) => {
      console.error('Failed to load memory records:', err);
    });
    return () => {
      isCurrent = false;
    };
  }, [search, category]);

  const confirmDelete = async () => {
    if (!recordToDelete) return;
    try {
      await memoryService.deleteRecord(recordToDelete.id);
      setRecords(prev => prev.filter(r => r.id !== recordToDelete.id));
      setDeleteStatus(`Removed pattern '${recordToDelete.patternName}' successfully.`);
      setTimeout(() => setDeleteStatus(null), 3000);
    } catch (err) {
      console.error('Failed to delete pattern:', err);
    } finally {
      setRecordToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Educational Architecture Banner */}
      <MemoryExplanationBanner />

      {/* Header & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0F1626] border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search experience patterns by name, trigger phrase, or description..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All Categories</option>
          <option value="excel">Excel Automation</option>
          <option value="file system">File System Operations</option>
          <option value="document">Document Parsing</option>
        </select>
      </div>

      {/* Notification Toast */}
      {deleteStatus && (
        <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs text-cyan-300 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{deleteStatus}</span>
        </div>
      )}

      {/* Experience Patterns Grid */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {records.map((rec) => (
            <ExperienceCard
              key={rec.id}
              record={rec}
              onDelete={setRecordToDelete}
            />
          ))}
        </div>
      ) : (
        <div className="p-12 text-center rounded-2xl bg-[#0F1626] border border-slate-800/80">
          <Cpu className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No Experience Patterns Found</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or run automated tasks in the Workspace to index new procedural patterns.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <Modal
          isOpen={!!recordToDelete}
          onClose={() => setRecordToDelete(null)}
          title="Delete Experience Pattern"
          maxWidth="max-w-md"
        >
          <div className="space-y-4">
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete the pattern <strong>"{recordToDelete.patternName}"</strong>? This will remove its procedural templates and trigger phrases from future prompt augmentation.
            </p>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setRecordToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                icon={Trash2}
                onClick={confirmDelete}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
