/**
 * FORGE AI - Core Constants & Configuration Enums
 */

export const WORKFLOW_STAGES = [
  { id: 'UNDERSTAND', label: 'Understand', description: 'Analyze intent & extract task constraints' },
  { id: 'PLAN', label: 'Plan', description: 'Formulate deterministic step-by-step tool actions' },
  { id: 'APPROVE', label: 'Approve', description: 'Human-in-the-loop authorization gate' },
  { id: 'EXECUTE', label: 'Execute', description: 'Dispatch permitted tool actions via automation engine' },
  { id: 'VERIFY', label: 'Verify', description: 'Inspect outputs & ensure goal fulfillment' },
  { id: 'STORE', label: 'Store', description: 'Persist execution log & metrics to SQLite' },
  { id: 'LEARN', label: 'Learn', description: 'Index workflow pattern for future assistance retrieval' }
];

export const TASK_STATUS = {
  IDLE: 'idle',
  UNDERSTANDING: 'understanding',
  PLANNING: 'planning',
  WAITING_APPROVAL: 'waiting_approval',
  EXECUTING: 'executing',
  VERIFYING: 'verifying',
  COMPLETED: 'completed',
  FAILED: 'failed',
  REJECTED: 'rejected'
};

export const AI_PROVIDERS = {
  OLLAMA: {
    id: 'ollama',
    name: 'Ollama (Local LLM)',
    type: 'offline',
    description: 'Private offline model running on local hardware. Zero telemetry.',
    defaultModel: 'llama3:8b',
    models: ['llama3:8b', 'qwen2.5:7b', 'mistral:7b', 'deepseek-r1:8b']
  },
  GROQ: {
    id: 'groq',
    name: 'Groq Cloud LPU',
    type: 'online',
    description: 'Ultra-fast online inference for rapid cloud planning when internet is enabled.',
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768']
  }
};

export const CONNECTION_MODES = {
  AUTO: 'auto',
  FORCE_OFFLINE: 'offline',
  ONLINE_ONLY: 'online'
};

export const STORAGE_KEYS = {
  PREFERENCES: 'forge_ui_preferences_v1',
  DRAFT: 'forge_active_draft_v1'
};
