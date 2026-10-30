// backend/tests/test-unit.js
const assert = require('node:assert');
const { getDatabase } = require('../src/db/database');
const { taskRepository, messageRepository } = require('../src/db/repositories');
const taskPlanner = require('../src/services/taskPlanner');
const { isForbiddenTool } = require('../src/schemas/toolSchema');

async function run() {
  console.log('--- Running Backend Unit & Persistence Tests ---');

  // 1. Database Initialization Test
  const db = getDatabase();
  assert.ok(db, 'Database instance should be initialized');
  console.log('✓ SQLite Database initialization passed');

  // 2. Message Repository Test
  const msg = messageRepository.create({
    conversationId: 'test-session-1',
    sender: 'user',
    text: 'Hello test message',
    intent: 'CHAT'
  });
  assert.strictEqual(msg.sender, 'user');
  assert.strictEqual(msg.text, 'Hello test message');
  assert.strictEqual(msg.intent, 'CHAT');
  console.log('✓ Message persistence passed');

  // 3. Task Planning & Persistence Test
  const taskPrompt = 'Create an Excel report for sales with revenue formulas';
  const task = await taskPlanner.planTask(taskPrompt, { conversationId: 'test-session-1' });
  assert.ok(task.id, 'Task must have an ID');
  assert.strictEqual(task.status, 'WAITING_APPROVAL');
  assert.strictEqual(task.approvalRequired, true);
  assert.strictEqual(task.approvalStatus, 'pending');
  assert.strictEqual(task.plannedTool, 'excel_writer');
  assert.strictEqual(task.steps.length, 7);
  console.log('✓ Task planning (Excel) passed with 7 lifecycle stages');

  // 4. Task Query & Update Test
  const fetched = taskRepository.findById(task.id);
  assert.strictEqual(fetched.id, task.id);
  assert.strictEqual(fetched.plannedTool, 'excel_writer');

  const updated = taskRepository.update(task.id, {
    status: 'EXECUTING',
    approvalStatus: 'approved'
  });
  assert.strictEqual(updated.status, 'EXECUTING');
  assert.strictEqual(updated.approvalStatus, 'approved');
  console.log('✓ Task query and state transition passed');

  // 5. Security Policy Gate Test: Arbitrary Terminal Command Rejection
  const maliciousPrompts = [
    'Run terminal command: rm -rf /',
    'Execute bash script to delete files',
    'Run shell powershell.exe -Command "del /f *"'
  ];

  for (const malicious of maliciousPrompts) {
    let errorCaught = false;
    try {
      await taskPlanner.planTask(malicious);
    } catch (err) {
      if (err.message.includes('SECURITY_VIOLATION')) {
        errorCaught = true;
      }
    }
    assert.strictEqual(errorCaught, true, `Should reject malicious prompt: ${malicious}`);
  }
  console.log('✓ Security policy gate: Arbitrary terminal execution attempts successfully blocked');

  // 6. Forbidden Tool Schema Check
  assert.strictEqual(isForbiddenTool('bash_runner'), true);
  assert.strictEqual(isForbiddenTool('terminal_exec'), true);
  assert.strictEqual(isForbiddenTool('powershell'), true);
  assert.strictEqual(isForbiddenTool('excel_writer'), false);
  assert.strictEqual(isForbiddenTool('file_system'), false);
  console.log('✓ Tool safety schema verification passed');

  console.log('\n>>> All Backend Unit Tests Passed Successfully! <<<\n');
}

run().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
