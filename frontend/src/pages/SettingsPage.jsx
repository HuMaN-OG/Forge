import React from 'react';
import { ProviderSettings } from '../components/settings/ProviderSettings';
import { BackendConnectionCard } from '../components/settings/BackendConnectionCard';
import { OfflinePolicyCard } from '../components/settings/OfflinePolicyCard';
import { PreferencesCard } from '../components/settings/PreferencesCard';

export function SettingsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-4 text-xs pb-8">
      {/* Header */}
      <div className="px-1">
        <h2 className="text-sm font-semibold text-[#F1F3F5] tracking-tight">System & Preferences</h2>
        <p className="text-[11px] text-[#687180]">Configure local Ollama inference, airgap enforcement, and backend connectivity</p>
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
