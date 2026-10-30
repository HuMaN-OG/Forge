const app = require('./app');
const config = require('./config');
const { getDatabase } = require('./db/database');
const ollamaService = require('./services/ollamaService');

async function startServer() {
  console.log('====================================================');
  console.log('           FORGE AI - BACKEND INITIALIZING          ');
  console.log('====================================================');

  // 1. Initialize SQLite persistence
  try {
    getDatabase();
    console.log(`[Database] SQLite database initialized at: ${config.db.path}`);
  } catch (err) {
    console.error('[Database] Failed to initialize SQLite:', err.message);
    process.exit(1);
  }

  // 2. Check local Ollama readiness
  try {
    const health = await ollamaService.checkHealth();
    if (health.available) {
      console.log(`[Ollama] Local Ollama detected at: ${config.ollama.baseUrl}`);
      console.log(`[Ollama] Target model: ${config.ollama.model} (${health.hasTargetModel ? 'Ready' : 'Model not found!'})`);
      if (!health.hasTargetModel) {
        console.warn(`[Ollama] Available models: ${health.availableModels?.join(', ') || 'none'}`);
        console.warn(`[Ollama] Run 'ollama pull ${config.ollama.model}' if needed.`);
      }
    } else {
      console.warn(`[Ollama] Warning: Ollama not reachable at ${config.ollama.baseUrl} (${health.error})`);
      console.warn('[Ollama] Fallback rule classifier will be used until Ollama is online.');
    }
  } catch (err) {
    console.warn('[Ollama] Check failed:', err.message);
  }

  // 3. Start HTTP server
  const server = app.listen(config.port, config.host, () => {
    console.log('----------------------------------------------------');
    console.log(`[Server] FORGE AI Backend running on: http://${config.host}:${config.port}`);
    console.log(`[Server] Chat Endpoint: POST http://${config.host}:${config.port}/api/v1/chat`);
    console.log(`[Server] Health Endpoint: GET http://${config.host}:${config.port}/health`);
    console.log(`[Server] System Status: GET http://${config.host}:${config.port}/api/system/status`);
    console.log('====================================================\n');
  });

  // Handle listen errors (e.g. port collision)
  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.error(`\n[Server Fatal] Port ${config.port} is already in use by another process.`);
      console.error(`[Server Fatal] Run 'Get-NetTCPConnection -LocalPort ${config.port}' to inspect conflicting processes.`);
    } else {
      console.error('\n[Server Fatal] Unexpected server error:', err);
    }
    process.exit(1);
  });

  // Nodemon restart handling (SIGUSR2)
  process.once('SIGUSR2', () => {
    console.log('[Server] Nodemon restart signal (SIGUSR2) received. Closing connections...');
    server.close(() => {
      process.kill(process.pid, 'SIGUSR2');
    });
  });

  // Graceful shutdown on termination signals
  let isShuttingDown = false;
  const shutdown = (signal) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      console.log('[Server] HTTP connections closed.');
      process.exit(0);
    });

    // Force terminate after 3s if connections hang
    setTimeout(() => {
      console.warn('[Server] Forcefully closing pending connections.');
      process.exit(0);
    }, 3000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));

  process.on('uncaughtException', (err) => {
    console.error('[Process Fatal] Uncaught Exception:', err);
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('[Process Fatal] Unhandled Rejection at:', promise, 'reason:', reason);
  });

  return server;
}

startServer().catch(err => {
  console.error('[Server Fatal] Unhandled exception during startup:', err);
  process.exit(1);
});
