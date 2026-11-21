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







    const taskId = `task-${require('node:crypto').randomUUID()}`;



    const isOnline = /search|scrape|web|online|download|cloud/i.test(prompt);







    // 2. Identify target registered tool & parameters



    let title = 'Automated File Operation';



    let plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;



    let toolAction = 'list_directory';



    let toolParams = { action: 'list_directory', targetDirectory: '.' };



    let impactDescription = 'Scan workspace directory and list items safely.';



    let riskLevel = isOnline ? 'Medium (External Network Access)' : 'Low (Restricted Local Directory Sandbox)';







        // PRIORITY 0: Calculator arithmetic operation
    if (/\b(calc|calculator)\b/i.test(prompt) && (/\d+/.test(prompt) || /calculate|times|multiplied|divided|plus|add|minus|subtract|\*|\/|\+|\-/i.test(prompt))) {
      title = 'Calculator Operation';
      plannedTool = REGISTERED_TOOLS.DESKTOP_CONTROL;
      toolAction = 'calculate';
      riskLevel = 'Low (Local Desktop Calculator Automation)';

      let expr = '125 * 48';
      const calcMatch = prompt.match(/(?:calculate|compute|solve|operation|expr|expression)\s*[:=]?\s*([^.]+)/i) ||
                        prompt.match(/(\d+\s*(?:[\+\-\*\/x]|times|multiplied by|divided by|plus|minus|add)\s*\d+(?:\s*(?:[\+\-\*\/x]|times|multiplied by|divided by|plus|minus|add)\s*\d+)*)/i);
      if (calcMatch) {
        expr = calcMatch[1].trim();
      } else {
        const numMatch = prompt.match(/(\d+[\s\d\+\-\*\/x]+)/i);
        if (numMatch) expr = numMatch[1].trim();
      }

      toolParams = {
        action: 'calculate',
        expression: expr
      };
      impactDescription = `Launch Calculator, input expression '${expr}', compute and read result from UI Automation display.`;

    // PRIORITY 1: File Management Operations
    // 1A. Create Directory / Folder
    } else if (/\b(create|make|new)\b\s+(?:a\s+)?(?:new\s+)?(?:folder|directory)\b|mkdir\b/i.test(prompt)) {
      title = 'Create Workspace Folder';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'create_directory';
      const folderMatch = prompt.match(/\b(?:named|called)\s+["']?([a-zA-Z0-9_\-]+)["']?/i) ||
        prompt.match(/\b(?:folder|directory)\s+["']?([a-zA-Z0-9_\-]+)["']?/i);
      const folderName = folderMatch ? folderMatch[1] : 'FORGE_Management_Test';
      toolParams = { action: 'create_directory', targetDirectory: folderName };
      impactDescription = `Create subfolder '${folderName}' inside workspace sandbox.`;

    // 1B. Delete File (with explicit user approval)
    } else if (/\b(delete|remove)\b\s+(?:the\s+)?(?:file|folder)?\s*["']?([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)?/i.test(prompt) && !/\b(create|make)\b/i.test(prompt)) {
      title = 'Delete Workspace File';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'delete_file';
      riskLevel = 'High (Permanent File Deletion)';
      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/i);
      const targetFile = fileMatch ? fileMatch[1] : 'note.txt';
      toolParams = { action: 'delete_file', targetFile };
      impactDescription = `Delete file '${targetFile}' safely from workspace sandbox upon confirmation.`;

    // 1C. Copy File
    } else if (/\bcopy\b/i.test(prompt) && (/\bfile\b/i.test(prompt) || /\.[a-zA-Z0-9]+/i.test(prompt))) {
      title = 'Copy Workspace File';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'copy_file';
      const src = prompt.match(/(?:copy\s+)?["']?([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)["']?/i);
      const dst = prompt.match(/(?:to|into|as)\s+["']?([a-zA-Z0-9_\-\.\/]+)["']?/i);
      const sourceFile = src ? src[1] : 'Test.txt';
      const destinationFile = dst ? dst[1] : 'Test_Copy.txt';
      toolParams = { action: 'copy_file', sourceFile, destinationFile };
      impactDescription = `Copy file '${sourceFile}' to '${destinationFile}' within workspace sandbox.`;

    // 1D. Move / Rename File
    } else if (/\b(move|rename)\b/i.test(prompt) && (/\bfile\b/i.test(prompt) || /\.[a-zA-Z0-9]+/i.test(prompt))) {
      title = 'Move/Rename Workspace File';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'rename_file';
      const src = prompt.match(/(?:move|rename)\s+(?:the\s+)?(?:file\s+)?["']?([a-zA-Z0-9_\-\.\/]+)["']?/i);
      const dst = prompt.match(/(?:to|as)\s+["']?([a-zA-Z0-9_\-\.\/]+)["']?/i);
      const sourceFile = src ? src[1] : 'Test.txt';
      const destinationFile = dst ? dst[1] : 'FORGE_Notes.txt';
      toolParams = { action: 'rename_file', sourceFile, destinationFile };
      impactDescription = `Move/rename file '${sourceFile}' to '${destinationFile}' within workspace sandbox.`;

    // 1E. Search / Find Files
    } else if (/\b(search|find)\b/i.test(prompt) && /\b(files?|documents?)\b/i.test(prompt)) {
      title = 'Search Workspace Files';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'search_files';
      const queryMatch = prompt.match(/(?:for|named|pattern|extension|type)\s+["']?([*a-zA-Z0-9_\-\.]+)["']?/i);
      const query = queryMatch ? queryMatch[1] : '*';
      toolParams = { action: 'search_files', query };
      impactDescription = `Search workspace files matching pattern '${query}'.`;

    // 1F. Get File Metadata / Size
    } else if (/\b(size|info|metadata|stat)\b/i.test(prompt) && (/\bfile\b/i.test(prompt) || /\.[a-zA-Z0-9]+/i.test(prompt))) {
      title = 'Check File Metadata';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'get_file_info';
      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/i);
      const targetFile = fileMatch ? fileMatch[1] : 'Test.txt';
      toolParams = { action: 'get_file_info', targetFile };
      impactDescription = `Query file size and metadata for '${targetFile}' inside workspace sandbox.`;

    // PRIORITY 2: Edit / Append Existing File
    } else if ((/\b(append|edit|modify|update|replace)\b/i.test(prompt) || /\badd\b.*?(?:row|section|record|paragraph|slide|data|entry|line|text|student)/i.test(prompt)) &&
               (/\.[a-zA-Z0-9]+/i.test(prompt) || /\b(file|document|workbook|sheet)\b/i.test(prompt)) &&
               !/\b(create|generate|make|build|new)\s+(?:a\s+)?(?:new\s+)?(?:file|document|workbook|sheet|excel|word|pdf|presentation)/i.test(prompt)) {
      title = 'Edit Existing File';
      plannedTool = REGISTERED_TOOLS.FILE_SYSTEM;
      toolAction = 'edit_file';
      const fileMatch = prompt.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/i);
      const targetFile = fileMatch ? fileMatch[1] : 'Edit_Test.txt';

      let appendText = '';
      const contentMatch = prompt.match(/(?:text|content|row|record|data|value|section)[:\s]+["']?([^"'\r\n]+)["']?/i) ||
                           prompt.match(/(?:append|add)\s+["']?([^"'\r\n]+)["']?/i);
      if (contentMatch) appendText = contentMatch[1].trim();
      appendText = appendText.replace(/^(?:to\s+[a-zA-Z0-9_\-\.]+\s*[:\-]?\s*)/i, '').trim();

      toolParams = {
        action: 'edit_file',
        targetFile,
        appendText,
        content: appendText,
        row: appendText ? appendText.split(/,\s*/) : undefined,
        heading: appendText
      };
      impactDescription = `Edit existing file '${targetFile}' inside workspace sandbox and verify updates.`;

    // PRIORITY 2.8: Interactive Notepad Authoring (type text & save document)
    } else if (/\bnotepad\b/i.test(prompt) && (/\b(type|write|enter|put|note)\b/i.test(prompt) || /\b(save|save\s+as)\b/i.test(prompt))) {
      let text = 'FORGE Automation Note';
      const textMatch = prompt.match(/(?:type|write|enter|put|note)[:\s]+["']?([^"'\r\n]+?)(?:["']?\s+(?:and\s+)?(?:then\s+)?save|$)/i);
      if (textMatch) {
        text = textMatch[1].trim().replace(/\s+(?:in|into)\s+notepad$/i, '').trim();
      }

      let filename = 'note.txt';
      const fileMatch = prompt.match(/(?:save(?:\s+it)?\s+as|named|called|filename)\s+["']?([a-zA-Z0-9_\-]+(?:\.[a-zA-Z0-9]+)?)["']?/i);
      if (fileMatch) {
        filename = fileMatch[1].trim().replace(/\s+filename$/i, '').trim();
      } else {
        const anyFile = prompt.match(/([a-zA-Z0-9_\-]+\.txt)/i);
        if (anyFile) filename = anyFile[1].trim();
      }
      if (!filename.includes('.')) filename += '.txt';

      title = `Notepad Automation: Type & Save (${filename})`;
      plannedTool = REGISTERED_TOOLS.DESKTOP_CONTROL;
      toolAction = 'notepad_report';
      toolParams = {
        action: 'notepad_report',
        text,
        content: text,
        filename,
        topic: text
      };
      impactDescription = `Launch Notepad on desktop, type '${text}', and save document as '${filename}' inside workspace sandbox.`;

    // PRIORITY 3: Universal Desktop Application Launching (open ANY app on laptop)
    } else if (/\b(launch|open|start|run)\b/i.test(prompt) &&
               !/\b(create|make|generate|build|write|spreadsheet|workbook)\b/i.test(prompt) &&
               !/\.[a-zA-Z0-9]{2,5}\b/i.test(prompt) &&
               !/\b(folder|directory)\b/i.test(prompt) &&
               !/\b(calc|calculator)\b.*\d+/i.test(prompt)) {
      const appMatch = prompt.match(/\b(?:launch|open|start|run)\b\s+(?:approved\s+)?(?:the\s+)?(?:app(?:lication)?\s+)?([a-zA-Z0-9_\-\s]{2,35}?)(?:\s+(?:at|in)\s+.*|\s+app|\s+application)?$/i) ||
                       prompt.match(/\b(?:launch|open|start|run)\b\s+(?:approved\s+)?(?:the\s+)?(?:app(?:lication)?\s+)?([a-zA-Z0-9_\-]+)/i);
      let appName = appMatch ? appMatch[1].trim() : 'notepad';
      appName = appName.replace(/\s+(?:browser|app(?:lication)?|software|program)\s*$/i, '').trim();
      if (/^(?:google\s+)?chrome$/i.test(appName)) appName = 'chrome';
      if (/^brave$/i.test(appName)) appName = 'brave';
      if (/^(?:ms\s*|microsoft\s+)?edge$/i.test(appName)) appName = 'edge';
      if (/^(?:mozilla\s+)?firefox$/i.test(appName)) appName = 'firefox';
      if (/^file\s+explorer$/i.test(appName)) appName = 'file_explorer';
      if (/^vs\s*code$/i.test(appName)) appName = 'vscode';
      if (/^ppt$/i.test(appName)) appName = 'powerpoint';
      if (/^calc$/i.test(appName)) appName = 'calculator';

      title = `Launch Desktop Application (${appName})`;
      plannedTool = REGISTERED_TOOLS.DESKTOP_CONTROL;
      toolAction = 'launch_application';
      toolParams = {
        action: 'launch_application',
        appName,
        targetDirectory: 'C:\\Users\\HP\\Desktop\\CODE\\Forge\\workspace_sandbox'
      };
      impactDescription = `Launch application '${appName}' safely in foreground and verify its window on desktop.`;

    // PRIORITY 4: Open Verified Document in Approved Desktop Application
    } else if (/\bopen\b/i.test(prompt) && (/\.[a-zA-Z0-9]+/i.test(prompt) || /\bin\s+(notepad|word|excel|powerpoint|calc)/i.test(prompt)) &&
               !/\b(create|make|generate|build|write)\b/i.test(prompt)) {
      const match = prompt.match(/([a-zA-Z0-9_\-]+\.[a-zA-Z0-9]+)/i);
      let filename = match ? match[1] : '';
      if (!filename) {
        const nameMatch = prompt.match(/(?:file|document|named|called|as)\s+["']?([a-zA-Z0-9_\-]+(?:\.[a-zA-Z0-9]+)?)["']?/i);
        if (nameMatch) {
          filename = nameMatch[1].trim().replace(/\s+filename$/i, '').trim();
          if (!filename.includes('.')) filename += '.txt';
        } else {
          filename = 'Open_Test.txt';
        }
      }
      title = `Open Document (${filename})`;
      plannedTool = REGISTERED_TOOLS.DESKTOP_CONTROL;
      toolAction = 'open_document_in_app';
      toolParams = {
        action: 'open_document_in_app',
        filename
      };
      impactDescription = `Open verified document '${filename}' inside its approved desktop application in the foreground.`;

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







      // 5. Add a transparent SUM formula only when the request supplies numeric
      // rows, a named numeric column, and explicitly asks for a total.
      const formulas = {};
      const totalColumn = headers.findIndex(h => /^(amount|price|cost|revenue|total|value)$/i.test(String(h).trim()));
      if (/\b(?:total|sum)\b/i.test(prompt) && rows.length > 0 &&
          headers.length > 0 && totalColumn >= 0 && totalColumn < 26 &&
          rows.every(row => typeof row[totalColumn] === 'number' && Number.isFinite(row[totalColumn]))) {
        const letter = String.fromCharCode(65 + totalColumn);
        const firstRow = 2;
        const lastRow = rows.length + 1;
        formulas[`${letter}${lastRow + 1}`] = `=SUM(${letter}${firstRow}:${letter}${lastRow})`;
      }






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



    } else if (/\\b(organize|sort|categorize)\\b/i.test(prompt) && /\\b(file|folder|dir|extension)s?\\b/i.test(prompt)) {



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



    } else if (/\\b(create|write|make|generate)\\b/i.test(prompt) && /\\b(file|text|note|document|log)s?\\b/i.test(prompt)) {



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



