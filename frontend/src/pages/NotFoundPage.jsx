import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import { ForgeLogo } from '../components/common/ForgeLogo';

export function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center px-4 text-xs">
      <div className="w-12 h-12 rounded-xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-3 shadow-md">
        <ForgeLogo size={24} />
      </div>
      <h1 className="text-sm font-semibold text-[#F1F3F5] mb-1">Route Not Found</h1>
      <p className="text-[11px] text-[#687180] max-w-sm mb-5 leading-relaxed">
        The requested path does not exist in the FORGE AI workspace navigation matrix.
      </p>
      <Link to="/">
        <Button variant="secondary" size="sm" icon={ArrowLeft}>
          Return to Workspace
        </Button>
      </Link>
    </div>
  );
}
