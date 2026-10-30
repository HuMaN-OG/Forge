import React, { createContext, useContext, useState, useEffect } from 'react';
import { systemService } from '../services/systemService';
import { AI_PROVIDERS, CONNECTION_MODES, STORAGE_KEYS } from '../utils/constants';

const SystemContext = createContext(null);

export function SystemProvider({ children }) {
  // Read persisted preferences from browser localStorage
  const savedPrefs = (() => {
    try {
      const item = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      const parsed = item ? JSON.parse(item) : {};
      if (parsed.model === 'llama3:8b') {
        parsed.model = 'qwen3:4b';
      }
      return parsed;
    } catch {
      return {};
    }
  })();

  const [isBrowserOnline, setIsBrowserOnline] = useState(navigator.onLine);
  const [connectionMode, setConnectionMode] = useState(savedPrefs.connectionMode || CONNECTION_MODES.AUTO);
  const [selectedProvider, setSelectedProvider] = useState(savedPrefs.provider || 'ollama');
  const [selectedModel, setSelectedModel] = useState(
    (savedPrefs.model && savedPrefs.model !== 'llama3:8b') ? savedPrefs.model : 'qwen3:4b'
  );
  const [backendStatus, setBackendStatus] = useState({
    status: 'checking',
    baseUrl: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:3000',
    latencyMs: null,
    isSimulated: false
  });
  const [automationStatus] = useState({
    engine: 'Python FastAPI Engine',
    status: 'ready',
    availableToolsCount: 2
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
        setSelectedProvider(status.aiProvider.active || 'ollama');
        setSelectedModel(status.aiProvider.model || 'qwen3:4b');
      }
    } catch (err) {
      setBackendStatus(prev => ({ ...prev, status: 'disconnected', error: err.message, isSimulated: true }));
    }
  };

  // Persist preferences
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

  // Monitor network connectivity & poll system status
  useEffect(() => {
    const handleOnline = () => setIsBrowserOnline(true);
    const handleOffline = () => setIsBrowserOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial system status probe
    refreshSystemStatus();

    // Periodic check every 10 seconds to detect service restarts
    const intervalId = setInterval(refreshSystemStatus, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(intervalId);
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
