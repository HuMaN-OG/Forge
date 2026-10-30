import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Shield, Globe, Lock, Cpu } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export function MessageComposer({ onSubmit, disabled = false, defaultPrompt = '' }) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const textareaRef = useRef(null);
  const { isEffectivelyOnline, selectedModel } = useSystem();

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

  const hasText = prompt.trim().length > 0;
  const isOnlineQuery = /search|scrape|web|online|download|cloud/i.test(prompt);

  return (
    <div className="w-full max-w-3xl mx-auto">
      <div className="relative rounded-2xl forge-glass-floating border border-white/[0.1] p-3.5 shadow-2xl transition-all focus-within:border-sky-500/40 focus-within:ring-2 focus-within:ring-sky-500/15">
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask FORGE to automate, organize files, or build spreadsheets..."
            rows={2}
            disabled={disabled}
            className="w-full bg-transparent text-sm text-[#F4F4F5] placeholder-[#71717A] focus:outline-none resize-none px-1.5 leading-relaxed"
          />

          {/* Warning banner if prompt needs web but airgap is on */}
          {isOnlineQuery && !isEffectivelyOnline && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>Offline Airgap is enforced: outbound web requests will be blocked.</span>
            </div>
          )}

          {/* Controls Bar */}
          <div className="flex items-center justify-between pt-1 border-t border-white/[0.05] text-xs">
            <div className="flex items-center gap-2">
              {/* Attachment chip */}
              <button
                type="button"
                title="Select permitted local workspace file"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#8E8EA0] hover:text-[#EDEDED] hover:bg-white/[0.05] transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5 stroke-[1.8]" />
                <span className="text-[11px] hidden sm:inline">Attach file</span>
              </button>

              {/* Engine chip */}
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#A1A1AA]">
                <Cpu className="w-3 h-3 text-sky-400 stroke-[1.8]" />
                <span>{selectedModel}</span>
              </div>

              {/* Airgap badge */}
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#A1A1AA]">
                {isEffectivelyOnline ? (
                  <>
                    <Globe className="w-3 h-3 text-emerald-400 stroke-[1.8]" />
                    <span>Online</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-3 h-3 text-amber-400 stroke-[1.8]" />
                    <span>Airgapped</span>
                  </>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-[#71717A]">
                <span>↵ Send</span>
              </span>

              <button
                type="submit"
                disabled={!hasText || disabled}
                className={`flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-150 active:scale-95 shadow-md ${
                  hasText && !disabled
                    ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-sky-500/25 cursor-pointer hover:opacity-90'
                    : 'bg-white/[0.05] text-[#52525B] cursor-not-allowed border border-white/[0.06]'
                }`}
                title="Dispatch prompt"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.2]" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
