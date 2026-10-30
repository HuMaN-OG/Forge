import React, { useState, useEffect } from 'react';
import { FolderGit2, Search, Info, HardDrive } from 'lucide-react';
import { fileService } from '../services/fileService';
import { FileCard } from '../components/files/FileCard';
import { Modal } from '../components/common/Modal';
import { Button } from '../components/common/Button';
import { formatFileSize, formatDate } from '../utils/formatters';

export function FilesPage() {
  const [files, setFiles] = useState([]);
  const [search, setSearch] = useState('');
  const [extension, setExtension] = useState('all');
  const [activeModalFile, setActiveModalFile] = useState(null);
  const [downloadNotice, setDownloadNotice] = useState(null);

  useEffect(() => {
    let isCurrent = true;
    fileService.getFiles({ search, extension }).then((data) => {
      if (isCurrent) setFiles(data);
    }).catch((err) => {
      console.error('Failed to load generated files:', err);
    });
    return () => {
      isCurrent = false;
    };
  }, [search, extension]);

  const handleDownload = async (file) => {
    const res = await fileService.downloadFile(file);
    setDownloadNotice(res);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-5 text-xs">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-base font-semibold text-white tracking-tight">Generated Artifacts & Output Documents</h2>
          <p className="text-xs text-[#71717A]">Workbooks, manifests, and data extracted by FORGE automation tools</p>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-xs text-[#A1A1AA] bg-white/[0.03] px-3 py-1.5 rounded-xl border border-white/[0.06]">
          <HardDrive className="w-3.5 h-3.5 text-sky-400 stroke-[1.8]" />
          <span>{files.length} Files Recorded</span>
        </div>
      </div>

      {/* Download Feedback Notice */}
      {downloadNotice && (
        <div className="p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/25 text-xs text-sky-300 flex items-start gap-3">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block text-white">Filesystem Download Notice:</span>
            <p className="text-[#D4D4D8] leading-relaxed mt-0.5">{downloadNotice.message}</p>
          </div>
          <button
            onClick={() => setDownloadNotice(null)}
            className="text-[#71717A] hover:text-white text-base leading-none"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-2 rounded-2xl bg-[#0F1118] border border-white/[0.06]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#71717A] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.8]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts by file name or description..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-[#71717A] focus:outline-none focus:border-sky-500/40"
          />
        </div>

        <select
          value={extension}
          onChange={(e) => setExtension(e.target.value)}
          className="bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5 text-xs text-[#A1A1AA] focus:outline-none focus:border-sky-500/40 cursor-pointer"
        >
          <option value="all" className="bg-[#12141D]">All Formats</option>
          <option value="xlsx" className="bg-[#12141D]">Excel Workbooks (.xlsx)</option>
          <option value="json" className="bg-[#12141D]">Data Manifests (.json)</option>
          <option value="pdf" className="bg-[#12141D]">PDF Documents (.pdf)</option>
          <option value="csv" className="bg-[#12141D]">CSV Tables (.csv)</option>
        </select>
      </div>

      {/* Files Grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {files.map((file) => (
            <FileCard
              key={file.id}
              file={file}
              onDownload={handleDownload}
              onInspect={setActiveModalFile}
            />
          ))}
        </div>
      ) : (
        <div className="p-10 text-center rounded-2xl bg-[#0F1118] border border-white/[0.06]">
          <FolderGit2 className="w-8 h-8 text-[#71717A] mx-auto mb-2 stroke-[1.5]" />
          <h4 className="text-xs font-semibold text-white">No Generated Files Recorded</h4>
          <p className="text-[11px] text-[#71717A] mt-1 max-w-sm mx-auto">
            Artifacts produced during automated tool runs will be cataloged and accessible here.
          </p>
        </div>
      )}

      {/* File Inspection Modal */}
      {activeModalFile && (
        <Modal
          isOpen={!!activeModalFile}
          onClose={() => setActiveModalFile(null)}
          title="Generated Artifact Specification"
          subtitle={activeModalFile.name}
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-black/40 border border-white/[0.06] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-white text-sm">{activeModalFile.name}</span>
                <span className="font-mono text-sky-400 text-xs">{formatFileSize(activeModalFile.sizeBytes)}</span>
              </div>
              <p className="text-[11px] text-[#A1A1AA] leading-relaxed">{activeModalFile.description}</p>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-3 rounded-xl bg-black/20 border border-white/[0.05]">
                <span className="font-mono text-[10px] text-[#71717A] uppercase block">Filesystem Location</span>
                <span className="font-mono text-sky-300 break-all">{activeModalFile.path}</span>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-white/[0.05]">
                <span className="font-mono text-[10px] text-[#71717A] uppercase block">Associated Task</span>
                <span className="text-[#E4E4E7]">{activeModalFile.taskTitle}</span>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-white/[0.05]">
                <span className="font-mono text-[10px] text-[#71717A] uppercase block">Generation Timestamp</span>
                <span className="text-[#E4E4E7]">{formatDate(activeModalFile.createdAt)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-white/[0.06] flex items-center justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setActiveModalFile(null)}>
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  handleDownload(activeModalFile);
                  setActiveModalFile(null);
                }}
              >
                Download Stream
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
