import React, { useState, useEffect } from 'react';
import { FolderArchive, Search, Info, HardDrive } from 'lucide-react';
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
    <div className="max-w-6xl mx-auto space-y-4 text-xs">
      {/* Header Info */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-sm font-semibold text-[#F1F3F5] tracking-tight">Generated Artifacts & Output Documents</h2>
          <p className="text-[11px] text-[#687180]">Workbooks, manifests, and data extracted by FORGE automation tools</p>
        </div>

        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[#929AA8] bg-white/[0.03] px-2.5 py-1 rounded-md border border-white/[0.06]">
          <HardDrive className="w-3 h-3 text-[#77D9E8] stroke-[1.75]" />
          <span>{files.length} Files Recorded</span>
        </div>
      </div>

      {/* Download Feedback Notice */}
      {downloadNotice && (
        <div className="p-3 rounded-lg bg-[#77D9E8]/10 border border-[#77D9E8]/20 text-[11px] text-[#77D9E8] flex items-start gap-2.5">
          <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-semibold block">Filesystem Notice:</span>
            <p className="text-[#D1D5DB] leading-relaxed mt-0.5">{downloadNotice.message}</p>
          </div>
          <button
            onClick={() => setDownloadNotice(null)}
            className="text-[#929AA8] hover:text-[#F1F3F5] text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 p-2.5 rounded-xl bg-[#10141D] border border-white/[0.06]">
        <div className="relative flex-1">
          <Search className="w-3.5 h-3.5 text-[#687180] absolute left-3 top-1/2 -translate-y-1/2 stroke-[1.75]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search artifacts by file name or description..."
            className="w-full bg-white/[0.03] border border-white/[0.06] rounded-lg pl-8 pr-3 py-1.5 text-xs text-[#F1F3F5] placeholder-[#687180] focus:outline-none focus:border-[#77D9E8]/40"
          />
        </div>

        <select
          value={extension}
          onChange={(e) => setExtension(e.target.value)}
          className="bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1.5 text-xs text-[#929AA8] focus:outline-none focus:border-[#77D9E8]/40 cursor-pointer"
        >
          <option value="all">All File Formats</option>
          <option value="xlsx">Excel Spreadsheets (.xlsx)</option>
          <option value="json">Data Manifests (.json)</option>
          <option value="pdf">PDF Documents (.pdf)</option>
          <option value="csv">CSV Tables (.csv)</option>
        </select>
      </div>

      {/* Files Grid */}
      {files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
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
        <div className="p-10 text-center rounded-xl bg-[#10141D] border border-white/[0.06]">
          <FolderArchive className="w-8 h-8 text-[#687180] mx-auto mb-2 stroke-[1.5]" />
          <h4 className="text-xs font-semibold text-[#F1F3F5]">No Generated Files Recorded</h4>
          <p className="text-[11px] text-[#687180] mt-1 max-w-sm mx-auto">
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
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-lg bg-black/40 border border-white/[0.05] space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#F1F3F5]">{activeModalFile.name}</span>
                <span className="font-mono text-[#77D9E8] text-[11px]">{formatFileSize(activeModalFile.sizeBytes)}</span>
              </div>
              <p className="text-[11px] text-[#929AA8] leading-relaxed">{activeModalFile.description}</p>
            </div>

            <div className="space-y-2 text-[11px]">
              <div className="p-2.5 rounded bg-black/20 border border-white/[0.04]">
                <span className="font-mono text-[10px] text-[#687180] uppercase block">Absolute Disk Location</span>
                <span className="font-mono text-[#77D9E8] break-all">{activeModalFile.path}</span>
              </div>

              <div className="p-2.5 rounded bg-black/20 border border-white/[0.04]">
                <span className="font-mono text-[10px] text-[#687180] uppercase block">Originating Task</span>
                <span className="text-[#E2E8F0]">{activeModalFile.taskTitle}</span>
              </div>

              <div className="p-2.5 rounded bg-black/20 border border-white/[0.04]">
                <span className="font-mono text-[10px] text-[#687180] uppercase block">Recorded Timestamp</span>
                <span className="text-[#E2E8F0]">{formatDate(activeModalFile.createdAt)}</span>
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
