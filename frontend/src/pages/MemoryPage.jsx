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
      setDeleteStatus(`Pattern '${recordToDelete.patternName}' removed from memory store.`);
      setTimeout(() => setDeleteStatus(null), 3000);
    } catch (err) {
      console.error('Failed to delete pattern:', err);
    } finally {
      setRecordToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4 text-xs">
      {/* Educational Architecture Specification */}
      <MemoryExplanationBanner />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#10141D] border border-white/[0.06]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#687180] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search experience patterns by name, trigger phrase, or procedure..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F1F3F5] placeholder-[#687180] focus:outline-none focus:border-[#77D9E8]/40"
          />
        </div>

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-[#929AA8] focus:outline-none focus:border-[#77D9E8]/40 cursor-pointer"
        >
          <option value="all">All Domains</option>
          <option value="excel">Excel Automation</option>
          <option value="file system">File System Operations</option>
          <option value="document">Document Parsing</option>
        </select>
      </div>

      {/* Notification Toast */}
      {deleteStatus && (
        <div className="p-2.5 rounded-lg bg-[#77D9E8]/10 border border-[#77D9E8]/20 text-[11px] text-[#77D9E8] flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0" />
          <span>{deleteStatus}</span>
        </div>
      )}

      {/* Patterns Grid */}
      {records.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {records.map((rec) => (
            <ExperienceCard
              key={rec.id}
              record={rec}
              onDelete={setRecordToDelete}
            />
          ))}
        </div>
      ) : (
        <div className="p-10 text-center rounded-xl bg-[#10141D] border border-white/[0.06]">
          <Cpu className="w-8 h-8 text-[#687180] mx-auto mb-2 stroke-[1.5]" />
          <h4 className="text-xs font-semibold text-[#F1F3F5]">No Experience Patterns Found</h4>
          <p className="text-[11px] text-[#687180] mt-1 max-w-sm mx-auto">
            Try adjusting search terms or execute automated tasks in the workspace to index new procedural patterns.
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
          <div className="space-y-4 text-xs">
            <p className="text-[#929AA8] leading-relaxed">
              Are you sure you want to remove <strong>"{recordToDelete.patternName}"</strong> from the memory index? This procedural recipe will no longer be retrieved during automated planning.
            </p>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
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
                Delete Pattern
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
