const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

const BASE_URL = 'http://127.0.0.1:3000';
const WORKSPACE = path.resolve(__dirname, '..', '..', 'workspace_sandbox');

async function run() {
  console.log('======================================================================');
  console.log('       FORGE AI — MASTER FEATURE & INTEGRATION VERIFICATION SUITE     ');
  console.log('======================================================================\n');

  let passed = 0;
  let total = 0;

  function record(desc, cond) {
    total++;
    if (cond) {
      console.log(`  [PASS] ${desc}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${desc}`);
      throw new Error(`Assertion failed: ${desc}`);
    }
  }

  // -------------------------------------------------------------
  // SUITE 1: Multi-Turn Context & Conversational Memory
  // -------------------------------------------------------------
  console.log('[Suite 1] Conversational Context, Follow-Up & Memory');
  const session1 = `test-session-mem-${Date.now()}`;

  // Turn 1
  const t1 = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What is my name?', conversationId: session1 })
  })).json();
  record('Turn 1: Unknown name prompt asks for user name', /don't have your name|do not have your name|what should i call you/i.test(t1.reply));

  // Turn 2
  const t2 = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Bhuvan.', conversationId: session1 })
  })).json();
  record('Turn 2: Acknowledges user name as Bhuvan', /Bhuvan/i.test(t2.reply));

  // Turn 3
  const t3 = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'What is my name?', conversationId: session1 })
  })).json();
  record('Turn 3: Recalls user name as Bhuvan from context', /Bhuvan/i.test(t3.reply));

  // -------------------------------------------------------------
  // SUITE 2: Follow-Up Specification & Task Continuation
  // -------------------------------------------------------------
  console.log('\n[Suite 2] Follow-Up Task Planning & Continue Resumption');
  const session2 = `test-session-task-${Date.now()}`;

  // Step A: Ambiguous initiation
  const f1 = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Create an Excel file.', conversationId: session2 })
  })).json();
  record('Ambiguous prompt requests clarification', f1.status === 'requires_clarification' || f1.intent === 'AMBIGUOUS' || /detail|specify|contain/i.test(f1.reply));

  // Step B: Follow-up answering the clarification
  const f2 = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Monthly expenses.', conversationId: session2 })
  })).json();
  record('Follow-up correlates with previous Excel request', f2.intent === 'TASK' && f2.task && f2.task.plannedTool === 'excel_writer');

  // Step C: Continue resumption
  const c1 = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'continue', conversationId: session2 })
  })).json();
  record('"Continue" resumes pending task', c1.task && c1.task.id === f2.task.id && c1.status === 'waiting_approval');

  // -------------------------------------------------------------
  // SUITE 3: Multi-Format Document Generation & Parsing
  // -------------------------------------------------------------
  console.log('\n[Suite 3] Multi-Format Document Generation (Word, PDF, PPTX, CSV, JSON)');

  // 1. Word Document (.docx)
  const docxChat = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Create a Word document explaining artificial intelligence named AI_Guide.docx' })
  })).json();
  record('Word document planned as create_docx', docxChat.task && docxChat.task.approvalDetails.toolAction === 'create_docx');

  const docxExec = await (await fetch(`${BASE_URL}/api/v1/tasks/${docxChat.task.id}/approve`, { method: 'POST' })).json();
  record('Word document execution completed', docxExec.success && docxExec.task.status === 'COMPLETED');
  const docxPath = path.join(WORKSPACE, 'AI_Guide.docx');
  record('Word document exists on disk with non-zero size', fs.existsSync(docxPath) && fs.statSync(docxPath).size > 1000);

  // 2. PDF Document (.pdf)
  const pdfChat = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Generate a PDF document about machine learning named ML_Report.pdf' })
  })).json();
  record('PDF document planned as create_pdf', pdfChat.task && pdfChat.task.approvalDetails.toolAction === 'create_pdf');

  const pdfExec = await (await fetch(`${BASE_URL}/api/v1/tasks/${pdfChat.task.id}/approve`, { method: 'POST' })).json();
  record('PDF execution completed', pdfExec.success && pdfExec.task.status === 'COMPLETED');
  const pdfPath = path.join(WORKSPACE, 'ML_Report.pdf');
  record('PDF exists on disk with non-zero size', fs.existsSync(pdfPath) && fs.statSync(pdfPath).size > 500);

  // 3. PowerPoint Presentation (.pptx)
  const pptxChat = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Create a PowerPoint presentation about neural networks named NN_Slides.pptx' })
  })).json();
  record('PowerPoint presentation planned as create_pptx', pptxChat.task && pptxChat.task.approvalDetails.toolAction === 'create_pptx');

  const pptxExec = await (await fetch(`${BASE_URL}/api/v1/tasks/${pptxChat.task.id}/approve`, { method: 'POST' })).json();
  record('PowerPoint execution completed', pptxExec.success && pptxExec.task.status === 'COMPLETED');
  const pptxPath = path.join(WORKSPACE, 'NN_Slides.pptx');
  record('PowerPoint exists on disk with non-zero size', fs.existsSync(pptxPath) && fs.statSync(pptxPath).size > 1000);

  // 4. CSV File (.csv)
  const csvChat = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Create a CSV file containing quarterly figures named figures.csv' })
  })).json();
  record('CSV dataset planned as create_csv', csvChat.task && csvChat.task.approvalDetails.toolAction === 'create_csv');

  const csvExec = await (await fetch(`${BASE_URL}/api/v1/tasks/${csvChat.task.id}/approve`, { method: 'POST' })).json();
  record('CSV execution completed', csvExec.success && csvExec.task.status === 'COMPLETED');
  const csvPath = path.join(WORKSPACE, 'figures.csv');
  record('CSV exists on disk with non-zero size', fs.existsSync(csvPath) && fs.statSync(csvPath).size > 20);

  // 5. JSON File (.json)
  const jsonChat = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Create a JSON document with system config named config.json' })
  })).json();
  record('JSON document planned as create_json', jsonChat.task && jsonChat.task.approvalDetails.toolAction === 'create_json');

  const jsonExec = await (await fetch(`${BASE_URL}/api/v1/tasks/${jsonChat.task.id}/approve`, { method: 'POST' })).json();
  record('JSON execution completed', jsonExec.success && jsonExec.task.status === 'COMPLETED');
  const jsonPath = path.join(WORKSPACE, 'config.json');
  record('JSON exists on disk with valid parseable content', fs.existsSync(jsonPath) && JSON.parse(fs.readFileSync(jsonPath, 'utf8')).system === 'FORGE AI');

  // 6. Read PDF Text
  const readPdfChat = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Read this PDF named ML_Report.pdf and extract its content' })
  })).json();
  record('Read PDF planned as read_pdf', readPdfChat.task && readPdfChat.task.approvalDetails.toolAction === 'read_pdf');

  const readPdfExec = await (await fetch(`${BASE_URL}/api/v1/tasks/${readPdfChat.task.id}/approve`, { method: 'POST' })).json();
  record('Read PDF execution returned extracted text', readPdfExec.success && readPdfExec.execution.output.content.includes('machine learning'));

  // -------------------------------------------------------------
  // SUITE 4: Desktop Application Control
  // -------------------------------------------------------------
  console.log('\n[Suite 4] Desktop Application Control & Window Management');

  // 1. Launch approved application (Notepad)
  const launchChat = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Open Notepad' })
  })).json();
  record('Open Notepad planned as launch_application', launchChat.task && launchChat.task.approvalDetails.toolAction === 'launch_application');

  const launchExec = await (await fetch(`${BASE_URL}/api/v1/tasks/${launchChat.task.id}/approve`, { method: 'POST' })).json();
  record('Notepad launched with real process ID and window info', launchExec.success && launchExec.execution.output.pid > 0);

  // 2. Open generated document in app
  const openDocChat = await (await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Open the generated Word document AI_Guide.docx after saving it' })
  })).json();
  record('Open document planned as open_document_in_app', openDocChat.task && openDocChat.task.approvalDetails.toolAction === 'open_document_in_app');

  // 3. Security rejection of unapproved binary
  const badAppResRaw = await fetch('http://127.0.0.1:8000/tools/execute', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-FORGE-TOKEN': 'forge_secret_token_2026'
    },
    body: JSON.stringify({
      taskId: 'test-bad-app',
      tool: 'desktop_control',
      action: 'launch_application',
      params: { appName: 'cmd.exe' }
    })
  });
  const badAppRes = await badAppResRaw.json();
  record('Unapproved executable launch strictly blocked', badAppResRaw.status === 403 || (badAppRes.success === false && /Access Denied|forbidden/i.test(badAppRes.error || badAppRes.detail)));

  // -------------------------------------------------------------
  // SUITE 5: Conversation Persistence & Isolation
  // -------------------------------------------------------------
  console.log('\n[Suite 5] Conversation Persistence & Message Isolation');

  const convA = `conv-isolated-a-${Date.now()}`;
  const convB = `conv-isolated-b-${Date.now()}`;

  // Send message in A
  await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Secret token in conversation A: ALPHA_77', conversationId: convA })
  });

  // Send message in B
  await fetch(`${BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: 'Secret token in conversation B: BRAVO_99', conversationId: convB })
  });

  // Retrieve messages for A
  const msgsA = await (await fetch(`${BASE_URL}/api/v1/chat/messages?conversationId=${convA}`)).json();
  const textA = msgsA.messages.map(m => m.text).join(' ');
  record('Conversation A contains ALPHA_77', textA.includes('ALPHA_77'));
  record('Conversation A does NOT contain BRAVO_99', !textA.includes('BRAVO_99'));

  // Retrieve messages for B
  const msgsB = await (await fetch(`${BASE_URL}/api/v1/chat/messages?conversationId=${convB}`)).json();
  const textB = msgsB.messages.map(m => m.text).join(' ');
  record('Conversation B contains BRAVO_99', textB.includes('BRAVO_99'));
  record('Conversation B does NOT contain ALPHA_77', !textB.includes('ALPHA_77'));

  // Verify conversations list endpoint
  const convList = await (await fetch(`${BASE_URL}/api/v1/conversations`)).json();
  const ids = convList.conversations.map(c => c.id);
  record('Conversation list in SQLite contains convA and convB', ids.includes(convA) && ids.includes(convB));

  console.log('\n======================================================================');
  console.log(`  ALL ${passed} / ${total} MASTER FEATURE CHECKS PASSED (100% SUCCESS)`);
  console.log('======================================================================\n');
}

run().catch(err => {
  console.error('\nFAILED TEST SUITE:', err);
  process.exit(1);
});

