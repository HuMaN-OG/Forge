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







    // PRIORITY 1: Read / View / Inspect / Display existing file



    if (/\b(read|view|inspect|display|cat)\b|show\s+contents?/i.test(prompt) &&



        (/\b(file|document|contents?)\b/i.test(prompt) || /\.[a-zA-Z0-9]+/i.test(prompt)) &&



        !/\b(create|make|generate|build|write|new)\b/i.test(prompt) && !/\b(pdf|docx)\b/i.test(prompt)) {



      title = 'Read Workspace File';



      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;



      toolAction = 'read_file';







      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/i);



      const targetFile = fileMatch ? fileMatch[1] : 'AI_Report.txt';







      toolParams = {



        action: 'read_file',



        targetFile



      };



      impactDescription = `Safely read contents of file '${targetFile}' from workspace sandbox and display in chat.`;







    // PRIORITY 2: List Workspace Files / Directory



    } else if (/\b(list|browse)\b|show\s+files|what.*files/i.test(prompt) &&



               /\b(files|dir|directory|workspace|folder)\b/i.test(prompt) &&



               !/windows/i.test(prompt) &&



               !/\b(create|make|generate|build|write|new)\b/i.test(prompt)) {



      title = 'List Workspace Files';



      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;



      toolAction = 'list_directory';



      toolParams = {



        action: 'list_directory',



        targetDirectory: '.'



      };



      impactDescription = 'Scan workspace directory and list items safely.';







    // PRIORITY 3: Desktop UI Automation & Application Launching
    } else if (/open\s+(?:the\s+)?(?:generated\s+)?[^.]*?(?:([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)|(?:word|docx|excel|sheet|pdf|pptx|powerpoint|document|file))/i.test(prompt) &&
               !/notepad|open\s+(?:approved\s+)?(?:application\s+|app\s+)/i.test(prompt)) {
      const match = prompt.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/i);
      let filename = match ? match[1] : 'document.docx';
      if (!match) {
        if (/word|docx/i.test(prompt)) filename = 'AI_Guide.docx';
        else if (/excel|xlsx|sheet|expense/i.test(prompt)) filename = 'expenses.xlsx';
        else if (/pdf/i.test(prompt)) filename = 'ML_Report.pdf';
        else if (/powerpoint|pptx|slide/i.test(prompt)) filename = 'NN_Slides.pptx';
      }
      title = `Open Document (${filename})`;
      plannedTool = REGISTERED_TOOLS.DESKTOP_CONTROL;
      toolAction = 'open_document_in_app';
      toolParams = {
        action: 'open_document_in_app',
        filename
      };
      impactDescription = `Open verified document '${filename}' inside its approved desktop application.`;







    } else if (/notepad|open\s+(?:approved\s+)?(?:application\s+|app\s+)?(?:word|winword|excel|powerpoint|ppt|chrome|edge|vscode|code|calc|calculator|explorer)|list.*windows|active\s+window|launch\s+(?:application|app)|press\s+key/i.test(prompt)) {



      title = 'Desktop Automation';



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



      } else if (/launch|open/i.test(prompt) && !/report|type|write/i.test(prompt)) {



        title = 'Launch Desktop Application';



        toolAction = 'launch_application';



        const appMatch = prompt.match(/\b(notepad|word|winword|excel|powerpoint|ppt|chrome|edge|vscode|code|calc|calculator|explorer|file\s+explorer)\b/i);



        let appName = appMatch ? appMatch[1].toLowerCase().replace('file ', 'file_') : 'notepad';



        if (appName === 'code') appName = 'vscode';



        if (appName === 'ppt') appName = 'powerpoint';



        if (appName === 'calculator') appName = 'calc';



        toolParams = { action: 'launch_application', appName };



        impactDescription = `Launch approved application '${appName}' safely in foreground.`;



      } else {



        // Primary demonstration scenario: Notepad report



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







    // PRIORITY 4: Excel Spreadsheet Automation



    } else if (/\b(excel|spreadsheet|xlsx)\b|\bsheet\b/i.test(prompt)) {



      title = 'Create Structured Excel Workbook';



      plannedTool = REGISTERED_TOOLS.EXCEL_WRITER;



      toolAction = 'create_workbook';







      // 1. Extract requested filename



      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.xlsx)/i) ||



                        prompt.match(/(?:named|name|file|called|as)\s+["']?([a-zA-Z0-9_\-]+(?:\.xlsx)?)["']?/i);



      let filename = fileMatch ? fileMatch[1] : 'workbook.xlsx';



      if (!filename.toLowerCase().endsWith('.xlsx')) filename += '.xlsx';







      // 2. Extract worksheet name, if specified (exclude English prepositions)



      const sheetMatch = prompt.match(/\b(?:sheet|worksheet|tab)\s*(?:named|name)?\s*[:"']?\s*([a-zA-Z0-9_\-]+)/i);



      let sheetName = 'Sheet1';



      if (sheetMatch && !/^(?:for|with|in|to|named|name)$/i.test(sheetMatch[1])) {



        sheetName = sheetMatch[1];



      }







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







    // PRIORITY 4B: Word Document Generation (.docx)



    } else if (/\b(word|docx)\b/i.test(prompt) && /\b(create|generate|write|make|build)\b/i.test(prompt)) {



      title = 'Create Word Document';



      plannedTool = REGISTERED_TOOLS.DOCUMENT_GENERATOR;



      toolAction = 'create_docx';







      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.docx)/i) ||



                        prompt.match(/(?:named|name|called|as)\s+["']?([a-zA-Z0-9_\-]+(?:\.docx)?)["']?/i);



      let filename = fileMatch ? fileMatch[1] : 'Document.docx';



      if (!filename.toLowerCase().endsWith('.docx')) filename += '.docx';







      let topic = 'Artificial Intelligence';



      const topicMatch = prompt.match(/(?:about|explaining|on|regarding)\s+([^,.]+)/i);



      if (topicMatch) topic = topicMatch[1].trim();







      toolParams = {



        action: 'create_docx',



        filename,



        title: `Report: ${topic}`,



        content: `Comprehensive overview regarding ${topic}. This document was autonomously structured and verified by FORGE AI.`,



        sections: [



          { title: '1. Executive Overview', content: `Detailed analysis of ${topic} and its practical applications.` },



          { title: '2. Key Principles', content: 'Security isolation, local-first execution, and human approval verification.' }



        ],



        overwrite: true



      };



      impactDescription = `Create Word document '${filename}' about '${topic}' inside workspace sandbox.`;







    // PRIORITY 4C: PDF Document Generation (.pdf)



    } else if (/\b(pdf)\b/i.test(prompt) && /\b(create|generate|convert|make|export)\b/i.test(prompt)) {



      title = 'Generate PDF Document';



      plannedTool = REGISTERED_TOOLS.DOCUMENT_GENERATOR;



      toolAction = 'create_pdf';







      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.pdf)/i) ||



                        prompt.match(/(?:named|name|called|as)\s+["']?([a-zA-Z0-9_\-]+(?:\.pdf)?)["']?/i);



      let filename = fileMatch ? fileMatch[1] : 'Document.pdf';



      if (!filename.toLowerCase().endsWith('.pdf')) filename += '.pdf';







      let topic = 'Autonomous Systems';



      const topicMatch = prompt.match(/(?:about|explaining|on|regarding|into a pdf|into pdf)\s*([^,.]+)?/i);



      if (topicMatch && topicMatch[1]) topic = topicMatch[1].trim();







      toolParams = {



        action: 'create_pdf',



        filename,



        title: `Report: ${topic}`,



        content: `Structured documentation regarding ${topic}. Formatted and verified by FORGE AI.`,



        sections: [



          { title: '1. Introduction', content: 'Deterministic local-first AI workflows under human supervision.' },



          { title: '2. Verification Status', content: 'Confirmed existence, formatting, and disk integrity.' }



        ],



        overwrite: true



      };



      impactDescription = `Generate styled PDF '${filename}' inside workspace sandbox.`;







    // PRIORITY 4D: PowerPoint Presentation (.pptx)



    } else if (/\b(powerpoint|pptx|presentation|slides)\b/i.test(prompt) && /\b(create|generate|make|build)\b/i.test(prompt)) {



      title = 'Create PowerPoint Presentation';



      plannedTool = REGISTERED_TOOLS.DOCUMENT_GENERATOR;



      toolAction = 'create_pptx';







      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.pptx)/i) ||



                        prompt.match(/(?:named|name|called|as)\s+["']?([a-zA-Z0-9_\-]+(?:\.pptx)?)["']?/i);



      let filename = fileMatch ? fileMatch[1] : 'Presentation.pptx';



      if (!filename.toLowerCase().endsWith('.pptx')) filename += '.pptx';







      let topic = 'Machine Learning';



      const topicMatch = prompt.match(/(?:about|on|regarding)\s+([^,.]+)/i);



      if (topicMatch) topic = topicMatch[1].trim();







      toolParams = {



        action: 'create_pptx',



        filename,



        title: topic,



        subtitle: 'Created with FORGE AI Local Automation',



        slides: [



          { title: 'Architecture Overview', bullets: ['Local Ollama Runtime', 'FastAPI Execution Engine', 'Sandboxed Security'] },



          { title: 'Key Benefits', bullets: ['Offline Privacy', 'Human Authorization Gate', 'Deterministic Verification'] }



        ],



        overwrite: true



      };



      impactDescription = `Create PowerPoint presentation '${filename}' about '${topic}' inside workspace sandbox.`;







    // PRIORITY 4E: CSV Generation (.csv)



    } else if (/\b(csv)\b/i.test(prompt) && /\b(create|generate|make|export|build)\b/i.test(prompt)) {



      title = 'Create CSV Dataset';



      plannedTool = REGISTERED_TOOLS.DOCUMENT_GENERATOR;



      toolAction = 'create_csv';







      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.csv)/i) ||



                        prompt.match(/(?:named|name|called|as)\s+["']?([a-zA-Z0-9_\-]+(?:\.csv)?)["']?/i);



      let filename = fileMatch ? fileMatch[1] : 'records.csv';



      if (!filename.toLowerCase().endsWith('.csv')) filename += '.csv';







      toolParams = {



        action: 'create_csv',



        filename,



        headers: ['ID', 'Item', 'Category', 'Value'],



        rows: [



          [1, 'Compute Server', 'Hardware', 1200],



          [2, 'Local SSD Storage', 'Storage', 350],



          [3, 'Memory Expansion', 'Hardware', 400]



        ],



        overwrite: true



      };



      impactDescription = `Create CSV file '${filename}' with structured tabular records inside workspace sandbox.`;







    // PRIORITY 4F: JSON Generation (.json)



    } else if (/\b(json)\b/i.test(prompt) && /\b(create|generate|make|export|build)\b/i.test(prompt)) {



      title = 'Create JSON Document';



      plannedTool = REGISTERED_TOOLS.DOCUMENT_GENERATOR;



      toolAction = 'create_json';







      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.json)/i) ||



                        prompt.match(/(?:named|name|called|as)\s+["']?([a-zA-Z0-9_\-]+(?:\.json)?)["']?/i);



      let filename = fileMatch ? fileMatch[1] : 'data.json';



      if (!filename.toLowerCase().endsWith('.json')) filename += '.json';







      toolParams = {



        action: 'create_json',



        filename,



        data: {



          system: 'FORGE AI',



          status: 'verified',



          generatedAt: new Date().toISOString(),



          parameters: { airgap: true, model: 'qwen3:4b' }



        },



        overwrite: true



      };



      impactDescription = `Create formatted JSON document '${filename}' inside workspace sandbox.`;







    // PRIORITY 4G: PDF Reading & Summarization



    } else if (/\b(read|summarize|extract|parse)\b/i.test(prompt) && /\b(pdf)\b/i.test(prompt)) {



      title = 'Read & Parse PDF';



      plannedTool = REGISTERED_TOOLS.DOCUMENT_PARSER;



      toolAction = 'read_pdf';







      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.pdf)/i);



      const filename = fileMatch ? fileMatch[1] : 'AI_Overview.pdf';







      toolParams = {



        action: 'read_pdf',



        filename



      };



      impactDescription = `Read and extract textual content from PDF '${filename}' in workspace sandbox.`;

    // PRIORITY 4H: Word Document (DOCX) Reading & Text Extraction
    } else if (/\b(read|summarize|extract|parse)\b/i.test(prompt) && /\b(docx|word)\b/i.test(prompt)) {
      title = 'Read & Parse Word Document';
      plannedTool = REGISTERED_TOOLS.DOCUMENT_PARSER;
      toolAction = 'read_docx';
      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.docx)/i);
      const filename = fileMatch ? fileMatch[1] : 'document.docx';
      toolParams = {
        action: 'read_docx',
        filename
      };
      impactDescription = `Read and extract textual content from Word document '${filename}' in workspace sandbox.`;








    // PRIORITY 5: Organize Files by Extension



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







    // PRIORITY 6: Create Text/Markdown File



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



