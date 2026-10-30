// backend/tests/test-authenticated-integration.js
const assert = require('node:assert');
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { getDatabase } = require('../src/db/database');
const { taskRepository } = require('../src/db/repositories');
const config = require('../src/config');
const automationService = require('../src/services/automationService');

async function run() {
  console.log('================================================================');
  console.log('  FORGE AI — AUTHENTICATED BACKEND-TO-PYTHON INTEGRATION SUITE ');
  console.log('================================================================');

  const backendUrl = `http://127.0.0.1:${config.port}`;
  const pythonUrl = config.pythonAutomation.baseUrl.replace(/\/$/, '');
const authToken =
  config.pythonAutomation.token ||
  process.env.FORGE_AUTOMATION_TOKEN;

if (!authToken) {
  throw new Error(
    'FORGE_AUTOMATION_TOKEN must be configured before running this test.'
  );
}

  // --------------------------------------------------------------------------
  // Check 1: Valid token and exact v1.0 contract request to Python
  // --------------------------------------------------------------------------
  console.log('\n[Check 1] Valid token and exact v1.0 contract request to Python FastAPI...');
  const c1Payload = {
    contractVersion: '1.0',
    taskId: `test-task-c1-${Date.now()}`,
    tool: 'file_system',
    action: 'list_directory',
    params: { targetDirectory: '.' },
    workspaceId: 'default',
    executionMode: 'approved'
  };

  const res1 = await fetch(`${pythonUrl}/tools/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'X-FORGE-TOKEN': authToken
    },
    body: JSON.stringify(c1Payload)
  });

  assert.strictEqual(res1.status, 200, `Expected HTTP 200, got ${res1.status}`);
  const data1 = await res1.json();
  assert.strictEqual(data1.success, true, 'Response success should be true');
  assert.strictEqual(data1.contractVersion, '1.0', 'Contract version must be 1.0');
  assert.strictEqual(data1.tool, 'file_system', 'Tool should be file_system');
  assert.strictEqual(data1.action, 'list_directory', 'Action should be list_directory');
  assert.strictEqual(data1.taskId, c1Payload.taskId, 'TaskId should match');
  assert.ok(data1.output && Array.isArray(data1.output.items), 'output.items should be an array');
  assert.ok(typeof data1.output.count === 'number', 'output.count should be a number');
  console.log(`  ✓ Check 1 passed: status 200, v1.0 contract validated, items count: ${data1.output.count}`);

  // --------------------------------------------------------------------------
  // Check 2: Invalid token rejection (passes bad token header, asserts HTTP 401)
  // --------------------------------------------------------------------------
  console.log('\n[Check 2] Invalid token rejection (passes bad token header, asserts HTTP 401)...');
  const res2 = await fetch(`${pythonUrl}/tools/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-FORGE-TOKEN': 'invalid_bad_token_unauthorized_xyz'
    },
    body: JSON.stringify(c1Payload)
  });

  assert.strictEqual(res2.status, 401, `Expected HTTP 401 Unauthorized, got ${res2.status}`);
  const errData2 = await res2.json();
  assert.ok(errData2.detail && errData2.detail.includes('Authentication failed'), 'Detail should mention authentication');
  console.log('  ✓ Check 2 passed: Python service rejected unauthorized request with HTTP 401');

  // --------------------------------------------------------------------------
  // Check 3: Missing token handling (backend config with empty token throws safe error)
  // --------------------------------------------------------------------------
  console.log('\n[Check 3] Missing token handling (empty backend token throws safe error)...');
  const originalToken = config.pythonAutomation.token;
  try {
    config.pythonAutomation.token = '';
    let caughtTokenError = null;
    try {
      automationService.getToken();
    } catch (err) {
      caughtTokenError = err;
    }
    assert.ok(caughtTokenError, 'getToken() must throw when token is missing');
    assert.ok(caughtTokenError.message.includes('FORGE_AUTOMATION_TOKEN is missing or empty'), 'Error message must safely indicate missing token');
    assert.ok(!caughtTokenError.message.includes(authToken), 'Error message must NEVER expose any secret token string');

    let caughtExecError = null;
    try {
      await automationService.executeTool({
        contractVersion: '1.0',
        taskId: 'test-empty-token',
        tool: 'file_system',
        action: 'list_directory',
        params: { targetDirectory: '.' }
      });
    } catch (err) {
      caughtExecError = err;
    }
    assert.ok(caughtExecError, 'executeTool must reject when token is missing');
    assert.ok(caughtExecError.message.includes('FORGE_AUTOMATION_TOKEN is missing or empty'), 'executeTool must report missing token');
    console.log('  ✓ Check 3 passed: Backend fails safely without exposing token when unconfigured');
  } finally {
    config.pythonAutomation.token = originalToken;
  }

  // --------------------------------------------------------------------------
  // Check 4: Successful directory listing (file_system.list_directory via backend approval)
  // --------------------------------------------------------------------------
  console.log('\n[Check 4] Successful directory listing via backend approval...');
  const task4 = taskRepository.create({
    id: `task-list-dir-${Date.now()}`,
    conversationId: 'session-check4',
    title: 'List Workspace Directory Contents',
    prompt: 'Scan workspace directory and list items safely',
    status: 'WAITING_APPROVAL',
    type: 'offline',
    provider: 'local_system',
    plannedTool: 'file_system',
    approvalRequired: true,
    approvalStatus: 'pending',
    approvalDetails: {
      tool: 'file_system',
      toolAction: 'list_directory',
      toolParams: { targetDirectory: '.' }
    },
    steps: [
      { id: 's1', stage: 'UNDERSTAND', status: 'completed', message: 'Ready' },
      { id: 's2', stage: 'PLAN', status: 'completed', message: 'Planned' },
      { id: 's3', stage: 'APPROVE', status: 'in_progress', message: 'Awaiting operator authorization' },
      { id: 's4', stage: 'EXECUTE', status: 'pending', message: 'Pending' },
      { id: 's5', stage: 'VERIFY', status: 'pending', message: 'Pending' },
      { id: 's6', stage: 'STORE', status: 'pending', message: 'Pending' },
      { id: 's7', stage: 'LEARN', status: 'pending', message: 'Pending' }
    ]
  });

  const res4 = await fetch(`${backendUrl}/api/v1/tasks/${task4.id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  assert.strictEqual(res4.status, 200, `Expected HTTP 200 from approve, got ${res4.status}`);
  const data4 = await res4.json();
  assert.strictEqual(data4.success, true);
  assert.strictEqual(data4.task.status, 'COMPLETED');
  assert.strictEqual(data4.task.approvalStatus, 'approved');
  assert.ok(data4.execution && data4.execution.output, 'Execution output must be returned');
  assert.ok(Array.isArray(data4.execution.output.items), 'Output items must be an array');
  console.log(`  ✓ Check 4 passed: Task ${task4.id} executed successfully. Items found: ${data4.execution.output.count}`);

  // --------------------------------------------------------------------------
  // Check 5: Task rejection without Python dispatch
  // --------------------------------------------------------------------------
  console.log('\n[Check 5] Task rejection without Python dispatch...');
  const task5 = taskRepository.create({
    id: `task-reject-${Date.now()}`,
    conversationId: 'session-check5',
    title: 'Workspace Operation to Reject',
    prompt: 'List directory files',
    status: 'WAITING_APPROVAL',
    type: 'offline',
    provider: 'local_system',
    plannedTool: 'file_system',
    approvalRequired: true,
    approvalStatus: 'pending',
    approvalDetails: {
      tool: 'file_system',
      toolAction: 'list_directory',
      toolParams: { targetDirectory: '.' }
    },
    steps: [
      { id: 's1', stage: 'UNDERSTAND', status: 'completed', message: 'Ready' },
      { id: 's2', stage: 'PLAN', status: 'completed', message: 'Planned' },
      { id: 's3', stage: 'APPROVE', status: 'in_progress', message: 'Awaiting operator authorization' },
      { id: 's4', stage: 'EXECUTE', status: 'pending', message: 'Pending' },
      { id: 's5', stage: 'VERIFY', status: 'pending', message: 'Pending' },
      { id: 's6', stage: 'STORE', status: 'pending', message: 'Pending' },
      { id: 's7', stage: 'LEARN', status: 'pending', message: 'Pending' }
    ]
  });

  const res5 = await fetch(`${backendUrl}/api/v1/tasks/${task5.id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Operator rejected execution during security check.' })
  });
  assert.strictEqual(res5.status, 200, `Expected HTTP 200 from reject, got ${res5.status}`);
  const data5 = await res5.json();
  assert.strictEqual(data5.success, true);
  assert.strictEqual(data5.task.status, 'REJECTED');
  assert.strictEqual(data5.task.approvalStatus, 'rejected');

  const inDb5 = taskRepository.findById(task5.id);
  assert.strictEqual(inDb5.status, 'REJECTED');
  assert.strictEqual(inDb5.approvalStatus, 'rejected');
  assert.strictEqual(inDb5.executionOutput, null, 'SQLite executionOutput must remain null (zero calls to Python)');

  // Attempt to approve rejected task -> must fail with 409 Conflict
  const res5Approve = await fetch(`${backendUrl}/api/v1/tasks/${task5.id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  assert.strictEqual(res5Approve.status, 409, `Expected HTTP 409 when approving rejected task, got ${res5Approve.status}`);

  // Attempt to reject already rejected task -> must fail with 409 Conflict
  const res5RejectAgain = await fetch(`${backendUrl}/api/v1/tasks/${task5.id}/reject`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  assert.strictEqual(res5RejectAgain.status, 409, `Expected HTTP 409 when rejecting already rejected task, got ${res5RejectAgain.status}`);
  console.log('  ✓ Check 5 passed: Task rejected cleanly, zero Python calls, subsequent approval/rejection safely rejected (409)');

  // --------------------------------------------------------------------------
  // Check 6: Simultaneous approval race condition prevention
  // --------------------------------------------------------------------------
  console.log('\n[Check 6] Simultaneous approval race condition prevention (5 concurrent calls)...');
  const task6 = taskRepository.create({
    id: `task-race-${Date.now()}`,
    conversationId: 'session-check6',
    title: 'Concurrent Race Test Task',
    prompt: 'List directory',
    status: 'WAITING_APPROVAL',
    type: 'offline',
    provider: 'local_system',
    plannedTool: 'file_system',
    approvalRequired: true,
    approvalStatus: 'pending',
    approvalDetails: {
      tool: 'file_system',
      toolAction: 'list_directory',
      toolParams: { targetDirectory: '.' }
    },
    steps: [
      { id: 's1', stage: 'UNDERSTAND', status: 'completed', message: 'Ready' },
      { id: 's2', stage: 'PLAN', status: 'completed', message: 'Planned' },
      { id: 's3', stage: 'APPROVE', status: 'in_progress', message: 'Awaiting operator authorization' },
      { id: 's4', stage: 'EXECUTE', status: 'pending', message: 'Pending' },
      { id: 's5', stage: 'VERIFY', status: 'pending', message: 'Pending' },
      { id: 's6', stage: 'STORE', status: 'pending', message: 'Pending' },
      { id: 's7', stage: 'LEARN', status: 'pending', message: 'Pending' }
    ]
  });

  const results6 = await Promise.all([
    fetch(`${backendUrl}/api/v1/tasks/${task6.id}/approve`, { method: 'POST' }),
    fetch(`${backendUrl}/api/v1/tasks/${task6.id}/approve`, { method: 'POST' }),
    fetch(`${backendUrl}/api/v1/tasks/${task6.id}/approve`, { method: 'POST' }),
    fetch(`${backendUrl}/api/v1/tasks/${task6.id}/approve`, { method: 'POST' }),
    fetch(`${backendUrl}/api/v1/tasks/${task6.id}/approve`, { method: 'POST' })
  ]);

  const statuses6 = results6.map(r => r.status);
  const count200 = statuses6.filter(s => s === 200).length;
  const count409 = statuses6.filter(s => s === 409).length;

  assert.strictEqual(count200, 1, `Exactly ONE request must return 200 OK. Got ${count200}`);
  assert.strictEqual(count409, 4, `All 4 other concurrent requests must return 409 Conflict. Got ${count409}`);
  console.log(`  ✓ Check 6 passed: Exactly 1 returned 200 OK, 4 returned 409 Conflict. Statuses: [${statuses6.join(', ')}]`);

  // --------------------------------------------------------------------------
  // Check 7: Actual Python response persisted in SQLite
  // --------------------------------------------------------------------------
  console.log('\n[Check 7] Actual Python response persisted in SQLite...');
  const dbRecord4 = taskRepository.findById(task4.id);
  assert.ok(dbRecord4, 'Task 4 must exist in SQLite');
  assert.strictEqual(dbRecord4.status, 'COMPLETED');
  assert.strictEqual(dbRecord4.executionStatus, 'completed');
  assert.ok(dbRecord4.executionOutput, 'dbRecord.executionOutput must not be null');
  assert.strictEqual(dbRecord4.executionOutput.success, true);
  assert.ok(typeof dbRecord4.executionOutput.count === 'number', 'executionOutput.count must be a number');
  assert.ok(Array.isArray(dbRecord4.executionOutput.items), 'executionOutput.items must be an array');
  assert.ok(typeof dbRecord4.executedAt === 'string', 'dbRecord.executedAt must be an ISO timestamp');
  assert.ok(typeof dbRecord4.completedAt === 'string', 'dbRecord.completedAt must be an ISO timestamp');
  console.log(`  ✓ Check 7 passed: SQLite persisted real Python output with ${dbRecord4.executionOutput.count} items, executedAt: ${dbRecord4.executedAt}`);

  // --------------------------------------------------------------------------
  // Check 8: Python unavailable handling (simulates unreachable Python port)
  // --------------------------------------------------------------------------
  console.log('\n[Check 8] Python unavailable handling (simulates unreachable Python port)...');
  // 8a: Verify automationService throws specific offline error when Python is unreachable
  const unreachableService = Object.assign(Object.create(Object.getPrototypeOf(automationService)), automationService);
  unreachableService.baseUrl = 'http://127.0.0.1:59999';

  let unreachableErr = null;
  try {
    await unreachableService.executeTool({
      contractVersion: '1.0',
      taskId: 'test-unavail',
      tool: 'file_system',
      action: 'list_directory',
      params: { targetDirectory: '.' }
    });
  } catch (err) {
    unreachableErr = err;
  }
  assert.ok(unreachableErr, 'Expected unreachable service to throw an error');
  assert.ok(unreachableErr.message.includes('Automation Service Offline'), `Error must mention Automation Service Offline. Got: ${unreachableErr.message}`);

  // 8b: Test approval route behavior when an unpermitted/failing tool is dispatched in milestone
  const task8 = taskRepository.create({
    id: `task-fail-${Date.now()}`,
    conversationId: 'session-check8',
    title: 'Task with Unpermitted Action',
    prompt: 'Try unpermitted action',
    status: 'WAITING_APPROVAL',
    type: 'offline',
    provider: 'local_system',
    plannedTool: 'unregistered_tool',
    approvalRequired: true,
    approvalStatus: 'pending',
    approvalDetails: {
      tool: 'unregistered_tool',
      toolAction: 'invalid_action',
      toolParams: {}
    },
    steps: [
      { id: 's1', stage: 'UNDERSTAND', status: 'completed', message: 'Ready' },
      { id: 's2', stage: 'PLAN', status: 'completed', message: 'Planned' },
      { id: 's3', stage: 'APPROVE', status: 'in_progress', message: 'Awaiting operator authorization' },
      { id: 's4', stage: 'EXECUTE', status: 'pending', message: 'Pending' },
      { id: 's5', stage: 'VERIFY', status: 'pending', message: 'Pending' },
      { id: 's6', stage: 'STORE', status: 'pending', message: 'Pending' },
      { id: 's7', stage: 'LEARN', status: 'pending', message: 'Pending' }
    ]
  });

  const res8 = await fetch(`${backendUrl}/api/v1/tasks/${task8.id}/approve`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  assert.strictEqual(res8.status, 500, `Expected HTTP 500 when tool validation fails, got ${res8.status}`);
  const data8 = await res8.json();
  assert.strictEqual(data8.success, false);
  assert.ok(data8.error && data8.error.includes('Execution Denied'), `Error must mention Execution Denied. Got: ${data8.error}`);
  console.log('  ✓ Check 8 passed: Handled service unreachable and execution rejection returning HTTP 500 with descriptive error');

  // --------------------------------------------------------------------------
  // Check 9: No false COMPLETED status after failure
  // --------------------------------------------------------------------------
  console.log('\n[Check 9] No false COMPLETED status after failure...');
  const dbRecord8 = taskRepository.findById(task8.id);
  assert.strictEqual(dbRecord8.status, 'FAILED', 'Task status must strictly be FAILED');
  assert.notStrictEqual(dbRecord8.status, 'COMPLETED', 'Task status must NOT be COMPLETED');
  assert.strictEqual(dbRecord8.executionStatus, 'failed', 'executionStatus must strictly be failed');
  assert.ok(dbRecord8.executionOutput && dbRecord8.executionOutput.error, 'executionOutput must persist error details');
  console.log(`  ✓ Check 9 passed: Database record for failed task is strictly FAILED, error persisted: ${dbRecord8.executionOutput.error}`);

  console.log('\n================================================================');
  console.log('  ALL 9 AUTHENTICATED INTEGRATION CHECKS PASSED (100% SUCCESS)  ');
  console.log('================================================================\n');
}

run().catch(err => {
  console.error('\n✖ Integration test failed:', err);
  process.exit(1);
});
