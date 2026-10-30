import apiClient from './api';
import { MOCK_SYSTEM_STATUS } from './mockData';

export const systemService = {
  /**
   * Fetches the current system health and status.
   * If backend is offline or mock mode is enabled, returns simulated telemetry.
   */
  async getStatus() {
    if (apiClient.isMockMode()) {
      // Simulate small network delay for realism
      await new Promise(r => setTimeout(r, 120));
      return { ...MOCK_SYSTEM_STATUS, isSimulated: true };
    }

    try {
      const liveData = await apiClient.get('/api/system/status');
      return { ...liveData, isSimulated: false };
    } catch (err) {
      console.warn('[FORGE SystemService] Backend unreachable, falling back to simulated status:', err.message);
      return {
        ...MOCK_SYSTEM_STATUS,
        backend: {
          ...MOCK_SYSTEM_STATUS.backend,
          status: 'disconnected',
          error: err.message
        },
        isSimulated: true
      };
    }
  },

  /**
   * Test connection to a given URL directly (e.g. from Settings).
   */
  async testConnection(targetUrl) {
    const startTime = performance.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(`${targetUrl.replace(/\/$/, '')}/api/health`, {
        signal: controller.signal,
        method: 'GET'
      });
      clearTimeout(timeoutId);

      const latency = Math.round(performance.now() - startTime);

      if (res.ok) {
        const body = await res.json().catch(() => ({}));
        return {
          connected: true,
          status: 'online',
          latency,
          message: `Connected to FORGE Backend successfully (${latency}ms)`,
          details: body
        };
      } else {
        return {
          connected: false,
          status: 'error',
          latency,
          message: `Backend returned HTTP ${res.status}: ${res.statusText}`
        };
      }
    } catch (err) {
      return {
        connected: false,
        status: 'unreachable',
        message: err.name === 'AbortError' 
          ? 'Connection timed out (3.5s). Is the Express server running?' 
          : `Connection refused at ${targetUrl}. (${err.message})`
      };
    }
  }
};
