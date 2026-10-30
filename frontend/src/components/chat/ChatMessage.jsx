import React from 'react';
import { Bot, User, AlertTriangle, ShieldCheck } from 'lucide-react';
import { formatRelativeTime } from '../../utils/formatters';

export function ChatMessage({ message }) {
  const isUser = message.sender === 'user';
  const isSystem = message.sender === 'system';

  if (isSystem) {
    return (
      <div className="flex justify-center my-3">
        <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs max-w-xl ${
          message.isError 
            ? 'bg-rose-500/10 border border-rose-500/30 text-rose-300' 
            : 'bg-slate-800/80 border border-slate-700/60 text-slate-300'
        }`}>
          {message.isError ? (
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
          ) : (
            <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex gap-3 my-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950 shrink-0 shadow-md shadow-cyan-500/20">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className={`max-w-2xl rounded-2xl p-4 shadow-sm ${
        isUser
          ? 'bg-gradient-to-br from-cyan-600/90 to-blue-700/90 text-white rounded-tr-sm border border-cyan-400/20'
          : 'bg-[#101726] border border-slate-800 rounded-tl-sm text-slate-200'
      }`}>
        <div className="flex items-center justify-between gap-4 mb-1.5 pb-1 border-b border-white/10">
          <span className="text-[11px] font-semibold tracking-wide uppercase opacity-75">
            {isUser ? 'Operator' : 'FORGE AI'}
          </span>
          <span className="text-[10px] opacity-60 font-mono">
            {formatRelativeTime(message.timestamp)}
          </span>
        </div>

        <div className="text-sm leading-relaxed whitespace-pre-wrap space-y-2">
          {message.text}
        </div>
      </div>

      {isUser && (
        <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}
