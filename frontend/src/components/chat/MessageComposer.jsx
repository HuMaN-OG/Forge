import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Shield, Globe, Lock, Cpu, CornerDownLeft } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export function MessageComposer({ onSubmit, disabled = false, defaultPrompt = '' }) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const textareaRef = useRef(null);
  const { isEffectivelyOnline, selectedProvider, selectedModel } = useSystem();

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
    <div className="relative rounded-xl forge-glass-dock border border-white/[0.08] p-3 shadow-xl transition-all forge-input-focus">
      <form onSubmit={handleSubmit} className="space-y-2.5">
        <textarea
          ref={textareaRef}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Instruct FORGE AI (e.g. 'Generate an Excel sales model' or 'Organize staging directory by filetype')..."
          rows={3}
          disabled={disabled}
          className="w-full bg-transparent text-sm text-[#F1F3F5] placeholder-[#687180] focus:outline-none resize-none px-1 leading-relaxed"
        />

        {/* Warning if offline airgap policy conflicts with prompt */}
        {isOnlineQuery && !isEffectivelyOnline && (
          <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>Airgap policy notice: External network access is blocked in offline mode.</span>
          </div>
        )}

        {/* Action Dock Toolbar */}
        <div className="flex items-center justify-between pt-2 border-t border-white/[0.05] text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Attachment Trigger */}
            <button
              type="button"
              title="Reference local workspace file"
              className="p-1.5 rounded-md text-[#687180] hover:text-[#929AA8] hover:bg-white/[0.04] transition-colors"
            >
              <Paperclip className="w-3.5 h-3.5 stroke-[1.75]" />
            </button>

            {/* Inference Model Indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] font-mono text-[#929AA8]">
              <Cpu className="w-3 h-3 text-[#77D9E8] stroke-[1.75]" />
              <span>{selectedProvider === 'ollama' ? 'Local' : 'Cloud'}</span>
              <span className="text-[#687180]">&bull;</span>
              <span className="text-[#F1F3F5]">{selectedModel}</span>
            </div>

            {/* Airgap Mode Pill */}
            <div className="hidden sm:flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#929AA8]">
              {isEffectivelyOnline ? (
                <>
                  <Globe className="w-3 h-3 text-emerald-400 stroke-[1.75]" />
                  <span>Network Ready</span>
                </>
              ) : (
                <>
                  <Shield className="w-3 h-3 text-amber-400 stroke-[1.75]" />
                  <span>Airgap Active</span>
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-mono text-[#687180]">
              <CornerDownLeft className="w-3 h-3" />
              <span>Enter to run</span>
            </span>

            <button
              type="submit"
              disabled={!prompt.trim() || disabled}
              className="flex items-center justify-center w-7 h-7 rounded-lg bg-[#141C2A] text-[#77D9E8] border border-[#77D9E8]/30 hover:bg-[#1A2538] hover:border-[#77D9E8]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm"
              title="Dispatch Task"
            >
              <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
