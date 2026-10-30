import apiClient from './api';
import { MOCK_MEMORY_RECORDS } from './mockData';

let sessionMemory = [...MOCK_MEMORY_RECORDS];

export const memoryService = {
  async getRecords(query = '', category = 'all') {
    if (apiClient.isMockMode()) {
      await new Promise(r => setTimeout(r, 120));
      let results = [...sessionMemory];
      if (category && category !== 'all') {
        results = results.filter(r => r.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (query) {
        const q = query.toLowerCase();
        results = results.filter(r => 
          r.patternName.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.triggerPhrases.some(phrase => phrase.toLowerCase().includes(q))
        );
      }
      return results;
    }

    try {
      const params = new URLSearchParams({ q: query, category }).toString();
      return await apiClient.get(`/api/memory?${params}`);
    } catch (err) {
      console.warn('[FORGE MemoryService] Live API unavailable, falling back to local memory records:', err);
      return sessionMemory;
    }
  },

  async deleteRecord(id) {
    if (apiClient.isMockMode()) {
      await new Promise(r => setTimeout(r, 200));
      sessionMemory = sessionMemory.filter(r => r.id !== id);
      return { success: true, message: 'Experience record removed from memory index' };
    }

    try {
      return await apiClient.delete(`/api/memory/${id}`);
    } catch {
      sessionMemory = sessionMemory.filter(r => r.id !== id);
      return { success: true, message: 'Record removed locally (Backend offline)' };
    }
  }
};
