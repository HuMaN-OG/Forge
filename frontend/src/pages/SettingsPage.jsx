import React from 'react';
import { Settings } from 'lucide-react';
import { ProviderSettings } from '../components/settings/ProviderSettings';
import { BackendConnectionCard } from '../components/settings/BackendConnectionCard';
import { OfflinePolicyCard } from '../components/settings/OfflinePolicyCard';
import { PreferencesCard } from '../components/settings/PreferencesCard';

export function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Settings Overview Header */}
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-[#0F1626] border border-slate-800/80">
        <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/25 text-cyan-400">
          <Settings className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-slate-100">
            System Architecture & Connection Settings
          </h2>
          <p className="text-xs text-slate-400">
            Manage AI inference, backend API connectivity, airgap network enforcement, and client preferences
          </p>
        </div>
      </div>

      {/* AI Inference Provider */}
      <ProviderSettings />

      {/* Backend API Integration */}
      <BackendConnectionCard />

      {/* Airgap / Offline Policy */}
      <OfflinePolicyCard />

      {/* Preferences & Architecture Ownership */}
      <PreferencesCard />
    </div>
  );
}
