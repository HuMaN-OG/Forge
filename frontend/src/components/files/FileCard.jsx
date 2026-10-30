import React from 'react';
import { 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  File, 
  Download
} from 'lucide-react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatDate, formatFileSize } from '../../utils/formatters';

export function FileCard({ file, onDownload, onInspect }) {
  const getFileIcon = (ext) => {
    switch (ext?.toLowerCase()) {
      case 'xlsx':
      case 'xls':
        return { icon: FileSpreadsheet, color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
      case 'json':
        return { icon: FileCode, color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
      case 'pdf':
        return { icon: FileText, color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
      default:
        return { icon: File, color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30' };
    }
  };

  const { icon: FileIcon, color: iconStyle } = getFileIcon(file.extension);

  return (
    <div className="rounded-2xl bg-[#0F1626] border border-slate-800/80 p-5 space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between shadow-md">
      <div>
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className={`p-3 rounded-xl border ${iconStyle} shrink-0`}>
            <FileIcon className="w-6 h-6" />
          </div>
          <Badge variant="neutral" className="font-mono text-[10px]">
            {file.extension?.toUpperCase() || 'FILE'}
          </Badge>
        </div>

        <h3 className="text-sm font-semibold text-slate-100 truncate" title={file.name}>
          {file.name}
        </h3>
        <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
          {file.description}
        </p>
      </div>

      <div className="space-y-3 pt-3 border-t border-slate-800/60 text-xs">
        <div className="grid grid-cols-2 gap-2 text-slate-400 text-[11px]">
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Size</span>
            <span className="font-mono text-slate-200">{formatFileSize(file.sizeBytes)}</span>
          </div>
          <div>
            <span className="block text-[10px] uppercase font-bold text-slate-400">Generated</span>
            <span className="text-slate-200">{formatDate(file.createdAt)}</span>
          </div>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] font-mono text-slate-400 truncate" title={file.path}>
          <span className="text-cyan-400 font-semibold">Path: </span>{file.path}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onInspect(file)}
            className="flex-1 text-xs"
          >
            Inspect Info
          </Button>

          <Button
            variant="outline"
            size="sm"
            icon={Download}
            onClick={() => onDownload(file)}
            className="text-xs"
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
