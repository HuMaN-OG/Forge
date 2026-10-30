import apiClient from './api';
import { MOCK_TASK_HISTORY } from './mockData';
import { TASK_STATUS } from '../utils/constants';

let sessionHistory = [...MOCK_TASK_HISTORY];

export const taskService = {
  /**
   * Primary entry point: Send user message to Express /api/v1/chat
   */
  async sendChatMessage(message, conversationId = 'default-session', provider = 'Ollama (qwen3:4b)') {
    if (apiClient.isMockMode()) {
      await new Promise(r => setTimeout(r, 600));
      const simulatedTask = this.createNewTask(message, provider);
      return {
        success: true,
        intent: 'TASK',
        confidence: 0.95,
        status: 'waiting_approval',
        reply: `[MOCK] I have constructed a local execution plan for: ${simulatedTask.title}`,
        task: simulatedTask
      };
    }

    try {
      return await apiClient.post('/api/v1/chat', {
        message,
        conversationId,
        provider
      });
    } catch (err) {
      console.warn('[FORGE TaskService] Live chat API call failed:', err.message);
      throw err;
    }
  },

  /**
   * Fetches all persistent conversations from SQLite
   */
  async getConversations() {
    try {
      const res = await apiClient.get('/api/v1/conversations');
      return res.conversations || [];
    } catch (err) {
      console.warn('[FORGE TaskService] Failed to fetch conversations:', err.message);
      return [];
    }
  },

  /**
   * Creates a new conversation in SQLite
   */
  async createConversation(title = 'New Conversation') {
    try {
      const res = await apiClient.post('/api/v1/conversations', { title });
      return res.conversation;
    } catch (err) {
      console.warn('[FORGE TaskService] Failed to create conversation:', err.message);
      return null;
    }
  },

  /**
   * Deletes a conversation and its messages
   */
  async deleteConversation(id) {
    try {
      await apiClient.delete(`/api/v1/conversations/${id}`);
      return true;
    } catch (err) {
      console.warn('[FORGE TaskService] Failed to delete conversation:', err.message);
      return false;
    }
  },

  /**
   * Fetches persistent message history for a conversation from SQLite
   */
  async getMessages(conversationId) {
    try {
      const res = await apiClient.get(`/api/v1/chat/messages?conversationId=${encodeURIComponent(conversationId)}`);
      return res.messages || [];
    } catch (err) {
      console.warn('[FORGE TaskService] Failed to fetch messages:', err.message);
      return [];
    }
  },

  /**
   * Approves a task for real execution via Express and Python FastAPI
   */
  async approveTask(taskId) {
    if (apiClient.isMockMode()) {
      await new Promise(r => setTimeout(r, 800));
      const task = sessionHistory.find(t => t.id === taskId);
      if (task) {
        task.status = TASK_STATUS.COMPLETED;
        task.approvalStatus = 'approved';
      }
      return { success: true, task };
    }

    try {
      return await apiClient.post(`/api/v1/tasks/${taskId}/approve`);
    } catch (err) {
      console.error(`[FORGE TaskService] Task approval API failed for ${taskId}:`, err.message);
      throw err;
    }
  },

  /**
   * Safely rejects a proposed task plan
   */
  async rejectTask(taskId, reason = 'Operator declined authorization') {
    if (apiClient.isMockMode()) {
      await new Promise(r => setTimeout(r, 300));
      const task = sessionHistory.find(t => t.id === taskId);
      if (task) {
        task.status = TASK_STATUS.REJECTED;
        task.approvalStatus = 'rejected';
      }
      return { success: true, task };
    }

    try {
      return await apiClient.post(`/api/v1/tasks/${taskId}/reject`, { reason });
    } catch (err) {
      console.error(`[FORGE TaskService] Task rejection API failed for ${taskId}:`, err.message);
      throw err;
    }
  },

  /**
   * Fetch all historical tasks with optional filters
   */
  async getHistory(filters = {}) {
    if (apiClient.isMockMode()) {
      await new Promise(r => setTimeout(r, 150));
      let results = [...sessionHistory];

      if (filters.status && filters.status !== 'all') {
        results = results.filter(t => t.status.toLowerCase() === filters.status.toLowerCase());
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        results = results.filter(t => 
          t.title.toLowerCase().includes(q) || 
          t.prompt.toLowerCase().includes(q)
        );
      }
      if (filters.type && filters.type !== 'all') {
        results = results.filter(t => t.type === filters.type);
      }

      return results.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }

    try {
      const query = new URLSearchParams(filters).toString();
      const res = await apiClient.get(`/api/v1/tasks?${query}`);
      const liveTasks = res.tasks || [];
      if (liveTasks.length > 0) {
        sessionHistory = liveTasks;
      }
      return liveTasks;
    } catch (err) {
      console.warn('[FORGE TaskService] Live API failed, using local session history:', err);
      return sessionHistory;
    }
  },

  /**
   * Retrieve single task details
   */
  async getTaskById(taskId) {
    if (apiClient.isMockMode()) {
      await new Promise(r => setTimeout(r, 80));
      const task = sessionHistory.find(t => t.id === taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);
      return task;
    }

    try {
      const res = await apiClient.get(`/api/v1/tasks/${taskId}`);
      return res.task || res;
    } catch (err) {
      const fallback = sessionHistory.find(t => t.id === taskId);
      if (fallback) return fallback;
      throw err;
    }
  },

  /**
   * Local helper for offline mock fallback
   */
  createNewTask(prompt, provider = 'Ollama (qwen3:4b)') {
    const isOnlineTask = /search|scrape|web|online|download|cloud/i.test(prompt);
    let title = 'Automated File Operation';
    let plannedTool = 'file_system';

    if (/excel|spreadsheet|xlsx|sheet/i.test(prompt)) {
      title = 'Generate Excel Spreadsheet';
      plannedTool = 'excel_writer';
    }

    const newTask = {
      id: `task-${Date.now().toString().slice(-6)}`,
      title,
      prompt,
      status: TASK_STATUS.WAITING_APPROVAL,
      type: isOnlineTask ? 'online_only' : 'offline',
      provider,
      createdAt: new Date().toISOString(),
      durationSeconds: 0,
      plannedTool,
      approvalRequired: true,
      approvalStatus: 'pending',
      approvalDetails: {
        action: `Execute tool: ${plannedTool}`,
        target: 'Workspace Sandbox directory',
        riskLevel: 'Low (Restricted Local Directory Sandbox)',
        explanation: `FORGE AI requires your confirmation before calling '${plannedTool}'.`
      },
      steps: [
        { id: 's1', stage: 'UNDERSTAND', status: 'completed', message: 'Requirement parsed.' },
        { id: 's2', stage: 'PLAN', status: 'completed', message: 'Plan generated.' },
        { id: 's3', stage: 'APPROVE', status: 'in_progress', message: 'Awaiting operator approval.' },
        { id: 's4', stage: 'EXECUTE', status: 'pending', message: 'Pending execution.' },
        { id: 's5', stage: 'VERIFY', status: 'pending', message: 'Pending verification.' },
        { id: 's6', stage: 'STORE', status: 'pending', message: 'Pending store.' },
        { id: 's7', stage: 'LEARN', status: 'pending', message: 'Pending learn.' }
      ],
      artifacts: [],
      verificationDetails: null
    };

    sessionHistory.unshift(newTask);
    return newTask;
  },

  updateTask(updatedTask) {
    const idx = sessionHistory.findIndex(t => t.id === updatedTask.id);
    if (idx !== -1) {
      sessionHistory[idx] = updatedTask;
    }
  }
};
