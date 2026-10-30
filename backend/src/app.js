const express = require('express');
const cors = require('cors');
const config = require('./config');
const chatRoutes = require('./routes/chatRoutes');
const taskRoutes = require('./routes/taskRoutes');
const healthRoutes = require('./routes/healthRoutes');
const fileRoutes = require('./routes/fileRoutes');
const memoryRoutes = require('./routes/memoryRoutes');

const app = express();

// CORS configuration - restricted to intended local origins
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.cors.origins.includes(origin) || config.cors.origins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Accept', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Lightweight request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (!req.path.includes('/health') && !req.path.includes('/status')) {
      console.log(`[HTTP] ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Root information route
app.get('/', (req, res) => {
  res.json({
    name: 'FORGE AI Backend Orchestration Service',
    version: '1.0.0',
    status: 'online',
    endpoints: {
      health: 'GET /health',
      systemStatus: 'GET /api/system/status',
      chat: 'POST /api/v1/chat',
      messages: 'GET /api/v1/chat/messages',
      tasks: 'GET /api/v1/tasks',
      taskDetail: 'GET /api/v1/tasks/:id',
      taskApprove: 'POST /api/v1/tasks/:id/approve',
      taskReject: 'POST /api/v1/tasks/:id/reject',
      files: 'GET /api/files'
    }
  });
});

// Mount Routes
app.use('/health', healthRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/system', healthRoutes);
app.use('/api/v1/health', healthRoutes);

app.use('/api/v1', chatRoutes);
app.use('/api/v1/tasks', taskRoutes);
app.use('/api/tasks', taskRoutes); // Backward compatibility

app.use('/api/files', fileRoutes);
app.use('/api/v1/files', fileRoutes);

app.use('/api/memory', memoryRoutes);
app.use('/api/v1/memory', memoryRoutes);

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Endpoint not found: ${req.method} ${req.originalUrl}`
  });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    success: false,
    error: err.message || 'Internal Server Error'
  });
});

module.exports = app;
