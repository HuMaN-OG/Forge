import React from 'react';
import { Sliders, Database, RotateCcw, Users } from 'lucide-react';
import { Button } from '../common/Button';
import { STORAGE_KEYS } from '../../utils/constants';

export function PreferencesCard() {
  const handleResetPreferences = () => {
    localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    localStorage.removeItem(STORAGE_KEYS.DRAFT);
    window.location.reload();
  };

  return (
    <div className="rounded-2xl bg-[#0F1626] border border-slate-800/80 p-5 space-y-4 shadow-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/25 text-purple-400">
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">
              Frontend Storage & Team Architecture
            </h3>
            <p className="text-xs text-slate-400">
              Client storage separation and team ownership mapping
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-3 text-xs">
        {/* Storage Boundaries Explanation */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>Strict Storage Architecture Boundary</span>
          </span>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            The frontend never substitutes browser <code>localStorage</code> for authoritative AI memory. <code>localStorage</code> is used exclusively for non-sensitive client preferences (theme, connection mode, input drafts). All authoritative task history, verification hashes, and experience templates reside in the backend SQLite database.
          </p>
        </div>

        {/* Team Ownership Matrix */}
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
          <span className="font-semibold text-slate-300 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-cyan-400" />
            <span>Project Team Ownership</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
            <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
              <span className="font-bold text-cyan-400 block">Vansh</span>
              <span className="text-slate-400">Frontend, React UI/UX, Client Services</span>
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
              <span className="font-bold text-emerald-400 block">Bhuvan</span>
              <span className="text-slate-400">Backend, Express, Ollama, SQLite</span>
            </div>
            <div className="p-2 rounded-lg bg-black/40 border border-slate-800">
              <span className="font-bold text-amber-400 block">Priyanshu</span>
              <span className="text-slate-400">Python Tools, Playwright Automation</span>
            </div>
          </div>
        </div>

        {/* Reset Action */}
        <div className="pt-2 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">
            Clear browser client settings cache and restore initial defaults.
          </span>
          <Button
            variant="outline"
            size="sm"
            icon={RotateCcw}
            onClick={handleResetPreferences}
            className="text-xs"
          >
            Reset Client Cache
          </Button>
        </div>
      </div>
    </div>
  );
}
