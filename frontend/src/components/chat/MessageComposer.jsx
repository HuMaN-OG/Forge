import React, { useState, useRef, useEffect } from 'react';
import { Send, CornerDownLeft, AlertCircle, Shield } from 'lucide-react';
import { Button } from '../common/Button';
import { useSystem } from '../../context/SystemContext';

export function MessageComposer({ onSubmit, disabled = false, defaultPrompt = '' }) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const textareaRef = useRef(null);
  const { isEffectivelyOnline } = useSystem();

  useEffect(() => {
    if (defaultPrompt) {
      setPrompt(defaultPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [defaultPrompt]);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!prompt.trim() || disabled) return;
    onSubmit(prompt.trim());
    setPrompt('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const isOnlineQuery = /search|scrape|web|online|download|cloud/i.test(prompt);

  return (
    <div className="relative rounded-2xl bg-[#0F1626] border border-slate-800/80 p-3 shadow-xl focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
      <form onSubmit={handleSubmit} className="space-y-2">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Instruct FORGE AI (e.g., 'Create a Q3 sales spreadsheet in Excel' or 'Organize the staging folder by file extension')..."
          rows={3}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-400 focus:outline-none resize-none px-2 py-1 leading-relaxed"
        />

        {/* Warning if offline and user types an online query */}
        {isOnlineQuery && !isEffectivelyOnline && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Notice: Online keyword detected. Airgap offline mode will reject external network connections.</span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span className="hidden sm:inline-flex items-center gap-1 font-mono text-[11px]">
              <CornerDownLeft className="w-3 h-3 text-slate-400" />
              <span>Enter to run</span>
            </span>
            <span className="hidden sm:inline-block text-slate-400">&bull;</span>
            <span className="text-[11px] flex items-center gap-1 text-emerald-400/90">
              <Shield className="w-3 h-3" />
              <span>Permission Gate Active</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="submit"
              variant="primary"
              size="sm"
              icon={Send}
              iconPosition="right"
              disabled={!prompt.trim() || disabled}
              className="px-4"
            >
              Dispatch Task
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
