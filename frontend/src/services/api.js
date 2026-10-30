/**
 * FORGE AI - Central HTTP Client / API Service Layer
 * 
 * Provides unified request dispatching with timeout handling,
 * error normalization, and transparent mock fallback when the backend
 * is offline or in simulated development mode.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 8000;
const FORCE_MOCK = import.meta.env.VITE_USE_MOCK !== 'false';

class ApiClient {
  constructor(baseUrl = BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || DEFAULT_TIMEOUT);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(options.headers || {})
        }
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `API Error HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        throw new Error(`Request timed out after ${options.timeout || DEFAULT_TIMEOUT}ms`);
      }
      throw err;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  post(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(body)
    });
  }

  put(endpoint, body, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  isMockMode() {
    return FORCE_MOCK;
  }

  getBaseUrl() {
    return this.baseUrl;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
