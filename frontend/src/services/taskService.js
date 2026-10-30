import apiClient from './api';
import { MOCK_TASK_HISTORY } from './mockData';
import { TASK_STATUS } from '../utils/constants';

// Local in-memory store for newly created tasks during the session
let sessionHistory = [...MOCK_TASK_HISTORY];

export const taskService = {
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
      return await apiClient.get(`/api/tasks?${query}`);
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
      return await apiClient.get(`/api/tasks/${taskId}`);
    } catch (err) {
      const fallback = sessionHistory.find(t => t.id === taskId);
      if (fallback) return fallback;
      throw err;
    }
  },

  /**
   * Initializes a new task object in the UNDERSTANDING state
   */
  createNewTask(prompt, provider = 'Ollama (llama3:8b)') {
    const isOnlineTask = /search|scrape|web|online|download|cloud/i.test(prompt);
    
    // Generate realistic plan based on prompt
    let title = 'Automated Task Execution';
    let plannedTool = 'local_python_tool';
    let impactDescription = 'Will create and write output files to the permitted workspace directory.';
    let artifacts = [];

    if (/excel|spreadsheet|kpi|finance|revenue/i.test(prompt)) {
      title = 'Generate Excel Spreadsheet';
      plannedTool = 'excel_writer (Python openpyxl)';
      impactDescription = 'Create and format Excel workbook with computed formulas at ./generated/output.xlsx.';
      artifacts = [{ name: 'Generated_Workbook.xlsx', size: 38400, type: 'excel', path: './generated/Generated_Workbook.xlsx' }];
    } else if (/organize|clean|folder|directory|move|sort/i.test(prompt)) {
      title = 'Organize File System Directory';
      plannedTool = 'file_system (Python os/shutil)';
      impactDescription = 'Safely scan target directory and categorize files into subfolders with hash validation.';
      artifacts = [{ name: 'Folder_Reorganization_Summary.json', size: 5200, type: 'json', path: './generated/Folder_Reorganization_Summary.json' }];
    } else if (/pdf|invoice|extract|receipt/i.test(prompt)) {
      title = 'Extract Structured Data from Documents';
      plannedTool = 'document_parser (Python pypdf)';
      impactDescription = 'Parse local PDF documents and export structured CSV records.';
      artifacts = [{ name: 'Extracted_Data_Ledger.csv', size: 12400, type: 'csv', path: './generated/Extracted_Data_Ledger.csv' }];
    } else if (isOnlineTask) {
      title = 'Online Web Automation & Research';
      plannedTool = 'browser_runner (Playwright)';
      impactDescription = 'Open headless browser session, execute page navigation, and extract target web text.';
    }

    const newTask = {
      id: `task-${Date.now().toString().slice(-6)}`,
      title,
      prompt,
      status: TASK_STATUS.UNDERSTANDING,
      type: isOnlineTask ? 'online_only' : 'offline',
      provider,
      createdAt: new Date().toISOString(),
      durationSeconds: 0,
      plannedTool,
      approvalRequired: true,
      approvalStatus: 'pending', // 'pending', 'approved', 'rejected'
      approvalDetails: {
        action: `Execute tool: ${plannedTool}`,
        target: impactDescription,
        riskLevel: isOnlineTask ? 'Medium (External Network Access)' : 'Low (Restricted Local Directory Sandbox)',
        explanation: `FORGE AI requires your explicit confirmation before calling '${plannedTool}'. ${impactDescription}`
      },
      steps: [
        { id: 's1', stage: 'UNDERSTAND', status: 'in_progress', message: 'Analyzing prompt constraints, requested tools, and network requirements...' },
        { id: 's2', stage: 'PLAN', status: 'pending', message: 'Generate deterministic step execution graph...' },
        { id: 's3', stage: 'APPROVE', status: 'pending', message: 'Human authorization gate...' },
        { id: 's4', stage: 'EXECUTE', status: 'pending', message: 'Dispatch permitted tool actions via automation engine...' },
        { id: 's5', stage: 'VERIFY', status: 'pending', message: 'Validate result integrity & goal completion...' },
        { id: 's6', stage: 'STORE', status: 'pending', message: 'Persist execution log and metrics to SQLite...' },
        { id: 's7', stage: 'LEARN', status: 'pending', message: 'Index workflow experience pattern for future reuse...' }
      ],
      artifacts,
      verificationDetails: null
    };

    sessionHistory.unshift(newTask);
    return newTask;
  },

  /**
   * Save updated task into memory store
   */
  updateTask(updatedTask) {
    const idx = sessionHistory.findIndex(t => t.id === updatedTask.id);
    if (idx !== -1) {
      sessionHistory[idx] = updatedTask;
    }
  }
};
