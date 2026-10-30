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
    <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 space-y-3.5 text-xs">
      <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.05]">
        <div className="flex items-center gap-2">
          <Sliders className="w-3.5 h-3.5 text-[#6EA8FF] stroke-[1.75]" />
          <h3 className="font-semibold text-[#F1F3F5] text-xs">Architecture Boundaries & Team Ownership</h3>
        </div>
      </div>

      <div className="space-y-3">
        {/* Storage Boundaries Explanation */}
        <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-1">
          <span className="font-medium text-[#F1F3F5] flex items-center gap-1.5 text-[11px]">
            <Database className="w-3 h-3 text-[#77D9E8] stroke-[1.75]" />
            <span>Strict Storage Boundary</span>
          </span>
          <p className="text-[11px] text-[#687180] leading-relaxed">
            The frontend never treats browser <code>localStorage</code> as AI memory. <code>localStorage</code> is reserved exclusively for non-sensitive client preferences (theme, connection mode, input drafts). All authoritative task history, verification hashes, and experience templates reside in the backend SQLite database.
          </p>
        </div>

        {/* Team Ownership Matrix */}
        <div className="p-3 rounded-lg bg-black/30 border border-white/[0.04] space-y-2">
          <span className="font-medium text-[#F1F3F5] flex items-center gap-1.5 text-[11px]">
            <Users className="w-3 h-3 text-[#77D9E8] stroke-[1.75]" />
            <span>Engineering Ownership Structure</span>
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-mono">
            <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
              <span className="text-[#77D9E8] font-bold block">Vansh</span>
              <span className="text-[#687180]">Frontend, UI/UX, Design Systems</span>
            </div>
            <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
              <span className="text-emerald-400 font-bold block">Bhuvan</span>
              <span className="text-[#687180]">Backend, Express, Ollama, SQLite</span>
            </div>
            <div className="p-2 rounded bg-white/[0.02] border border-white/[0.04]">
              <span className="text-amber-400 font-bold block">Priyanshu</span>
              <span className="text-[#687180]">Python Engine, Playwright Tools</span>
            </div>
          </div>
        </div>

        {/* Reset Action */}
        <div className="pt-2 flex items-center justify-between text-[11px]">
          <span className="text-[#687180]">
            Purge local client cache and restore initial defaults.
          </span>
          <Button
            variant="outline"
            size="xs"
            icon={RotateCcw}
            onClick={handleResetPreferences}
          >
            Reset Client Cache
          </Button>
        </div>
      </div>
    </div>
  );
}
