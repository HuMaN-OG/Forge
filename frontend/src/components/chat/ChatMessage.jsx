import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { ForgeLogo } from '../common/ForgeLogo';
import { formatRelativeTime } from '../../utils/formatters';

export function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-start my-3">
        <div className={`flex items-start gap-2.5 px-3.5 py-2 rounded-lg text-xs max-w-xl ${
          message.isError 
            ? 'bg-rose-500/10 border border-rose-500/20 text-rose-300' 
            : 'bg-white/[0.03] border border-white/[0.06] text-[#929AA8]'
        }`}>
          {message.isError ? (
            <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <Shield className="w-3.5 h-3.5 text-[#77D9E8] shrink-0 mt-0.5" />
          )}
          <span className="leading-relaxed">{message.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 my-4 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-7 h-7 rounded-lg bg-[#121622] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
          <ForgeLogo size={14} />
        </div>
      )}

      <div className={`max-w-2xl rounded-xl p-4 text-xs leading-relaxed ${
        isUser
          ? 'bg-[#141A26] border border-white/[0.08] text-[#F1F3F5] rounded-tr-xs'
          : 'bg-[#10141D] border border-white/[0.05] text-[#D1D5DB] rounded-tl-xs'
      }`}>
        <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-white/[0.04]">
          <span className="text-[10px] font-mono tracking-wider uppercase text-[#687180]">
            {isUser ? 'Operator' : 'FORGE System'}
          </span>
          <span className="text-[10px] text-[#687180] font-mono">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>

        <div className="whitespace-pre-wrap space-y-2 text-xs leading-relaxed text-[#E5E7EB]">
          {message.text}
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-lg bg-[#162030] border border-[#77D9E8]/30 flex items-center justify-center text-[10px] font-mono font-semibold text-[#77D9E8] shrink-0 mt-0.5">
          V
        </div>
      )}
    </div>
  );
}
