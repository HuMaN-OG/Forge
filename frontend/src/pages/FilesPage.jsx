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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-[#0F1626] border border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
            <FolderArchive className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">
              Generated Artifacts & Documents
            </h2>
            <p className="text-xs text-slate-400">
              Workbooks, documents, and logs produced by FORGE Python automation tools
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800">
          <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
          <span>Files Tracked: {files.length}</span>
        </div>
      </div>

      {/* Download / Notice Banner */}
      {downloadNotice && (
        <div className="p-4 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-xs text-cyan-200 flex items-start gap-3">
          <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <span className="font-semibold block mb-0.5">Filesystem Download Notice</span>
            <p className="text-slate-300 leading-relaxed font-sans">{downloadNotice.message}</p>
          </div>
          <button
            onClick={() => setDownloadNotice(null)}
            className="text-cyan-400 hover:text-cyan-200 font-bold ml-2 text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0F1626] border border-slate-800/80">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search generated artifacts by file name or description..."
            className="w-full bg-slate-900/80 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        <select
          value={extension}
          onChange={(e) => setExtension(e.target.value)}
          className="bg-slate-900/80 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-cyan-500/50"
        >
          <option value="all">All File Types</option>
          <option value="xlsx">Excel Workbooks (.xlsx)</option>
          <option value="json">Data Manifests (.json)</option>
          <option value="pdf">PDF Documents (.pdf)</option>
          <option value="csv">CSV Tables (.csv)</option>
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
        <div className="p-12 text-center rounded-2xl bg-[#0F1626] border border-slate-800/80">
          <FolderArchive className="w-10 h-10 text-slate-400 mx-auto mb-3" />
          <h4 className="text-sm font-semibold text-slate-300">No Generated Files Recorded</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            When you run tasks that generate spreadsheets or reports, they will be registered and displayed here.
          </p>
        </div>
      )}

      {/* File Inspection Modal */}
      {activeModalFile && (
        <Modal
          isOpen={!!activeModalFile}
          onClose={() => setActiveModalFile(null)}
          title="Generated Artifact Inspection"
          maxWidth="max-w-lg"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 text-sm">{activeModalFile.name}</span>
                <span className="font-mono text-cyan-400 text-[11px]">{formatFileSize(activeModalFile.sizeBytes)}</span>
              </div>
              <p className="text-slate-400 leading-relaxed">{activeModalFile.description}</p>
            </div>

            <div className="space-y-2">
              <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                <span className="font-bold text-slate-400 block text-[10px] uppercase">Filesystem Location</span>
                <span className="font-mono text-cyan-300 text-[11px] break-all">{activeModalFile.path}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                <span className="font-bold text-slate-400 block text-[10px] uppercase">Associated Task</span>
                <span className="text-slate-200">{activeModalFile.taskTitle}</span>
              </div>

              <div className="p-2.5 rounded-lg bg-black/40 border border-slate-800">
                <span className="font-bold text-slate-400 block text-[10px] uppercase">Generation Date</span>
                <span className="text-slate-200">{formatDate(activeModalFile.createdAt)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
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
