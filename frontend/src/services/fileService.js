import apiClient from './api';
import { MOCK_GENERATED_FILES } from './mockData';

let sessionFiles = [...MOCK_GENERATED_FILES];

export const fileService = {
  async getFiles(filters = {}) {
    if (apiClient.isMockMode()) {
      await new Promise(r => setTimeout(r, 100));
      let results = [...sessionFiles];
      if (filters.extension && filters.extension !== 'all') {
        results = results.filter(f => f.extension === filters.extension);
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(f => 
          f.name.toLowerCase().includes(q) || 
          f.description.toLowerCase().includes(q)
        );
      }
      return results;
    }

    try {
      return await apiClient.get('/api/files');
    } catch {
      console.warn('[FORGE FileService] Live API unavailable, returning recorded session files');
      return sessionFiles;
    }
  },

  /**
   * Safe file download action
   * In mock/preview mode, explains transparently that real disk stream requires Bhuvan's Express backend.
   */
  async downloadFile(file) {
    if (apiClient.isMockMode() || !file.isAvailableLocally) {
      return {
        success: false,
        isSimulated: true,
        message: `File '${file.name}' is recorded in task history at '${file.path}'. Real filesystem downloads will be served once Bhuvan connects the Express file stream endpoint (GET /api/files/:id/download).`
      };
    }

    try {
      window.open(`${apiClient.getBaseUrl()}/api/files/${file.id}/download`, '_blank');
      return { success: true, message: `Downloading ${file.name}...` };
    } catch (err) {
      return { success: false, message: `Download failed: ${err.message}` };
    }
  }
};
