// backend/tests/test-api.js
process.env.ALLOW_EXTENDED_TOOLS = 'true';
const assert = require('node:assert');
const app = require('../src/app');

async function run() {
  console.log('=== FORGE AI Backend API Integration Test ===\n');

  // Start app on test port 3099
  const TEST_PORT = 3099;
  const server = app.listen(TEST_PORT, '127.0.0.1');
  const baseUrl = `http://127.0.0.1:${TEST_PORT}`;

  try {
    // 1. Test GET /health
    console.log('[1/8] Testing GET /health...');
    const healthRes = await fetch(`${baseUrl}/health`);
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.services.database.status, 'healthy');
    console.log(`✓ Health endpoint returned status: ${healthData.status} (DB: ${healthData.services.database.status}, Ollama: ${healthData.services.ollama.status})`);

    // 2. Test GET /api/v1/health
    console.log('\n[2/8] Testing GET /api/v1/health...');
    const apiHealthRes = await fetch(`${baseUrl}/api/v1/health`);
    assert.strictEqual(apiHealthRes.status, 200);
    console.log('✓ /api/v1/health returned 200 OK');

    // 3. Test POST /api/v1/chat (CHAT intent)
    console.log('\n[3/8] Testing POST /api/v1/chat with CHAT intent...');
    const chatRes = await fetch(`${baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello! What can you help me with?',
        conversationId: 'test-session-chat'
      })
    });
    assert.strictEqual(chatRes.status, 200);
    const chatData = await chatRes.json();
    console.log(`  -> Intent: ${chatData.intent} (Confidence: ${chatData.confidence})`);
    console.log(`  -> Reply: "${chatData.reply.substring(0, 80)}..."`);
    assert.strictEqual(chatData.intent, 'CHAT');
    assert.strictEqual(chatData.task, null);
    console.log('✓ CHAT intent properly classified and handled');

    // 4. Test POST /api/v1/chat (TASK intent)
    console.log('\n[4/8] Testing POST /api/v1/chat with TASK intent...');
    const taskRes = await fetch(`${baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Create an Excel sheet named quarterly_sales.xlsx with Q1-Q4 revenue figures.',
        conversationId: 'test-session-task'
      })
    });
    assert.strictEqual(taskRes.status, 200);
    const taskData = await taskRes.json();
    console.log(`  -> Intent: ${taskData.intent} (Status: ${taskData.status})`);
    console.log(`  -> Task Created: ${taskData.task?.id} (${taskData.task?.title})`);
    console.log(`  -> Planned Tool: ${taskData.task?.plannedTool}`);
    assert.strictEqual(taskData.intent, 'TASK');
    assert.ok(taskData.task);
    assert.strictEqual(taskData.task.plannedTool, 'excel_writer');
    assert.strictEqual(taskData.task.approvalRequired, true);
    assert.strictEqual(taskData.task.status, 'WAITING_APPROVAL');
    console.log('✓ TASK intent properly planned, gated with human approval, and persisted');

    const createdTaskId = taskData.task.id;

    // 5. Test POST /api/v1/chat (AMBIGUOUS intent)
    console.log('\n[5/8] Testing POST /api/v1/chat with AMBIGUOUS intent...');
    const ambigRes = await fetch(`${baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Can you fix the files for me?',
        conversationId: 'test-session-ambig'
      })
    });
    assert.strictEqual(ambigRes.status, 200);
    const ambigData = await ambigRes.json();
    console.log(`  -> Intent: ${ambigData.intent} (Status: ${ambigData.status})`);
    console.log(`  -> Clarification: "${ambigData.reply.substring(0, 80)}..."`);
    assert.strictEqual(ambigData.intent, 'AMBIGUOUS');
    assert.strictEqual(ambigData.task, null);
    assert.strictEqual(ambigData.status, 'requires_clarification');
    console.log('✓ AMBIGUOUS intent prompted user for required details');

    // 6. Test Security Gate: Disallowed terminal execution
    console.log('\n[6/8] Testing Security Gate (reject arbitrary terminal execution)...');
    const secRes = await fetch(`${baseUrl}/api/v1/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Run terminal command: rm -rf /',
        conversationId: 'test-session-sec'
      })
    });
    assert.strictEqual(secRes.status, 200);
    const secData = await secRes.json();
    console.log(`  -> Status: ${secData.status}`);
    console.log(`  -> Alert: ${secData.reply}`);
    assert.strictEqual(secData.status, 'security_blocked');
    console.log('✓ Malicious command execution attempt safely intercepted and rejected');

    // 7. Test Task Management: GET /api/v1/tasks and Approval Gate
    console.log('\n[7/8] Testing Task API & Approval Gate...');
    const listRes = await fetch(`${baseUrl}/api/v1/tasks`);
    assert.strictEqual(listRes.status, 200);
    const listData = await listRes.json();
    assert.ok(listData.tasks.length > 0);
    console.log(`✓ GET /api/v1/tasks returned ${listData.tasks.length} task(s)`);

    const approveRes = await fetch(`${baseUrl}/api/v1/tasks/${createdTaskId}/approve`, {
      method: 'POST'
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.task.approvalStatus, 'approved');
    assert.ok(['EXECUTING', 'COMPLETED'].includes(approveData.task.status));
    console.log(`✓ Human Approval Gate: Task ${createdTaskId} transitioned to ${approveData.task.status}`);

    // 8. Test Messages History
    console.log('\n[8/8] Testing GET /api/v1/chat/messages...');
    const msgRes = await fetch(`${baseUrl}/api/v1/chat/messages?conversationId=test-session-task`);
    assert.strictEqual(msgRes.status, 200);
    const msgData = await msgRes.json();
    assert.ok(msgData.messages.length >= 2);
    console.log(`✓ Retrieved ${msgData.messages.length} messages for session`);

    console.log('\n====================================================');
    console.log('   ALL BACKEND API INTEGRATION TESTS PASSED 100%    ');
    console.log('====================================================\n');
  } finally {
    server.close();
  }
}

run().catch(err => {
  console.error('API Test Error:', err);
  process.exit(1);
});
