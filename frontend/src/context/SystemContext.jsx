import React, { createContext, useContext, useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import { AI_PROVIDERS, CONNECTION_MODES, STORAGE_KEYS } from '../utils/constants';

const SystemContext = createContext(null);

export function SystemProvider({ children }) {
  // Read persisted preferences from harmless browser localStorage
  const savedPrefs = (() => {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      return item ? JSON.parse(item) : {};
    } catch {
      return {};
    }
  })();

  const [isBrowserOnline, setIsBrowserOnline] = useState(navigator.onLine);
  const [connectionMode, setConnectionMode] = useState(savedPrefs.connectionMode || CONNECTION_MODES.AUTO);
  const [selectedProvider, setSelectedProvider] = useState(savedPrefs.provider || 'ollama');
  const [selectedModel, setSelectedModel] = useState(savedPrefs.model || 'llama3:8b');
  const [backendStatus, setBackendStatus] = useState({
    status: 'checking',
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
    latencyMs: null,
    isSimulated: true
  });
  const [automationStatus] = useState({
    engine: 'Python Playwright Engine',
    status: 'ready',
    availableToolsCount: 4
  });

  // Calculate effective online capability based on network + preference
  const isEffectivelyOnline = connectionMode === CONNECTION_MODES.FORCE_OFFLINE
    ? false
    : connectionMode === CONNECTION_MODES.ONLINE_ONLY
      ? isBrowserOnline
      : isBrowserOnline;

  const refreshSystemStatus = async () => {
    try {
      const status = await systemService.getStatus();
      setBackendStatus({
        status: status.backend.status,
        baseUrl: status.backend.baseUrl,
        latencyMs: status.backend.latencyMs,
        isSimulated: status.isSimulated
      });
      if (status.aiProvider) {
        setSelectedProvider(status.aiProvider.active);
        setSelectedModel(status.aiProvider.model);
      }
    } catch (err) {
      setBackendStatus(prev => ({ ...prev, status: 'disconnected', error: err.message }));
    }
  };

  // Persist harmless preferences
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify({
        connectionMode,
        provider: selectedProvider,
        model: selectedModel
      }));
    } catch {
      // Ignore quota errors
    }
  }, [connectionMode, selectedProvider, selectedModel]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial system status probe
    refreshSystemStatus();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const testConnection = async (url) => {
    return await systemService.testConnection(url);
  };

  const value = {
    isBrowserOnline,
    isEffectivelyOnline,
    connectionMode,
    setConnectionMode,
    selectedProvider,
    setSelectedProvider,
    selectedModel,
    setSelectedModel,
    backendStatus,
    automationStatus,
    currentProviderConfig: AI_PROVIDERS[selectedProvider.toUpperCase()] || AI_PROVIDERS.OLLAMA,
    refreshSystemStatus,
    testConnection
  };

  return (
    <SystemContext.Provider value={value}>
      {children}
    </SystemContext.Provider>
  );
}

export function useSystem() {
  const ctx = useContext(SystemContext);
  if (!ctx) throw new Error('useSystem must be used within a SystemProvider');
  return ctx;
}
