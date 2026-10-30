const { REGISTERED_TOOLS } = require('../schemas/toolSchema');
const { taskRepository } = require('../db/repositories');

class TaskPlanner {
  /**
   * Plans an execution graph for a validated TASK intent
   */
  async planTask(prompt, { conversationId = 'default-session', provider = 'Ollama (qwen3:4b)' } = {}) {
    // 1. Enforce strict security policy: Do not allow arbitrary terminal commands
    if (this.detectTerminalExecutionAttempt(prompt)) {
      throw new Error('SECURITY_VIOLATION: Arbitrary terminal / shell command execution is strictly disallowed by FORGE AI policy.');
    }

    const taskId = `task-${Date.now().toString().slice(-6)}`;
    const isOnline = /search|scrape|web|online|download|cloud/i.test(prompt);

    // 2. Identify target registered tool & parameters
    let title = 'Automated File Operation';
    let plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
    let toolAction = 'list_directory';
    let toolParams = { action: 'list_directory', targetDirectory: '.' };
    let impactDescription = 'Scan workspace directory and list items safely.';
    let riskLevel = isOnline ? 'Medium (External Network Access)' : 'Low (Restricted Local Directory Sandbox)';

    // Analyze specific intent
    if (/notepad|write.*report|desktop|active\s+window|launch\s+(?:application|app)|press\s+key/i.test(prompt)) {
      title = 'Desktop Automation: Notepad Report';
      plannedTool = REGISTERED_TOOLS.DESKTOP_CONTROL;
      riskLevel = 'Medium (Local Desktop UI Automation)';

      if (/list.*windows/i.test(prompt)) {
        title = 'List Desktop Windows';
        toolAction = 'list_windows';
        toolParams = { action: 'list_windows', filterVisible: true };
        impactDescription = 'Enumerate active top-level desktop windows.';
      } else if (/active\s+window/i.test(prompt)) {
        title = 'Get Active Desktop Window';
        toolAction = 'get_active_window';
        toolParams = { action: 'get_active_window' };
        impactDescription = 'Query active foreground window and metadata.';
      } else if (/launch\s+(?:application|app)|open\s+explorer/i.test(prompt) && !/notepad/i.test(prompt)) {
        title = 'Launch Desktop Application';
        toolAction = 'launch_application';
        const appName = /explorer/i.test(prompt) ? 'file_explorer' : 'notepad';
        toolParams = { action: 'launch_application', appName };
        impactDescription = `Launch approved application '${appName}' safely.`;
      } else {
        // Default / Primary demonstration scenario: Notepad report
        title = 'Desktop Automation: Notepad Report';
        toolAction = 'notepad_report';

        // Extract filename if specified (e.g. AI_Report.txt)
        const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.txt)/i) ||
                          prompt.match(/(?:named|name|as|save\s+it\s+as)\s+["']?([a-zA-Z0-9_\-]+(?:\.txt)?)["']?/i);
        let filename = fileMatch ? fileMatch[1] : 'AI_Report.txt';
        if (!filename.toLowerCase().endsWith('.txt')) filename += '.txt';

        // Extract topic if specified
        let topic = 'Artificial Intelligence';
        const topicMatch = prompt.match(/report\s+(?:about|on)\s+([^,.]+)/i);
        if (topicMatch) {
          topic = topicMatch[1].trim();
        }

        toolParams = {
          action: 'notepad_report',
          filename,
          topic,
          closeAfter: false
        };
        impactDescription = `Launch approved Notepad, enter report on '${topic}', save '${filename}' to canonical workspace sandbox, and verify on disk.`;
      }

    } else if (/excel|spreadsheet|xlsx|sheet/i.test(prompt)) {
      title = 'Create Structured Excel Workbook';
      plannedTool = REGISTERED_TOOLS.EXCEL_WRITER;
      toolAction = 'create_workbook';

      // 1. Extract requested filename
      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.xlsx)/i) ||
                        prompt.match(/(?:named|name|file)\s+["']?([a-zA-Z0-9_\-]+(?:\.xlsx)?)["']?/i);
      let filename = fileMatch ? fileMatch[1] : 'workbook.xlsx';
      if (!filename.toLowerCase().endsWith('.xlsx')) filename += '.xlsx';

      // 2. Extract worksheet name, if specified
      const sheetMatch = prompt.match(/(?:sheet|worksheet|tab)\s*(?:named|name)?\s*[:"']?\s*([a-zA-Z0-9_\-]+)/i);
      const sheetName = sheetMatch ? sheetMatch[1] : 'Sheet1';

      // 3. Extract column headers from prompt
      let headers = [];
      const colMatch = prompt.match(/(?:columns?|headers?)\s*(?:named|are|:)?\s*([^.]+?)(?:\.|\s+containing|\s+with rows|\s+do not|\s+without|$)/i);
      if (colMatch) {
        headers = colMatch[1]
          .split(/,\s*(?:and\s+)?|\s+and\s+/i)
          .map(h => h.replace(/["']/g, '').trim())
          .filter(h => h && !/^(?:and|do\s+not.*|with.*)$/i.test(h));
      }

      // 4. Extract explicit rows and values, if provided (NEVER invent rows!)
      let rows = [];
      const noRowsExplicit = /do\s+not\s+invent|no\s+rows|empty\s+rows|without\s+rows/i.test(prompt);

      if (!noRowsExplicit) {
        const rowMatch = prompt.match(/(?:containing|with\s+(?:data|rows?))\s*[:"']?\s*([^.]+?)(?:\.|$)/i);
        if (rowMatch) {
          const rawRowData = rowMatch[1];
          const segments = rawRowData
            .split(/,\s*(?:and\s+)?|\s+and\s+/i)
            .map(s => s.trim())
            .filter(s => s);

          for (const seg of segments) {
            const parts = seg.split(/[:\s]+/).map(p => {
              const num = Number(p);
              return (!isNaN(num) && p.trim() !== '') ? num : p;
            });
            if (parts.length >= 2) {
              rows.push(parts);
            }
          }
        }
      }

      // 5. Extract formulas if requested
      const formulas = {};

      toolParams = {
        action: 'create_workbook',
        filePath: filename,
        sheetName,
        headers,
        rows,
        formulas,
        overwrite: true
      };
      impactDescription = `Create Excel workbook '${filename}' with ${headers.length} headers and ${rows.length} data rows inside workspace sandbox.`;

    } else if (/organize|sort|categorize/i.test(prompt) && /file|folder|dir|extension/i.test(prompt)) {
      title = 'Organize Workspace Files by Extension';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'organize_by_extension';
      toolParams = {
        action: 'organize_by_extension',
        targetDirectory: '.',
        preview: false
      };
      impactDescription = 'Safely scan workspace directory and organize loose files into categorized subfolders with collision avoidance.';

    } else if (/create|write|make|generate/i.test(prompt) && /file|text|note|document|log/i.test(prompt)) {
      title = 'Create Workspace File';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'create_file';

      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/i);
      const targetFile = fileMatch ? fileMatch[1] : 'note.txt';

      let content = `FORGE AI Generated Document\nCreated: ${new Date().toISOString()}\nSource Task Prompt: ${prompt}\n`;
      const contentMatch = prompt.match(/content[:\s]+["']?([^"'\r\n]+)["']?/i);
      if (contentMatch) {
        content = contentMatch[1].trim();
      }

      toolParams = {
        action: 'create_file',
        targetFile,
        content,
        overwrite: false
      };
      impactDescription = `Create file '${targetFile}' inside workspace sandbox without overwriting existing files.`;

    } else if (/read|view|inspect|show/i.test(prompt) && /file|document|content/i.test(prompt)) {
      title = 'Read Workspace File';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'read_file';

      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/i);
      const targetFile = fileMatch ? fileMatch[1] : 'note.txt';

      toolParams = {
        action: 'read_file',
        targetFile
      };
      impactDescription = `Safely read contents of file '${targetFile}' from workspace sandbox.`;
    }

    // 3. Construct deterministic 7-stage lifecycle steps
    const steps = [
      {
        id: 's1',
        stage: 'UNDERSTAND',
        status: 'completed',
        message: 'Requirement parsed. Identified goal and security parameters.'
      },
      {
        id: 's2',
        stage: 'PLAN',
        status: 'completed',
        message: `Plan formulated for registered tool: ${plannedTool} (${toolAction}).`
      },
      {
        id: 's3',
        stage: 'APPROVE',
        status: 'in_progress',
        message: 'Awaiting operator approval to proceed with execution.'
      },
      {
        id: 's4',
        stage: 'EXECUTE',
        status: 'pending',
        message: `Dispatch permitted tool action to Python automation service (port 8000).`,
        tool: plannedTool,
        toolAction,
        toolParams
      },
      {
        id: 's5',
        stage: 'VERIFY',
        status: 'pending',
        message: 'Validate output schema integrity and verify artifacts on disk.'
      },
      {
        id: 's6',
        stage: 'STORE',
        status: 'pending',
        message: 'Persist execution log and artifact metadata to SQLite.'
      },
      {
        id: 's7',
        stage: 'LEARN',
        status: 'pending',
        message: 'Index workflow experience pattern for future reuse.'
      }
    ];

    const approvalDetails = {
      action: `Execute registered tool: ${plannedTool} (${toolAction})`,
      target: impactDescription,
      riskLevel,
      toolAction,
      toolParams,
      explanation: `FORGE AI requires your explicit authorization before calling '${plannedTool}'. ${impactDescription}`
    };

    // Artifacts list is strictly EMPTY until execution actually occurs and verifies files!
    const taskData = {
      id: taskId,
      conversationId,
      title,
      prompt,
      status: 'WAITING_APPROVAL',
      type: isOnline ? 'online_only' : 'offline',
      provider,
      plannedTool,
      approvalRequired: true,
      approvalStatus: 'pending',
      approvalDetails,
      steps,
      artifacts: [],
      verificationDetails: null,
      durationSeconds: 0,
      createdAt: new Date().toISOString()
    };

    return taskRepository.create(taskData);
  }

  /**
   * Checks if user prompt attempts to execute raw terminal/shell commands
   */
  detectTerminalExecutionAttempt(prompt) {
    const rawLower = prompt.toLowerCase();
    const disallowedCommandPatterns = [
      /\b(run|execute|bash|sh|cmd|powershell|terminal)\s+(command|script|shell|terminal)\b/i,
      /\b(rm\s+-rf|del\s+\/f|chmod|chown|kill|pkill)\b/i,
      /\b(curl|wget)\s+http.*\|\s*(bash|sh)\b/i,
      /\bsudo\s+/i
    ];

    return disallowedCommandPatterns.some(pattern => pattern.test(rawLower));
  }
}

module.exports = new TaskPlanner();
