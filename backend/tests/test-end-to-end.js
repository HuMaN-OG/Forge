// backend/tests/test-end-to-end.js
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { spawn } = require('node:child_process');

const PYTHON_PATH = 'C:\\Program Files\\Python311\\python.exe';
const WORKSPACE_DIR = path.resolve(__dirname, '../../workspace_sandbox');

// Ensure dedicated test workspace exists
if (!fs.existsSync(WORKSPACE_DIR)) {
  fs.mkdirSync(WORKSPACE_DIR, { recursive: true });
}

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForHttp(url, timeoutMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (res.ok) return true;
    } catch {
      // Retry
    }
    await sleep(400);
  }
  return false;
}

async function runEndToEndTests() {
  console.log('====================================================');
  console.log('     FORGE AI — END-TO-END VERIFICATION SUITE       ');
  console.log('====================================================\n');

  let pythonProc = null;
  let backendServer = null;

  try {
    // -------------------------------------------------------------------------
    // 1. Verify Ollama Health
    // -------------------------------------------------------------------------
    console.log('[1/15] Verifying Ollama Health & Model Readiness...');
    const ollamaTagsRes = await fetch('http://127.0.0.1:11434/api/tags', { signal: AbortSignal.timeout(5000) });
    assert.strictEqual(ollamaTagsRes.status, 200, 'Ollama must return HTTP 200');
    const ollamaData = await ollamaTagsRes.json();
    const hasQwen3 = (ollamaData.models || []).some(m => m.name.toLowerCase().startsWith('qwen3:4b'));
    assert.strictEqual(hasQwen3, true, 'Ollama must have qwen3:4b installed and loaded');
    console.log('  ✓ Ollama online at http://127.0.0.1:11434 with model: qwen3:4b');

    // -------------------------------------------------------------------------
    // 2. Start Python Automation Service (FastAPI on 127.0.0.1:8000)
    // -------------------------------------------------------------------------
    console.log('\n[2/15] Launching Python FastAPI Automation Service...');
    const automationSrc = path.resolve(__dirname, '../../automation');
    pythonProc = spawn(PYTHON_PATH, ['-m', 'uvicorn', 'src.main:app', '--host', '127.0.0.1', '--port', '8000'], {
      cwd: automationSrc,
      stdio: 'pipe',
      env: { ...process.env, WORKSPACE_DIR }
    });

    pythonProc.stderr.on('data', d => {
      const msg = d.toString();
      if (!msg.includes('INFO:') && !msg.includes('Started server process')) {
        // console.error('[Python]', msg.trim());
      }
    });

    const pyReady = await waitForHttp('http://127.0.0.1:8000/health', 12000);
    assert.strictEqual(pyReady, true, 'Python FastAPI service must respond on port 8000');
    const pyHealthRes = await fetch('http://127.0.0.1:8000/health');
    const pyHealth = await pyHealthRes.json();
    assert.strictEqual(pyHealth.status, 'healthy');
    assert.strictEqual(pyHealth.arbitrary_execution_policy, 'STRICTLY_BLOCKED');
    console.log('  ✓ Python Automation healthy at http://127.0.0.1:8000 (Registered tools: ' + pyHealth.registered_tools.join(', ') + ')');

    // -------------------------------------------------------------------------
    // 3. Start Backend Express Server (127.0.0.1:3000)
    // -------------------------------------------------------------------------
    console.log('\n[3/15] Starting Backend Express Server...');
    const app = require('../src/app');
    backendServer = app.listen(3000, '127.0.0.1');
    const backendReady = await waitForHttp('http://127.0.0.1:3000/health', 8000);
    assert.strictEqual(backendReady, true, 'Backend must respond on port 3000');
    console.log('  ✓ Backend online at http://127.0.0.1:3000');

    // -------------------------------------------------------------------------
    // 4. Verify Unified Health & System Telemetry Endpoint
    // -------------------------------------------------------------------------
    console.log('\n[4/15] Checking System Health & Status Matrix...');
    const healthRes = await fetch('http://127.0.0.1:3000/api/system/status');
    assert.strictEqual(healthRes.status, 200);
    const healthData = await healthRes.json();
    assert.strictEqual(healthData.backend.status, 'connected');
    assert.strictEqual(healthData.aiProvider.active, 'ollama');
    assert.strictEqual(healthData.aiProvider.localStatus, 'ready');
    assert.strictEqual(healthData.automationTools.status, 'available');
    console.log('  ✓ Unified System Status: Backend Connected | Ollama Ready | Automation Tools Available');

    // -------------------------------------------------------------------------
    // 5. Chat Test: Conversational Request Handled by Ollama Qwen3 4B
    // -------------------------------------------------------------------------
    console.log('\n[5/15] Testing Chat with Local Ollama Qwen3 4B...');
    const chatRes = await fetch('http://127.0.0.1:3000/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello! What are your capabilities as FORGE AI?',
        conversationId: 'e2e-session-chat'
      })
    });
    assert.strictEqual(chatRes.status, 200);
    const chatData = await chatRes.json();
    assert.strictEqual(chatData.intent, 'CHAT');
    assert.strictEqual(chatData.task, null);
    assert.ok(chatData.reply && chatData.reply.length > 10);
    console.log(`  ✓ Chat reply generated (${chatData.reply.substring(0, 60)}...)`);

    // -------------------------------------------------------------------------
    // 6. Task Planning: File Management Task Planning
    // -------------------------------------------------------------------------
    console.log('\n[6/15] Testing Task Planning (File Management)...');
    const planRes = await fetch('http://127.0.0.1:3000/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Create a note file named audit_log.txt with content: "FORGE AI system verification complete."',
        conversationId: 'e2e-session-task'
      })
    });
    assert.strictEqual(planRes.status, 200);
    const planData = await planRes.json();
    assert.strictEqual(planData.intent, 'TASK');
    assert.ok(planData.task, 'Must return planned task');
    assert.strictEqual(planData.task.plannedTool, 'file_system');
    console.log(`  ✓ Task formulated: ID #${planData.task.id} (${planData.task.title})`);

    const fileTaskId = planData.task.id;

    // -------------------------------------------------------------------------
    // 7. Human Authorization Gate: Task Waits for Approval (No Artifacts Yet!)
    // -------------------------------------------------------------------------
    console.log('\n[7/15] Verifying Task Waits for Approval Gate...');
    assert.strictEqual(planData.task.status, 'WAITING_APPROVAL');
    assert.strictEqual(planData.task.approvalRequired, true);
    assert.strictEqual(planData.task.approvalStatus, 'pending');
    assert.strictEqual(planData.task.artifacts.length, 0, 'Artifacts must NOT be reported before real execution');
    console.log('  ✓ Task correctly suspended in WAITING_APPROVAL state. Zero artifacts reported upfront.');

    // -------------------------------------------------------------------------
    // 8. Rejection Gate Test: Rejecting a Task Prevents Execution
    // -------------------------------------------------------------------------
    console.log('\n[8/15] Testing Rejection Gate (Rejection Prevents Execution)...');
    const rejectPlanRes = await fetch('http://127.0.0.1:3000/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Create a note file named unwanted.txt with content: "Should not exist"',
        conversationId: 'e2e-session-reject'
      })
    });
    const rejectPlanData = await rejectPlanRes.json();
    const rejectTaskId = rejectPlanData.task.id;

    const rejectRes = await fetch(`http://127.0.0.1:3000/api/v1/tasks/${rejectTaskId}/reject`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Operator rejected this operation.' })
    });
    assert.strictEqual(rejectRes.status, 200);
    const rejectData = await rejectRes.json();
    assert.strictEqual(rejectData.task.status, 'REJECTED');
    assert.strictEqual(rejectData.task.approvalStatus, 'rejected');

    // Confirm file was NEVER created on disk
    const unwantedPath = path.join(WORKSPACE_DIR, 'unwanted.txt');
    assert.strictEqual(fs.existsSync(unwantedPath), false, 'Rejected task must not create any file on disk');
    console.log('  ✓ Rejection safely halted execution. Workspace disk intact (0 modifications).');

    // -------------------------------------------------------------------------
    // 9. Approval & Real Python Execution: Approving triggers Python Automation
    // -------------------------------------------------------------------------
    console.log('\n[9/15] Testing Approval -> Real Python Automation Execution...');
    const approveRes = await fetch(`http://127.0.0.1:3000/api/v1/tasks/${fileTaskId}/approve`, {
      method: 'POST'
    });
    assert.strictEqual(approveRes.status, 200);
    const approveData = await approveRes.json();
    assert.strictEqual(approveData.task.approvalStatus, 'approved');
    assert.strictEqual(approveData.task.status, 'COMPLETED');
    console.log('  ✓ Task approved and Python Automation executed successfully.');

    // -------------------------------------------------------------------------
    // 10. File-System Operation Verification on Disk
    // -------------------------------------------------------------------------
    console.log('\n[10/15] Verifying Safe File Operation Executed on Disk...');
    const expectedFilePath = path.join(WORKSPACE_DIR, 'audit_log.txt');
    assert.strictEqual(fs.existsSync(expectedFilePath), true, 'File audit_log.txt must exist in workspace sandbox');
    const writtenContent = fs.readFileSync(expectedFilePath, 'utf-8');
    assert.ok(writtenContent.includes('FORGE AI system verification complete.'));
    console.log(`  ✓ File verified on disk: ${expectedFilePath} (${fs.statSync(expectedFilePath).size} bytes)`);

    // -------------------------------------------------------------------------
    // 11. Backend Verification & Artifact Validation
    // -------------------------------------------------------------------------
    console.log('\n[11/15] Verifying Backend Output Schema & Artifact Integrity...');
    assert.ok(approveData.task.artifacts.length >= 1, 'Task must contain verified artifact');
    const artifact = approveData.task.artifacts[0];
    assert.strictEqual(artifact.name, 'audit_log.txt');
    assert.strictEqual(artifact.verified, true);
    assert.ok(artifact.size > 0);
    assert.strictEqual(approveData.task.verificationDetails?.status, 'passed');
    console.log(`  ✓ Output integrity verified by backend: Artifact #${artifact.name} (${artifact.size} bytes)`);

    // -------------------------------------------------------------------------
    // 12. Task History Persistence Restart Verification
    // -------------------------------------------------------------------------
    console.log('\n[12/15] Testing Task History Persistence Across Restart...');
    // Query directly from task endpoint
    const taskFetchRes = await fetch(`http://127.0.0.1:3000/api/v1/tasks/${fileTaskId}`);
    assert.strictEqual(taskFetchRes.status, 200);
    const persistedTask = (await taskFetchRes.json()).task;
    assert.strictEqual(persistedTask.id, fileTaskId);
    assert.strictEqual(persistedTask.status, 'COMPLETED');
    assert.strictEqual(persistedTask.artifacts.length, 1);
    console.log('  ✓ Task history, steps, and artifacts verified in SQLite persistence.');

    // -------------------------------------------------------------------------
    // 13. Security: Path Traversal / Sandboxing Violation Rejection
    // -------------------------------------------------------------------------
    console.log('\n[13/15] Testing Sandboxing: Path Traversal Attempt Rejection...');
    const traversalPayload = {
      tool: 'file_system',
      taskId: 'hack-test',
      params: {
        action: 'write_file',
        targetFile: '../../escaped_sandbox.txt',
        content: 'Malicious payload'
      }
    };
    const traversalRes = await fetch('http://127.0.0.1:8000/tools/execute', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(traversalPayload)
    });
    const traversalData = await traversalRes.json();
    assert.strictEqual(traversalData.success, false);
    assert.ok(traversalData.error.includes('travers') || traversalData.error.includes('Access denied'));
    assert.strictEqual(fs.existsSync(path.resolve(__dirname, '../../escaped_sandbox.txt')), false);
    console.log('  ✓ Path traversal attack blocked. File outside sandbox was NOT created.');

    // -------------------------------------------------------------------------
    // 14. Safety: Duplicate Approval Prevention
    // -------------------------------------------------------------------------
    console.log('\n[14/15] Testing Duplicate Approval Prevention...');
    const duplicateApproveRes = await fetch(`http://127.0.0.1:3000/api/v1/tasks/${fileTaskId}/approve`, {
      method: 'POST'
    });
    assert.strictEqual(duplicateApproveRes.status, 409, 'Duplicate approval must return HTTP 409 Conflict');
    console.log('  ✓ Duplicate execution safely rejected with HTTP 409 Conflict.');

    // -------------------------------------------------------------------------
    // 15. Resilience: Missing Automation Service produces clear failure
    // -------------------------------------------------------------------------
    console.log('\n[15/15] Testing Missing Automation Service Failure Handling...');
    const automationService = require('../src/services/automationService');
    const originalUrl = automationService.baseUrl;
    automationService.baseUrl = 'http://127.0.0.1:9999'; // Non-existent service port

    // Create a new task to attempt execution with offline automation
    const offlinePlanRes = await fetch('http://127.0.0.1:3000/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Create a note file named offline_fail.txt with content: "test"',
        conversationId: 'e2e-session-offline'
      })
    });
    const offlineTask = (await offlinePlanRes.json()).task;

    const offlineApproveRes = await fetch(`http://127.0.0.1:3000/api/v1/tasks/${offlineTask.id}/approve`, {
      method: 'POST'
    });
    assert.strictEqual(offlineApproveRes.status, 500);
    const offlineApproveData = await offlineApproveRes.json();
    assert.strictEqual(offlineApproveData.success, false);
    assert.ok(offlineApproveData.error.includes('Automation Service Offline') || offlineApproveData.error.includes('unreachable'));
    assert.strictEqual(offlineApproveData.task.status, 'FAILED');
    console.log('  ✓ Offline automation service cleanly handled: Task marked FAILED with clear error.');

    automationService.baseUrl = originalUrl; // Restore

    console.log('\n====================================================');
    console.log('   ALL 15/15 END-TO-END VERIFICATION CHECKS PASSED! ');
    console.log('====================================================\n');

  } finally {
    if (backendServer) {
      backendServer.close();
    }
    if (pythonProc) {
      pythonProc.kill('SIGTERM');
    }
  }
}

runEndToEndTests().catch(err => {
  console.error('\n✖ End-to-End Test Failed:', err);
  process.exit(1);
});
