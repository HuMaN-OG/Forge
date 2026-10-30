import React from 'react';
import { Shield, AlertCircle } from 'lucide-react';
import { ForgeLogo } from '../common/ForgeLogo';
import { formatRelativeTime } from '../../utils/formatters';

export function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-start my-4">
        <div className={`flex items-start gap-3 px-4 py-3 rounded-xl text-xs max-w-xl ${
          message.isError 
            ? 'bg-rose-500/10 border border-rose-500/25 text-rose-300' 
            : 'bg-white/[0.03] border border-white/[0.08] text-[#A1A1AA]'
        }`}>
          {message.isError ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 stroke-[1.8]" />
          ) : (
            <Shield className="w-4 h-4 text-sky-400 shrink-0 mt-0.5 stroke-[1.8]" />
          )}
          <span className="leading-relaxed">{message.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3.5 my-5 group ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
          <ForgeLogo size={16} />
        </div>
      )}

      <div className={`max-w-2xl rounded-2xl p-4 text-[13px] leading-relaxed shadow-sm ${
        isUser
          ? 'bg-[#181B26] border border-indigo-500/20 text-[#F4F4F5] rounded-tr-xs'
          : 'bg-[#11131B] border border-white/[0.07] text-[#D4D4D8] rounded-tl-xs'
      }`}>
        <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-white/[0.05]">
          <span className="text-[11px] font-medium text-[#71717A]">
            {isUser ? 'You' : 'Forge Assistant'}
          </span>
          <span className="text-[10px] text-[#52525B] font-mono">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>

        <div className="whitespace-pre-wrap space-y-2 text-[#E4E4E7] leading-relaxed">
          {message.text}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-xs font-semibold text-white shrink-0 mt-0.5 shadow-sm">
          V
        </div>
      )}
    </div>
  );
}
