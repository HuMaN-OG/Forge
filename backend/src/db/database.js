const fs = require('node:fs');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const config = require('../config');

let dbInstance = null;

function getDatabase() {
  if (dbInstance) {
    return dbInstance;
  }

  const dbDir = path.dirname(config.db.path);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  dbInstance = new DatabaseSync(config.db.path);

  // Enable WAL mode and foreign keys for high reliability and performance
  dbInstance.exec('PRAGMA journal_mode = WAL;');
  dbInstance.exec('PRAGMA foreign_keys = ON;');

  initializeSchema(dbInstance);
  return dbInstance;
}

function initializeSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL,
      sender TEXT NOT NULL, -- 'user' | 'assistant' | 'system'
      text TEXT NOT NULL,
      intent TEXT,          -- 'CHAT' | 'TASK' | 'AMBIGUOUS' | null
      metadata TEXT,        -- JSON string
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      conversation_id TEXT,
      title TEXT NOT NULL,
      prompt TEXT NOT NULL,
      status TEXT NOT NULL, -- 'UNDERSTANDING', 'PLANNING', 'WAITING_APPROVAL', 'EXECUTING', 'VERIFYING', 'COMPLETED', 'REJECTED', 'FAILED'
      type TEXT NOT NULL DEFAULT 'offline', -- 'offline' | 'online_only'
      provider TEXT NOT NULL,
      planned_tool TEXT NOT NULL,
      approval_required INTEGER NOT NULL DEFAULT 1,
      approval_status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
      approval_details TEXT, -- JSON string
      steps TEXT NOT NULL,   -- JSON string array
      artifacts TEXT,        -- JSON string array
      verification_details TEXT, -- JSON string
      duration_seconds INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      completed_at TEXT
    );

    CREATE TABLE IF NOT EXISTS intent_logs (
      id TEXT PRIMARY KEY,
      prompt TEXT NOT NULL,
      intent TEXT NOT NULL,
      confidence REAL NOT NULL,
      reasoning TEXT,
      requires_clarification INTEGER NOT NULL DEFAULT 0,
      clarification_question TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
  `);

  // Safe additive schema migration
  try {
    const tableInfo = db.prepare("PRAGMA table_info(tasks)").all();
    const colNames = tableInfo.map(c => c.name);

    if (!colNames.includes('execution_output')) {
      db.exec("ALTER TABLE tasks ADD COLUMN execution_output TEXT;");
    }
    if (!colNames.includes('execution_status')) {
      db.exec("ALTER TABLE tasks ADD COLUMN execution_status TEXT;");
    }
    if (!colNames.includes('executed_at')) {
      db.exec("ALTER TABLE tasks ADD COLUMN executed_at TEXT;");
    }
  } catch (migErr) {
    console.warn('[Database Migration Warning]', migErr.message);
  }
}

module.exports = {
  getDatabase
};
