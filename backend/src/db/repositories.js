const { getDatabase } = require('./database');
const crypto = require('node:crypto');

function safeJsonParse(str, fallback) {
  if (!str) return fallback;
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
}

const taskRepository = {
  create(task) {
    const db = getDatabase();
    const randSuffix = crypto.randomBytes(2).toString('hex');
    const id = task.id || `task-${Date.now().toString().slice(-6)}-${randSuffix}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO tasks (
        id, conversation_id, title, prompt, status, type, provider,
        planned_tool, approval_required, approval_status, approval_details,
        steps, artifacts, verification_details, duration_seconds,
        execution_output, execution_status, executed_at,
        created_at, completed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      task.conversationId || null,
      task.title,
      task.prompt,
      task.status || 'UNDERSTANDING',
      task.type || 'offline',
      task.provider || 'Ollama (qwen3:4b)',
      task.plannedTool || 'none',
      task.approvalRequired !== false ? 1 : 0,
      task.approvalStatus || 'pending',
      JSON.stringify(task.approvalDetails || null),
      JSON.stringify(task.steps || []),
      JSON.stringify(task.artifacts || []),
      JSON.stringify(task.verificationDetails || null),
      task.durationSeconds || 0,
      JSON.stringify(task.executionOutput || null),
      task.executionStatus || null,
      task.executedAt || null,
      task.createdAt || now,
      task.completedAt || null
    );

    return taskRepository.findById(id);
  },

  findById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id);
    if (!row) return null;

    return {
      id: row.id,
      conversationId: row.conversation_id,
      title: row.title,
      prompt: row.prompt,
      status: row.status,
      type: row.type,
      provider: row.provider,
      plannedTool: row.planned_tool,
      approvalRequired: Boolean(row.approval_required),
      approvalStatus: row.approval_status,
      approvalDetails: safeJsonParse(row.approval_details, null),
      steps: safeJsonParse(row.steps, []),
      artifacts: safeJsonParse(row.artifacts, []),
      verificationDetails: safeJsonParse(row.verification_details, null),
      durationSeconds: row.duration_seconds,
      executionOutput: safeJsonParse(row.execution_output, null),
      executionStatus: row.execution_status || null,
      executedAt: row.executed_at || null,
      createdAt: row.created_at,
      completedAt: row.completed_at
    };
  },

  list(filters = {}) {
    const db = getDatabase();
    let query = 'SELECT * FROM tasks';
    const params = [];
    const conditions = [];

    if (filters.status && filters.status !== 'all') {
      conditions.push('LOWER(status) = LOWER(?)');
      params.push(filters.status);
    }
    if (filters.search) {
      conditions.push('(LOWER(title) LIKE ? OR LOWER(prompt) LIKE ?)');
      params.push(`%${filters.search.toLowerCase()}%`);
      params.push(`%${filters.search.toLowerCase()}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY created_at DESC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);

    return rows.map(row => ({
      id: row.id,
      conversationId: row.conversation_id,
      title: row.title,
      prompt: row.prompt,
      status: row.status,
      type: row.type,
      provider: row.provider,
      plannedTool: row.planned_tool,
      approvalRequired: Boolean(row.approval_required),
      approvalStatus: row.approval_status,
      approvalDetails: safeJsonParse(row.approval_details, null),
      steps: safeJsonParse(row.steps, []),
      artifacts: safeJsonParse(row.artifacts, []),
      verificationDetails: safeJsonParse(row.verification_details, null),
      durationSeconds: row.duration_seconds,
      executionOutput: safeJsonParse(row.execution_output, null),
      executionStatus: row.execution_status || null,
      executedAt: row.executed_at || null,
      createdAt: row.created_at,
      completedAt: row.completed_at
    }));
  },

  update(id, updates) {
    const db = getDatabase();
    const existing = taskRepository.findById(id);
    if (!existing) return null;

    const merged = { ...existing, ...updates };

    const stmt = db.prepare(`
      UPDATE tasks SET
        status = ?,
        approval_status = ?,
        approval_details = ?,
        steps = ?,
        artifacts = ?,
        verification_details = ?,
        duration_seconds = ?,
        execution_output = ?,
        execution_status = ?,
        executed_at = ?,
        completed_at = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.status,
      merged.approvalStatus,
      JSON.stringify(merged.approvalDetails),
      JSON.stringify(merged.steps),
      JSON.stringify(merged.artifacts),
      JSON.stringify(merged.verificationDetails),
      merged.durationSeconds,
      JSON.stringify(merged.executionOutput || null),
      merged.executionStatus || null,
      merged.executedAt || null,
      merged.completedAt,
      id
    );

    return taskRepository.findById(id);
  },

  /**
   * Atomic SQLite conditional transition for task approval.
   * Ensures that simultaneous approval requests can only claim the task ONCE.
   */
  claimForApproval(id) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE tasks
      SET status = 'EXECUTING', approval_status = 'approved', executed_at = ?
      WHERE id = ? AND status = 'WAITING_APPROVAL' AND approval_status = 'pending'
    `);
    const now = new Date().toISOString();
    const info = stmt.run(now, id);
    return info.changes === 1;
  },

  /**
   * Atomic SQLite conditional transition for task rejection.
   * Prevents rejection if approval or execution has already started.
   */
  claimForRejection(id, reason) {
    const db = getDatabase();
    const stmt = db.prepare(`
      UPDATE tasks
      SET status = 'REJECTED', approval_status = 'rejected', completed_at = ?
      WHERE id = ? AND status = 'WAITING_APPROVAL' AND approval_status = 'pending'
    `);
    const now = new Date().toISOString();
    const info = stmt.run(now, id);
    return info.changes === 1;
  }
};

const messageRepository = {
  create(msg) {
    const db = getDatabase();
    const randSuffix = crypto.randomBytes(3).toString('hex');
    const id = msg.id || `msg-${Date.now()}-${randSuffix}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO messages (id, conversation_id, sender, text, intent, metadata, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      msg.conversationId || 'default-session',
      msg.sender,
      msg.text,
      msg.intent || null,
      JSON.stringify(msg.metadata || {}),
      msg.createdAt || now
    );

    return {
      id,
      conversationId: msg.conversationId || 'default-session',
      sender: msg.sender,
      text: msg.text,
      intent: msg.intent || null,
      metadata: msg.metadata || {},
      createdAt: msg.createdAt || now
    };
  },

  listByConversation(conversationId) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM messages
      WHERE conversation_id = ?
      ORDER BY created_at ASC
    `);
    const rows = stmt.all(conversationId);

    return rows.map(r => ({
      id: r.id,
      conversationId: r.conversation_id,
      sender: r.sender,
      text: r.text,
      intent: r.intent,
      metadata: safeJsonParse(r.metadata, {}),
      createdAt: r.created_at
    }));
  }
};
const intentLogRepository = {
  create(log) {
    const db = getDatabase();
    const id = `intent-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO intent_logs (
        id,
        prompt,
        intent,
        confidence,
        reasoning,
        requires_clarification,
        clarification_question,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      log.prompt,
      log.intent,
      log.confidence,
      log.reasoning || null,
      log.requiresClarification ? 1 : 0,
      log.clarificationQuestion || null,
      now
    );

    return {
      id,
      ...log,
      createdAt: now
    };
  }
};

module.exports = {
  taskRepository,
  messageRepository,
  intentLogRepository
};
