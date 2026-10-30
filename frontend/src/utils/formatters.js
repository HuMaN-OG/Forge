import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  }).format(date);
}

export function formatRelativeTime(timestamp) {
  if (!timestamp) return '—';
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  return `${Math.floor(diffInSeconds / 86400)}d ago`;
}

export function formatDuration(msOrSec) {
  if (!msOrSec && msOrSec !== 0) return '—';
  const seconds = msOrSec > 100 ? Math.round(msOrSec / 1000) : msOrSec;
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const remSec = seconds % 60;
  return `${mins}m ${remSec}s`;
}

export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  if (!bytes) return '—';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getStatusStyle(status) {
  switch (status?.toLowerCase()) {
    case 'completed':
    case 'success':
      return {
        bg: 'bg-emerald-500/10',
        text: 'text-emerald-300',
        border: 'border-emerald-500/20',
        dot: 'bg-emerald-400',
        label: 'Completed'
      };
    case 'executing':
    case 'running':
      return {
        bg: 'bg-[#77D9E8]/10',
        text: 'text-[#77D9E8]',
        border: 'border-[#77D9E8]/25',
        dot: 'bg-[#77D9E8] animate-pulse',
        label: 'Executing'
      };
    case 'waiting_approval':
    case 'approval_needed':
      return {
        bg: 'bg-amber-500/10',
        text: 'text-amber-300',
        border: 'border-amber-500/25',
        dot: 'bg-amber-400',
        label: 'Approval Gate'
      };
    case 'planning':
    case 'understanding':
      return {
        bg: 'bg-blue-500/10',
        text: 'text-blue-300',
        border: 'border-blue-500/20',
        dot: 'bg-blue-400',
        label: 'Planning'
      };
    case 'failed':
    case 'rejected':
      return {
        bg: 'bg-rose-500/10',
        text: 'text-rose-300',
        border: 'border-rose-500/20',
        dot: 'bg-rose-400',
        label: status === 'rejected' ? 'Denied' : 'Failed'
      };
    default:
      return {
        bg: 'bg-white/[0.04]',
        text: 'text-slate-400',
        border: 'border-white/[0.06]',
        dot: 'bg-slate-500',
        label: 'Idle'
      };
  }
}
