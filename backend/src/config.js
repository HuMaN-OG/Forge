const path = require('node:path');
const dotenv = require('dotenv');

// Load environment variables from backend/.env or workspace root .env
dotenv.config({ path: path.resolve(__dirname, '../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const backendDir = path.resolve(__dirname, '..');
const rootDir = path.resolve(backendDir, '..');

const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '127.0.0.1',
  env: process.env.NODE_ENV || 'development',

  ollama: {
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434',
    model: process.env.OLLAMA_MODEL || 'qwen3:4b',
    timeoutMs: parseInt(process.env.OLLAMA_TIMEOUT_MS || '120000', 10),
  },

  pythonAutomation: {
    baseUrl: process.env.PYTHON_AUTOMATION_URL || 'http://127.0.0.1:8000',
    healthEndpoint: '/health',
    executeEndpoint: '/tools/execute',
    token: process.env.FORGE_AUTOMATION_TOKEN || ''
  },

  workspace: {
    path: path.resolve(process.env.WORKSPACE_DIR || path.join(rootDir, 'workspace_sandbox'))
  },

  db: {
    path: path.isAbsolute(process.env.SQLITE_DB_PATH || '')
      ? process.env.SQLITE_DB_PATH
      : path.resolve(backendDir, process.env.SQLITE_DB_PATH || 'data/forge.db')
  },

  cors: {
    origins: (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000')
      .split(',')
      .map(origin => origin.trim())
  }
};

module.exports = config;
