import React, { createContext, useContext, useState, useEffect } from 'react';
import { taskService } from '../services/taskService';
import { TASK_STATUS } from '../utils/constants';
import { useSystem } from './SystemContext';

const TaskContext = createContext(null);

const INITIAL_WELCOME_MESSAGE = {
  id: 'msg-welcome',
  sender: 'assistant',
  text: 'Greetings. I am FORGE AI — your autonomous computer-use assistant.\n\nI can organize local directories, draft dynamic Excel workbooks, parse local invoices, and execute verified automation workflows under your explicit supervision.\n\nHow may I assist you today?',
  timestamp: new Date().toISOString()
};

export function TaskProvider({ children }) {
  const { currentProviderConfig, isEffectivelyOnline } = useSystem();
  
  const [tasks, setTasks] = useState([]);
  const [activeTask, setActiveTask] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [messages, setMessages] = useState([INITIAL_WELCOME_MESSAGE]);

  // Load initial task history
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
   * Submits a user prompt to initiate the autonomous assistant workflow
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

    // 2. Initialize task object in UNDERSTAND stage
    const newTask = taskService.createNewTask(promptText, currentProviderConfig.name);
    setActiveTask(newTask);
    setTasks(prev => [newTask, ...prev.filter(t => t.id !== newTask.id)]);

    // 3. Begin simulated autonomous progression: UNDERSTAND -> PLAN -> WAITING_APPROVAL
    setTimeout(() => {
      // Step: Planning
      setActiveTask(prev => {
        if (!prev || prev.id !== newTask.id) return prev;
        const updated = {
          ...prev,
          status: TASK_STATUS.PLANNING,
          steps: prev.steps.map(s => {
            if (s.stage === 'UNDERSTAND') return { ...s, status: 'completed', message: 'Requirement parsed. Identified goal and security parameters.' };
            if (s.stage === 'PLAN') return { ...s, status: 'in_progress', message: `Formulating tool call: ${prev.plannedTool}...` };
            return s;
          })
        };
        taskService.updateTask(updated);
        return updated;
      });

      // Step: Waiting for human approval gate
      setTimeout(() => {
        setActiveTask(prev => {
          if (!prev || prev.id !== newTask.id) return prev;
          const updated = {
            ...prev,
            status: TASK_STATUS.WAITING_APPROVAL,
            steps: prev.steps.map(s => {
              if (s.stage === 'PLAN') return { ...s, status: 'completed', message: `Plan constructed. 1 critical action requires human authorization.` };
              if (s.stage === 'APPROVE') return { ...s, status: 'in_progress', message: 'Awaiting operator approval to proceed with execution...' };
              return s;
            })
          };
          taskService.updateTask(updated);
          return updated;
        });

        // Add assistant chat notification that approval is required
        setMessages(prev => [
          ...prev,
          {
            id: `msg-approval-${Date.now()}`,
            sender: 'assistant',
            text: `I have constructed an execution plan for your request. Action requires explicit authorization: **${newTask.approvalDetails.action}**.\n\nPlease inspect the safety card below and choose whether to authorize execution.`,
            timestamp: new Date().toISOString(),
            taskId: newTask.id
          }
        ]);
      }, 1200);
    }, 1000);
  };

  /**
   * Approves the pending action plan and advances through EXECUTE -> VERIFY -> STORE -> LEARN
   */
  const approveCurrentTask = () => {
    if (!activeTask || activeTask.status !== TASK_STATUS.WAITING_APPROVAL) return;

    // Transition to EXECUTING
    setActiveTask(prev => {
      const updated = {
        ...prev,
        status: TASK_STATUS.EXECUTING,
        approvalStatus: 'approved',
        steps: prev.steps.map(s => {
          if (s.stage === 'APPROVE') return { ...s, status: 'completed', message: 'Authorization granted by operator.' };
          if (s.stage === 'EXECUTE') return { ...s, status: 'in_progress', message: `Dispatching action to ${prev.plannedTool}...` };
          return s;
        })
      };
      taskService.updateTask(updated);
      return updated;
    });

    setMessages(prev => [
      ...prev,
      {
        id: `msg-exec-${Date.now()}`,
        sender: 'system',
        text: 'Action approved. Executing tool steps with local runtime sandbox...',
        timestamp: new Date().toISOString()
      }
    ]);

    // Simulate Execution finishing -> Verification
    setTimeout(() => {
      setActiveTask(prev => {
        if (!prev) return prev;
        const updated = {
          ...prev,
          status: TASK_STATUS.VERIFYING,
          steps: prev.steps.map(s => {
            if (s.stage === 'EXECUTE') return { ...s, status: 'completed', message: 'Tool execution succeeded. Output produced with exit code 0.' };
            if (s.stage === 'VERIFY') return { ...s, status: 'in_progress', message: 'Running cryptographic checksum and schema validation on outputs...' };
            return s;
          })
        };
        taskService.updateTask(updated);
        return updated;
      });

      // Simulate Verification finishing -> Store -> Learn -> Completed
      setTimeout(() => {
        setActiveTask(prev => {
          if (!prev) return prev;
          const completedTask = {
            ...prev,
            status: TASK_STATUS.COMPLETED,
            durationSeconds: Math.floor((Date.now() - new Date(prev.createdAt).getTime()) / 1000),
            completedAt: new Date().toISOString(),
            verificationDetails: {
              status: 'passed',
              metrics: 'Integrity 100%. Checksum matched expected schema. Zero anomalies detected.',
              verifier: 'LocalVerificationEngine'
            },
            steps: prev.steps.map(s => ({
              ...s,
              status: 'completed',
              message: s.stage === 'VERIFY' ? 'Integrity verified: Artifacts conform to specification.'
                : s.stage === 'STORE' ? 'Stored execution telemetry, logs, and artifacts metadata into SQLite.'
                : s.stage === 'LEARN' ? 'Indexed successful execution pattern for future task acceleration.'
                : s.message
            }))
          };
          taskService.updateTask(completedTask);
          setTasks(all => all.map(t => t.id === completedTask.id ? completedTask : t));
          return completedTask;
        });

        setMessages(prev => [
          ...prev,
          {
            id: `msg-done-${Date.now()}`,
            sender: 'assistant',
            text: `Task execution verified and completed successfully.\n\nAll produced artifacts have been validated and the execution record is persisted. You can inspect generated files in the **Generated Files** panel.`,
            timestamp: new Date().toISOString(),
            taskId: activeTask.id
          }
        ]);
      }, 1400);
    }, 2200);
  };

  /**
   * Rejects the proposed plan safely
   */
  const rejectCurrentTask = (reason = 'Operator declined authorization') => {
    if (!activeTask || activeTask.status !== TASK_STATUS.WAITING_APPROVAL) return;

    setActiveTask(prev => {
      const rejectedTask = {
        ...prev,
        status: TASK_STATUS.REJECTED,
        approvalStatus: 'rejected',
        rejectionReason: reason,
        completedAt: new Date().toISOString(),
        steps: prev.steps.map(s => {
          if (s.stage === 'APPROVE') return { ...s, status: 'rejected', message: `Execution rejected: ${reason}` };
          if (['EXECUTE', 'VERIFY', 'STORE', 'LEARN'].includes(s.stage)) {
            return { ...s, status: 'skipped', message: 'Skipped due to rejection authorization gate.' };
          }
          return s;
        })
      };
      taskService.updateTask(rejectedTask);
      setTasks(all => all.map(t => t.id === rejectedTask.id ? rejectedTask : t));
      return rejectedTask;
    });

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
