import React from 'react';
import { 
  FileSpreadsheet, 
  FileCode, 
  FileText, 
  File, 
  Download
} from 'lucide-react';
import { Button } from '../common/Button';
import { formatDate, formatFileSize } from '../../utils/formatters';

export function FileCard({ file, onDownload, onInspect }) {
  const getFileIcon = (ext) => {
    switch (ext?.toLowerCase()) {
      case 'xlsx':
      case 'xls':
        return { icon: FileSpreadsheet, style: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' };
      case 'json':
        return { icon: FileCode, style: 'text-amber-400 bg-amber-500/10 border-amber-500/20' };
      case 'pdf':
        return { icon: FileText, style: 'text-rose-400 bg-rose-500/10 border-rose-500/20' };
      default:
        return { icon: File, style: 'text-[#77D9E8] bg-[#77D9E8]/10 border-[#77D9E8]/20' };
    }
  };

  const { icon: FileIcon, style: iconStyle } = getFileIcon(file.extension);

  return (
    <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 space-y-3 hover:border-white/[0.12] transition-colors flex flex-col justify-between text-xs">
      <div>
        <div className="flex items-start justify-between gap-3 mb-2.5">
          <div className={`p-2.5 rounded-lg border ${iconStyle} shrink-0`}>
            <FileIcon className="w-5 h-5 stroke-[1.75]" />
          </div>
          <span className="font-mono text-[10px] text-[#687180] bg-white/[0.02] px-1.5 py-0.5 rounded border border-white/[0.05]">
            {file.extension?.toUpperCase() || 'FILE'}
          </span>
        </div>

        <h3 className="text-xs font-semibold text-[#F1F3F5] truncate" title={file.name}>
          {file.name}
        </h3>
        <p className="text-[11px] text-[#687180] mt-0.5 line-clamp-2 leading-relaxed">
          {file.description}
        </p>
      </div>

      <div className="space-y-2.5 pt-2.5 border-t border-white/[0.04]">
        <div className="flex items-center justify-between text-[11px] text-[#687180]">
          <span className="font-mono text-[#929AA8]">{formatFileSize(file.sizeBytes)}</span>
          <span>{formatDate(file.createdAt)}</span>
        </div>

        <div className="p-1.5 rounded bg-black/30 border border-white/[0.03] text-[10px] font-mono text-[#687180] truncate" title={file.path}>
          <span className="text-[#77D9E8]">path: </span>{file.path}
        </div>

        <div className="flex items-center gap-2 pt-1">
          <Button
            variant="secondary"
            size="xs"
            onClick={() => onInspect(file)}
            className="flex-1"
          >
            Inspect Info
          </Button>

          <Button
            variant="outline"
            size="xs"
            icon={Download}
            onClick={() => onDownload(file)}
          >
            Download
          </Button>
        </div>
      </div>
    </div>
  );
}
