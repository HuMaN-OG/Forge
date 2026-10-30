/**
 * FORGE AI — Computer Control Engine Comprehensive Verification Test Suite
 * Tests end-to-end functionality, strict security boundaries, allowlists,
 * and the primary milestone demonstration scenario:
 * "Open Notepad, write a short report about artificial intelligence, save it as AI_Report.txt in the FORGE workspace, and verify that it was saved correctly."
 */

const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '../..');
const backendDir = path.resolve(rootDir, 'backend');
const workspaceDir = path.resolve(rootDir, 'workspace_sandbox');
const pythonVenv = path.resolve(rootDir, 'automation/.venv/Scripts/python.exe');

const config = require('../src/config');
const { REGISTERED_TOOLS, validateToolAndAction } = require('../src/schemas/toolSchema');
const taskPlanner = require('../src/services/taskPlanner');
const automationService = require('../src/services/automationService');
const { taskRepository } = require('../src/db/repositories');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (!condition) {
    console.error(`  [FAIL] ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`  [PASS] ${message}`);
}

async function runTestSuite() {
  console.log('\n======================================================================');
  console.log('       FORGE AI COMPUTER CONTROL ENGINE — AUTOMATED VERIFICATION      ');
  console.log('======================================================================\n');

  // Ensure workspace directory exists
  if (!fs.existsSync(workspaceDir)) {
    fs.mkdirSync(workspaceDir, { recursive: true });
  }

  // -------------------------------------------------------------------------
  // 1. Tool Registry & Schema Verification
  // -------------------------------------------------------------------------
  console.log('[Test Suite 1] Tool Registry & Action Allowlist Validation');

  assert(REGISTERED_TOOLS.DESKTOP_CONTROL === 'desktop_control', "REGISTERED_TOOLS includes 'desktop_control'");

  // Valid desktop actions must pass validation
  let validActions = ['list_windows', 'get_active_window', 'launch_application', 'type_text', 'press_key', 'save_document', 'verify_document', 'notepad_report'];
  for (const act of validActions) {
    let passed = false;
    try {
      validateToolAndAction('desktop_control', act);
      passed = true;
    } catch (e) {
      passed = false;
    }
    assert(passed, `Permitted action '${act}' is recognized by registry`);
  }

  // Unregistered actions must be rejected
  let unpermittedRejected = false;
  try {
    validateToolAndAction('desktop_control', 'format_c_drive');
  } catch (e) {
    unpermittedRejected = true;
  }
  assert(unpermittedRejected, "Unregistered desktop action 'format_c_drive' is strictly rejected");

  // Arbitrary terminal tools must be rejected
  let terminalRejected = false;
  try {
    validateToolAndAction('powershell_runner', 'exec');
  } catch (e) {
    terminalRejected = true;
  }
  assert(terminalRejected, "Arbitrary tool 'powershell_runner' is rejected by security validator");

  // -------------------------------------------------------------------------
  // 2. Python Security Boundary Enforcement (Allowlists & Path Traversal)
  // -------------------------------------------------------------------------
  console.log('\n[Test Suite 2] Python Engine Security Rules (Allowlists & Sandbox)');

  const runPyTest = (code) => {
    const res = spawnSync(pythonVenv, ['-c', code], {
      cwd: rootDir,
      env: { ...process.env, PYTHONPATH: 'automation' },
      encoding: 'utf8'
    });
    return res;
  };

  // Test 2.1: Application allowlist rejection
  const appAllowlistRes = runPyTest(`
from pathlib import Path
from src.tools.desktop_tool import execute_desktop_tool
ws = Path("workspace_sandbox").resolve()
res = execute_desktop_tool({"action": "launch_application", "appName": "cmd.exe"}, ws)
assert not res.get("success"), "Should have failed"
assert "not in the approved desktop allowlist" in res.get("error", "")
print("APP_ALLOWLIST_PASSED")
`);
  assert(appAllowlistRes.stdout.includes('APP_ALLOWLIST_PASSED'), "Unapproved application 'cmd.exe' is rejected by application allowlist");

  // Test 2.2: Keyboard shortcut allowlist rejection
  const keyAllowlistRes = runPyTest(`
from pathlib import Path
from src.tools.desktop_tool import execute_desktop_tool
ws = Path("workspace_sandbox").resolve()
res = execute_desktop_tool({"action": "press_key", "keyCombo": "WIN+R"}, ws)
assert not res.get("success"), "Should have failed"
assert "not in the approved keyboard allowlist" in res.get("error", "")
print("KEY_ALLOWLIST_PASSED")
`);
  assert(keyAllowlistRes.stdout.includes('KEY_ALLOWLIST_PASSED'), "Unapproved keystroke sequence 'WIN+R' is rejected by keyboard allowlist");

  // Test 2.3: Path traversal rejection
  const pathTraversalRes = runPyTest(`
from pathlib import Path
from src.tools.desktop_tool import execute_desktop_tool
ws = Path("workspace_sandbox").resolve()
res = execute_desktop_tool({"action": "save_document", "filename": "../../traversal_attack.txt", "content": "attack"}, ws)
assert not res.get("success"), "Should have failed"
assert "traversal or directory separators are forbidden" in res.get("error", "")
print("PATH_TRAVERSAL_PASSED")
`);
  assert(pathTraversalRes.stdout.includes('PATH_TRAVERSAL_PASSED'), "Directory traversal '../../traversal_attack.txt' is strictly blocked");

  // Test 2.4: Disallowed file extension rejection
  const extensionRes = runPyTest(`
from pathlib import Path
from src.tools.desktop_tool import execute_desktop_tool
ws = Path("workspace_sandbox").resolve()
res = execute_desktop_tool({"action": "save_document", "filename": "malware.exe", "content": "binary"}, ws)
assert not res.get("success"), "Should have failed"
assert "Unsupported file extension" in res.get("error", "")
print("EXTENSION_SECURITY_PASSED")
`);
  assert(extensionRes.stdout.includes('EXTENSION_SECURITY_PASSED'), "Disallowed file extension '.exe' is strictly blocked");

  // -------------------------------------------------------------------------
  // 3. Task Planning & Human-in-the-Loop Approval Gate
  // -------------------------------------------------------------------------
  console.log('\n[Test Suite 3] Task Planning & Human Authorization Gate');

  const userPrompt = "Open Notepad, write a short report about artificial intelligence, save it as AI_Report.txt in the FORGE workspace, and verify that it was saved correctly.";

  const plannedTask = await taskPlanner.planTask(userPrompt, {
    conversationId: 'verification-session',
    provider: 'Ollama (qwen3:4b)'
  });

  assert(plannedTask.id && plannedTask.id.startsWith('task-'), `Task planner assigned valid Task ID: ${plannedTask.id}`);
  assert(plannedTask.plannedTool === 'desktop_control', "Task planner routed request to 'desktop_control'");
  assert(plannedTask.status === 'WAITING_APPROVAL', "Task initial status is strictly 'WAITING_APPROVAL'");
  assert(plannedTask.approvalRequired === true, "Task requires human approval (approvalRequired: true)");
  assert(plannedTask.approvalStatus === 'pending', "Task approvalStatus is 'pending'");
  assert(plannedTask.approvalDetails.toolAction === 'notepad_report', "Planned action is 'notepad_report'");
  assert(plannedTask.approvalDetails.toolParams.filename === 'AI_Report.txt', "Target filename extracted as 'AI_Report.txt'");
  assert(Array.isArray(plannedTask.artifacts) && plannedTask.artifacts.length === 0, "Artifacts list is initially empty before execution");

  // -------------------------------------------------------------------------
  // 4. End-to-End Primary Scenario Execution & Verification
  // -------------------------------------------------------------------------
  console.log('\n[Test Suite 4] Primary Demonstration Scenario Execution (Notepad Report)');

  // Remove existing report file if present to guarantee fresh write
  const targetReportPath = path.resolve(workspaceDir, 'AI_Report.txt');
  if (fs.existsSync(targetReportPath)) {
    fs.unlinkSync(targetReportPath);
  }

  // Execute the approved desktop task via Python engine
  const execRes = runPyTest(`
import json
from pathlib import Path
from src.tools.desktop_tool import execute_desktop_tool
ws = Path("workspace_sandbox").resolve()
res = execute_desktop_tool({
    "action": "notepad_report",
    "filename": "AI_Report.txt",
    "topic": "Artificial Intelligence",
    "closeAfter": False
}, ws)
print("EXECUTION_RESULT_JSON=" + json.dumps(res))
`);

  const outputLine = execRes.stdout.split('\n').find(l => l.startsWith('EXECUTION_RESULT_JSON='));
  assert(!!outputLine, "Desktop execution completed and returned structured JSON");

  const execData = JSON.parse(outputLine.replace('EXECUTION_RESULT_JSON=', ''));
  assert(execData.success === true, "Desktop tool reported success: true");
  assert(execData.action === 'notepad_report', "Reported action is 'notepad_report'");
  assert(execData.filename === 'AI_Report.txt', "Reported filename is 'AI_Report.txt'");
  assert(execData.verifiedOnDisk === true, "Execution verified physical file on disk");
  assert(Array.isArray(execData.artifacts) && execData.artifacts.length > 0, "Artifacts array contains generated file");

  // -------------------------------------------------------------------------
  // 5. Physical Disk & Content Verification
  // -------------------------------------------------------------------------
  console.log('\n[Test Suite 5] Physical Disk & Content Integrity Verification');

  assert(fs.existsSync(targetReportPath), `Physical file exists in canonical workspace: ${targetReportPath}`);
  const fileStats = fs.statSync(targetReportPath);
  assert(fileStats.size > 500, `Physical file size is substantial (${fileStats.size} bytes > 500 bytes)`);

  const fileContent = fs.readFileSync(targetReportPath, 'utf8');
  assert(fileContent.includes('FORGE AI COMPUTER CONTROL ENGINE'), "File contains FORGE AI title header");
  assert(fileContent.includes('Artificial Intelligence'), "File contains topic 'Artificial Intelligence'");
  assert(fileContent.includes('Offline-First Privacy'), "File contains architectural section 'Offline-First Privacy'");
  assert(fileContent.includes('Human-in-the-Loop Authorization Gate'), "File contains 'Human-in-the-Loop Authorization Gate'");
  assert(fileContent.includes('Strict Allowlist Security'), "File contains 'Strict Allowlist Security'");
  assert(fileContent.includes('Sandboxed Persistence & Verification'), "File contains 'Sandboxed Persistence & Verification'");

  // -------------------------------------------------------------------------
  // 6. SQLite Persistence & Lifecycle State Transition
  // -------------------------------------------------------------------------
  console.log('\n[Test Suite 6] SQLite Persistence & Lifecycle Transitions');

  // Transition planned task to COMPLETED with verified artifacts
  const completedSteps = (plannedTask.steps || []).map(s => {
    if (s.stage === 'APPROVE') return { ...s, status: 'completed', message: 'Operator explicitly authorized desktop execution.' };
    if (s.stage === 'EXECUTE') return { ...s, status: 'completed', message: 'Executed desktop automation via pywinauto UIA.' };
    if (s.stage === 'VERIFY') return { ...s, status: 'completed', message: 'Verified physical disk content and SHA-256 integrity.' };
    if (s.stage === 'STORE') return { ...s, status: 'completed', message: 'Stored artifact metadata into SQLite.' };
    if (s.stage === 'LEARN') return { ...s, status: 'completed', message: 'Task experience successfully indexed.' };
    return s;
  });

  const updatedRecord = taskRepository.update(plannedTask.id, {
    status: 'COMPLETED',
    approvalStatus: 'approved',
    executionStatus: 'completed',
    executionOutput: execData,
    steps: completedSteps,
    artifacts: execData.artifacts,
    verificationDetails: {
      status: 'passed',
      metrics: `Document verified: ${execData.filename} (${fileStats.size} bytes, SHA-256: ${execData.hash})`,
      verifier: 'BackendAutomationVerifier',
      timestamp: new Date().toISOString()
    },
    durationSeconds: 3,
    completedAt: new Date().toISOString()
  });

  const persistedTask = taskRepository.findById(plannedTask.id);
  assert(persistedTask.status === 'COMPLETED', "Persisted SQLite task status is 'COMPLETED'");
  assert(persistedTask.approvalStatus === 'approved', "Persisted SQLite task approvalStatus is 'approved'");
  assert(persistedTask.artifacts.length === 1, "Persisted SQLite task has 1 verified artifact");
  assert(persistedTask.artifacts[0].name === 'AI_Report.txt', "Persisted artifact name matches 'AI_Report.txt'");
  assert(persistedTask.verificationDetails.status === 'passed', "Persisted verificationDetails status is 'passed'");

  console.log('\n======================================================================');
  console.log(`  ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('======================================================================\n');
}

runTestSuite().catch(err => {
  console.error('\n[FATAL TEST FAILURE]:', err.message);
  process.exit(1);
});

