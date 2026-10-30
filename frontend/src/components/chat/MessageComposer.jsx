import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Paperclip, Shield, Globe, Lock, Cpu, Mic, MicOff, Volume2, VolumeX, AlertCircle } from 'lucide-react';
import { useSystem } from '../../context/SystemContext';

export function MessageComposer({ onSubmit, disabled = false, defaultPrompt = '' }) {
  const [prompt, setPrompt] = useState(defaultPrompt);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState(null);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const { isEffectivelyOnline, selectedModel } = useSystem();

  // Initialize Web Speech API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(r => r[0].transcript)
          .join('');
        setPrompt(transcript);
      };

      recognition.onerror = (event) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access in your browser.');
        } else if (event.error === 'no-speech') {
          setSpeechError('No speech detected. Please speak clearly into your microphone.');
        } else {
          setSpeechError(`Voice recognition: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  useEffect(() => {
    if (defaultPrompt) {
      setPrompt(defaultPrompt);
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }, [defaultPrompt]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      setSpeechError('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpeechError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
      }
    }
  };

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!prompt.trim() || disabled) return;
    onSubmit(prompt.trim());
    setPrompt('');
    setSpeechError(null);
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
            placeholder="Ask FORGE to automate, control desktop apps, or build documents..."
            rows={2}
            disabled={disabled}
            className="w-full bg-transparent text-sm text-[#F4F4F5] placeholder-[#71717A] focus:outline-none resize-none px-1.5 leading-relaxed"
          />

          {/* Active Listening Indicator Banner */}
          {isListening && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs text-rose-300 animate-pulse">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500" />
                </span>
                <span>Listening... Speak your command into the microphone</span>
              </div>
              <button
                type="button"
                onClick={toggleListening}
                className="text-[11px] underline hover:text-rose-100"
              >
                Stop
              </button>
            </div>
          )}

          {/* Speech Error Banner */}
          {speechError && (
            <div className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{speechError}</span>
              </div>
              <button
                type="button"
                onClick={() => setSpeechError(null)}
                className="text-[11px] opacity-70 hover:opacity-100"
              >
                Dismiss
              </button>
            </div>
          )}

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
              {/* Voice Input Microphone Button */}
              <button
                type="button"
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Click to speak voice command"}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all ${
                  isListening
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'text-[#8E8EA0] hover:text-[#EDEDED] hover:bg-white/[0.05]'
                }`}
              >
                {isListening ? (
                  <MicOff className="w-3.5 h-3.5 text-rose-400 stroke-[1.8]" />
                ) : (
                  <Mic className="w-3.5 h-3.5 stroke-[1.8]" />
                )}
                <span className="text-[11px]">{isListening ? 'Listening' : 'Voice'}</span>
              </button>

              {/* TTS Audio Response Toggle */}
              <button
                type="button"
                onClick={() => setTtsEnabled(!ttsEnabled)}
                title={ttsEnabled ? "Voice response enabled (SpeechSynthesis)" : "Voice response muted"}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-colors ${
                  ttsEnabled
                    ? 'bg-sky-500/15 text-sky-300 border border-sky-500/25'
                    : 'text-[#8E8EA0] hover:text-[#EDEDED] hover:bg-white/[0.05]'
                }`}
              >
                {ttsEnabled ? (
                  <Volume2 className="w-3.5 h-3.5 text-sky-400 stroke-[1.8]" />
                ) : (
                  <VolumeX className="w-3.5 h-3.5 stroke-[1.8]" />
                )}
                <span className="text-[11px] hidden sm:inline">Audio</span>
              </button>

              {/* Attachment chip */}
              <button
                type="button"
                title="Select permitted local workspace file"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[#8E8EA0] hover:text-[#EDEDED] hover:bg-white/[0.05] transition-colors"
              >
                <Paperclip className="w-3.5 h-3.5 stroke-[1.8]" />
                <span className="text-[11px] hidden sm:inline">Attach</span>
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
