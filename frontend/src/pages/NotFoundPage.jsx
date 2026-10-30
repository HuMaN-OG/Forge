import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 shadow-lg shadow-cyan-950/30">
        <Bot className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold text-slate-100 mb-2">404 - Workspace Route Not Found</h1>
      <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
        The requested panel or route does not exist in the FORGE AI workspace navigation matrix.
      </p>
      <Link to="/">
        <Button variant="primary" size="md" icon={ArrowLeft}>
          Return to Autonomous Workspace
        </Button>
      </Link>
    </div>
  );
}
