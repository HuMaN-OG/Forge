const express = require('express');
const router = express.Router();
const config = require('../config');
const ollamaService = require('../services/ollamaService');
const automationService = require('../services/automationService');
const { getDatabase } = require('../db/database');

async function handleHealthCheck(req, res) {
  const start = performance.now();

  // 1. Check SQLite
  let dbStatus = 'healthy';
  try {
    const db = getDatabase();
    const result = db.prepare('SELECT 1 as alive').get();
    dbStatus = result?.alive === 1 ? 'healthy' : 'degraded';
  } catch (err) {
    dbStatus = 'down';
  }

  // 2. Check Ollama
  let ollamaHealth = { status: 'offline', available: false };
  try {
    ollamaHealth = await ollamaService.checkHealth();
  } catch (err) {
    ollamaHealth = { status: 'down', available: false, error: err.message };
  }

  // 3. Check Python Automation Service
  let pyHealth = { status: 'offline', available: false };
  try {
    pyHealth = await automationService.checkHealth();
  } catch (err) {
    pyHealth = { status: 'down', available: false, error: err.message };
  }

  const latencyMs = Math.max(1, Math.round(performance.now() - start));
  const isAllHealthy = dbStatus === 'healthy' && ollamaHealth.available;

  const payload = {
    status: isAllHealthy ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),

    // Canonical workspace sandbox path
    workspaceDirectory: config.workspace.path,

    // Compatibility fields for Frontend SystemContext & SystemStatusBar
    isOnline: true,
    connectionMode: 'auto',
    backend: {
      status: 'connected',
      baseUrl: `http://${config.host}:${config.port}`,
      version: '1.0.0',
      latencyMs,
      database: `SQLite (${dbStatus})`
    },
    aiProvider: {
      active: 'ollama',
      model: config.ollama.model,
      isOfflineCapable: true,
      localStatus: ollamaHealth.hasTargetModel ? 'ready' : (ollamaHealth.available ? 'model_missing' : 'offline'),
      availableModels: ollamaHealth.availableModels || []
    },
    automationTools: {
      engine: 'Python FastAPI Automation',
      status: pyHealth.available ? 'available' : 'offline',
      sandboxDirectory: pyHealth.sandboxDirectory || config.workspace.path,
      registeredTools: [
        { name: 'excel_writer', type: 'offline', description: 'Create and format .xlsx spreadsheets locally (openpyxl)' },
        { name: 'file_system', type: 'offline', description: 'Organize, copy, and inspect permitted workspace files' },
        { name: 'desktop_control', type: 'offline', description: 'Safe local desktop UI automation (Notepad, File Explorer) via pywinauto' }
      ]
    },

    // Raw services matrix
    services: {
      server: { status: 'healthy', host: config.host, port: config.port },
      database: { status: dbStatus, path: config.db.path },
      ollama: ollamaHealth,
      pythonAutomation: pyHealth
    }
  };

  return res.status(200).json(payload);
}

// Support all standard health & status paths
router.get('/', handleHealthCheck);
router.get('/health', handleHealthCheck);
router.get('/status', handleHealthCheck);

module.exports = router;
