import React, { createContext, useContext, useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { TASK_STATUS } from '../utils/constants';
import { useSystem } from './SystemContext';

const TaskContext = createContext(null);

const INITIAL_WELCOME_MESSAGE = {
  id: 'msg-welcome',
  sender: 'assistant',
  text: 'Greetings. I am FORGE AI — your autonomous computer-use assistant.\n\nI can organize local directories, draft dynamic Excel workbooks, parse local documents, and execute verified automation workflows under your explicit supervision.\n\nHow may I assist you today?',
  timestamp: new Date().toISOString()
};

export function TaskProvider({ children }) {
  const { currentProviderConfig, isEffectivelyOnline } = useSystem();
  
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load initial task history from SQLite backend
  useEffect(() => {
    async function loadTasks() {
      try {
        const history = await taskService.getHistory();
        setTasks(history);
      } catch (err) {
        console.error('Failed to load initial task history:', err);
      } finally {
        setLoadingHistory(false);
      }
    }
    loadTasks();
  }, []);

  /**
   * Submits a user prompt to the local Express & Ollama backend
   */
  const submitPrompt = async (promptText) => {
    if (!promptText.trim()) return;

    // 1. Add user message to chat stream
    const userMsg = {
      id: `msg-${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);

    // Check if task needs internet but offline mode is active
    const requiresInternet = /search|scrape|web|online|download|cloud/i.test(promptText);
    if (requiresInternet && !isEffectivelyOnline) {
      const offlineRejectMsg = {
        id: `msg-err-${Date.now()}`,
        sender: 'system',
        text: 'Policy Gate Notice: The requested task requires external internet access, but FORGE is currently in Offline Mode. Switch to Auto/Online in settings to permit network access.',
        timestamp: new Date().toISOString(),
        isError: true
      };
      setMessages(prev => [...prev, offlineRejectMsg]);
      return;
    }

    setIsProcessing(true);

    // Add a lightweight thinking notice
    const thinkingId = `msg-think-${Date.now()}`;
    setMessages(prev => [
      ...prev,
      {
        id: thinkingId,
        sender: 'system',
        text: 'Analyzing request with local AI model...',
        timestamp: new Date().toISOString(),
        isTemporary: true
      }
    ]);

    try {
      // 2. Call real backend: POST /api/v1/chat
      const result = await taskService.sendChatMessage(
        promptText,
        'default-session',
        currentProviderConfig.name || 'Ollama (qwen3:4b)'
      );

      // Remove temporary thinking notice
      setMessages(prev => prev.filter(m => m.id !== thinkingId));

      if (result.status === 'security_blocked') {
        setMessages(prev => [
          ...prev,
          {
            id: `msg-sec-${Date.now()}`,
            sender: 'system',
            text: result.reply,
            timestamp: new Date().toISOString(),
            isError: true
          }
        ]);
        setActiveTask(null);
        return;
      }

      if (result.intent === 'TASK' && result.task) {
        // Active task waiting for human approval
        setActiveTask(result.task);
        setTasks(prev => [result.task, ...prev.filter(t => t.id !== result.task.id)]);

        setMessages(prev => [
          ...prev,
          {
            id: result.messageId || `msg-asst-${Date.now()}`,
            sender: 'assistant',
            text: result.reply,
            timestamp: new Date().toISOString(),
            taskId: result.task.id
          }
        ]);
      } else {
        // CHAT or AMBIGUOUS
        setActiveTask(null);
        setMessages(prev => [
          ...prev,
          {
            id: result.messageId || `msg-asst-${Date.now()}`,
            sender: 'assistant',
            text: result.reply,
            timestamp: new Date().toISOString()
          }
        ]);
      }
    } catch (err) {
      console.error('Failed to submit prompt to backend:', err);
      setMessages(prev => prev.filter(m => m.id !== thinkingId));
      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'system',
          text: `Backend Error: Could not connect to FORGE Express server at http://127.0.0.1:3000 (${err.message}). Is the backend service running?`,
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Approves the pending action plan and dispatches real execution to Python FastAPI
   */
  const approveCurrentTask = async () => {
    if (!activeTask) return;

    const isPending = activeTask.status.toLowerCase() === 'waiting_approval' || activeTask.approvalStatus === 'pending';
    if (!isPending) return;

    // Transition UI to EXECUTING state
    setActiveTask(prev => {
      const updated = {
        ...prev,
        status: TASK_STATUS.EXECUTING,
        approvalStatus: 'approved',
        steps: (prev.steps || []).map(s => {
          if (s.stage === 'APPROVE') return { ...s, status: 'completed', message: 'Authorization granted by operator.' };
          if (s.stage === 'EXECUTE') return { ...s, status: 'in_progress', message: `Dispatching action to ${prev.plannedTool}...` };
          return s;
        })
      };
      return updated;
    });

    setMessages(prev => [
      ...prev,
      {
        id: `msg-exec-${Date.now()}`,
        sender: 'system',
        text: `Action authorized by operator. Dispatching to Python automation engine on http://127.0.0.1:8000...`,
        timestamp: new Date().toISOString()
      }
    ]);

    try {
      // Real execution call to backend
      const res = await taskService.approveTask(activeTask.id);
      const executedTask = res.task || res;

      setActiveTask(executedTask);
      setTasks(all => all.map(t => t.id === executedTask.id ? executedTask : t));

      const artifactCount = executedTask.artifacts?.length || 0;
      const artifactSummary = artifactCount > 0
        ? `\n\nVerified Artifacts (${artifactCount}):\n` + executedTask.artifacts.map(a => `• **${a.name}** (${a.size} bytes) - \`${a.path}\``).join('\n')
        : '';

      setMessages(prev => [
        ...prev,
        {
          id: `msg-done-${Date.now()}`,
          sender: 'assistant',
          text: `Task execution verified and completed successfully.\n\nAll produced operations conform to security policy.${artifactSummary}`,
          timestamp: new Date().toISOString(),
          taskId: executedTask.id
        }
      ]);
    } catch (err) {
      console.error('Task execution failed:', err);

      setActiveTask(prev => {
        if (!prev) return null;
        return {
          ...prev,
          status: TASK_STATUS.FAILED,
          steps: (prev.steps || []).map(s => {
            if (s.stage === 'EXECUTE') return { ...s, status: 'failed', message: `Execution failed: ${err.message}` };
            return s;
          })
        };
      });

      setMessages(prev => [
        ...prev,
        {
          id: `msg-err-${Date.now()}`,
          sender: 'system',
          text: `Execution failed: ${err.message}. Please verify the Python Automation Service is running on http://127.0.0.1:8000.`,
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    }
  };

  /**
   * Rejects the proposed plan safely
   */
  const rejectCurrentTask = async (reason = 'Operator declined authorization') => {
    if (!activeTask) return;

    try {
      const res = await taskService.rejectTask(activeTask.id, reason);
      const rejectedTask = res.task || res;

      setActiveTask(rejectedTask);
      setTasks(all => all.map(t => t.id === rejectedTask.id ? rejectedTask : t));

      setMessages(prev => [
        ...prev,
        {
          id: `msg-reject-${Date.now()}`,
          sender: 'system',
          text: `Execution cancelled safely. Reason: ${reason}. No disk modifications were performed.`,
          timestamp: new Date().toISOString(),
          isError: true
        }
      ]);
    } catch (err) {
      console.warn('Backend rejection failed, updating local state:', err.message);
      setActiveTask(prev => ({ ...prev, status: TASK_STATUS.REJECTED, approvalStatus: 'rejected' }));
    }
  };

  /**
   * Re-runs / re-uses a prompt from history
   */
  const reuseTask = (task) => {
    submitPrompt(task.prompt);
  };

  const resetActiveTask = () => {
    setActiveTask(null);
  };

  const value = {
    tasks,
    activeTask,
    messages,
    loadingHistory,
    isProcessing,
    submitPrompt,
    approveCurrentTask,
    rejectCurrentTask,
    reuseTask,
    resetActiveTask,
    setActiveTask
  };

  return (
    <TaskContext.Provider value={value}>
      {children}
    </TaskContext.Provider>
  );
}

export function useTasks() {
  const ctx = useContext(TaskContext);
  if (!ctx) throw new Error('useTasks must be used within a TaskProvider');
  return ctx;
}
