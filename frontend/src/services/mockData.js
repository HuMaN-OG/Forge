/**
 * FORGE AI - Standalone Mock Data Layer
 * 
 * NOTE FOR TEAM / BHUVAN:
 * All records below are realistic simulated data for development, UI preview,
 * and testing without requiring the Express backend or Ollama server running.
 * The frontend service layer automatically routes to these mocks when
 * VITE_USE_MOCK=true or when the live API base URL is unreachable.
 */

export const MOCK_SYSTEM_STATUS = {
  isOnline: true,
  connectionMode: 'auto', // 'auto', 'offline', 'online'
  backend: {
    status: 'connected_mock', // 'connected', 'connected_mock', 'disconnected'
    baseUrl: 'http://localhost:5000',
    version: '0.9.2-dev',
    latencyMs: 14,
    database: 'SQLite (Simulated)'
  },
  aiProvider: {
    active: 'ollama',
    model: 'llama3:8b',
    isOfflineCapable: true,
    localStatus: 'ready', // 'ready', 'downloading', 'not_found'
    loadedVramMb: 4820,
    contextWindow: 8192
  },
  automationTools: {
    engine: 'Python + Playwright (Simulated)',
    status: 'available',
    registeredTools: [
      { name: 'excel_writer', type: 'offline', description: 'Create and format .xlsx spreadsheets locally' },
      { name: 'file_system', type: 'offline', description: 'Organize, copy, and inspect permitted local folders' },
      { name: 'document_parser', type: 'offline', description: 'Extract text and tabular data from local PDFs/DOCXs' },
      { name: 'browser_runner', type: 'online_only', description: 'Automate web actions via Playwright (Requires Internet)' }
    ]
  }
};

export const MOCK_SUGGESTIONS = [
  {
    id: 'sug-1',
    title: 'Generate Sales KPI Spreadsheet',
    description: 'Create a formatted Excel report with formulas, styling, and charts for Q3 regional revenue.',
    type: 'offline',
    category: 'Productivity',
    prompt: 'Generate an Excel spreadsheet named "Q3_Sales_Performance.xlsx" with regional revenue columns, formulas for profit margin, and top performing sales reps.'
  },
  {
    id: 'sug-2',
    title: 'Organize Downloads Directory',
    description: 'Inspect permitted directory, group files by file extension, and prepare cleanup audit report.',
    type: 'offline',
    category: 'File Management',
    prompt: 'Scan the designated downloads folder, categorize files by type (Images, Documents, Archives), and create a summary markdown report before moving anything.'
  },
  {
    id: 'sug-3',
    title: 'Extract Invoices from PDFs',
    description: 'Read local PDF invoices, pull vendor name, total amount, and due date into a structured table.',
    type: 'offline',
    category: 'Data Extraction',
    prompt: 'Process all invoices inside the ./invoices directory, extract total balances, tax IDs, and output a structured CSV ledger.'
  },
  {
    id: 'sug-4',
    title: 'Conduct Competitive Web Research',
    description: 'Search current online documentation for AI agent benchmarks and summarize comparison points.',
    type: 'online_only',
    category: 'Research (Online)',
    prompt: 'Search the web for 2026 computer-use benchmarks comparing local LLMs and compile a feature comparison matrix.'
  }
];

export const MOCK_TASK_HISTORY = [
  {
    id: 'task-101',
    title: 'Generate Financial Audit Spreadsheet (Q3)',
    prompt: 'Create an Excel workbook named "Q3_Financial_Summary.xlsx" with categorized operating expenses and profit margins.',
    status: 'completed',
    type: 'offline',
    provider: 'Ollama (llama3:8b)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 3600000 * 2 + 42000).toISOString(),
    durationSeconds: 42,
    planSummary: '3-step workflow: Prepare dataset, format Excel with openpyxl, verify calculations and save file.',
    steps: [
      { id: 's1', stage: 'UNDERSTAND', status: 'completed', message: 'Analyzed request: Offline Excel generation requested. Identified schema: Expenses, Revenue, Net Margin.' },
      { id: 's2', stage: 'PLAN', status: 'completed', message: 'Drafted 3 execution steps using local Python excel_writer tool.' },
      { id: 's3', stage: 'APPROVE', status: 'completed', message: 'User approved file creation at permitted workspace path: ./generated/Q3_Financial_Summary.xlsx.' },
      { id: 's4', stage: 'EXECUTE', status: 'completed', message: 'Executed Python automation script. Generated 4 worksheets with dynamic formulas and corporate blue theme.' },
      { id: 's5', stage: 'VERIFY', status: 'completed', message: 'Verified checksum and workbook validity. 18 rows, 6 formula columns evaluated with 0 errors.' },
      { id: 's6', stage: 'STORE', status: 'completed', message: 'Saved task execution metadata and verification hashes to SQLite.' },
      { id: 's7', stage: 'LEARN', status: 'completed', message: 'Stored Excel formatting pattern for future reuse with tag "financial-spreadsheet".' }
    ],
    artifacts: [
      { name: 'Q3_Financial_Summary.xlsx', size: 45200, type: 'excel', path: './generated/Q3_Financial_Summary.xlsx' }
    ],
    verificationDetails: {
      status: 'passed',
      metrics: 'File exists (45.2 KB), 4 sheets populated, formula calculations verified 100% valid.',
      verifier: 'ExcelValidatorService'
    }
  },
  {
    id: 'task-102',
    title: 'Organize Staging Archive & Cleanup',
    prompt: 'Group 42 unorganized image and doc files into structured subfolders by month and extension.',
    status: 'completed',
    type: 'offline',
    provider: 'Ollama (llama3:8b)',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    completedAt: new Date(Date.now() - 86400000 + 19000).toISOString(),
    durationSeconds: 19,
    planSummary: 'Inventory files, request approval for move operations, perform file routing, verify no data loss.',
    steps: [
      { id: 's1', stage: 'UNDERSTAND', status: 'completed', message: 'Analyzed directory tree. Target: ./staging folder containing 42 loose files.' },
      { id: 's2', stage: 'PLAN', status: 'completed', message: 'Generated directory mapping: Images -> ./staging/images, Docs -> ./staging/documents.' },
      { id: 's3', stage: 'APPROVE', status: 'completed', message: 'User authorized file move operations for 42 files.' },
      { id: 's4', stage: 'EXECUTE', status: 'completed', message: 'Python file_system tool relocated 42 files. Zero hash collisions.' },
      { id: 's5', stage: 'VERIFY', status: 'completed', message: 'Post-execution audit confirmed all 42 files in target folders with identical MD5 checksums.' },
      { id: 's6', stage: 'STORE', status: 'completed', message: 'Logged operations into SQLite task history.' },
      { id: 's7', stage: 'LEARN', status: 'completed', message: 'Indexed directory cleanup pattern.' }
    ],
    artifacts: [
      { name: 'Cleanup_Manifest.json', size: 8400, type: 'json', path: './generated/Cleanup_Manifest.json' }
    ],
    verificationDetails: {
      status: 'passed',
      metrics: '42/42 files safely organized. 0 missing files. MD5 integrity verified.',
      verifier: 'FileSystemValidator'
    }
  },
  {
    id: 'task-103',
    title: 'Live Web Scraping for Tech News',
    prompt: 'Scrape top 5 articles on local AI models from HackerNews.',
    status: 'failed',
    type: 'online_only',
    provider: 'Groq Cloud LPU',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    completedAt: new Date(Date.now() - 86400000 * 2 + 5000).toISOString(),
    durationSeconds: 5,
    planSummary: 'Initialize Playwright browser session, navigate to URL, extract headlines.',
    steps: [
      { id: 's1', stage: 'UNDERSTAND', status: 'completed', message: 'Identified online web extraction task.' },
      { id: 's2', stage: 'PLAN', status: 'completed', message: 'Generated browser automation plan.' },
      { id: 's3', stage: 'APPROVE', status: 'completed', message: 'User approved navigation to target domain.' },
      { id: 's4', stage: 'EXECUTE', status: 'failed', message: 'Network connection refused. Offline mode was enforced in workspace settings.' },
      { id: 's5', stage: 'VERIFY', status: 'failed', message: 'Execution halted due to network constraint policy.' },
      { id: 's6', stage: 'STORE', status: 'completed', message: 'Logged failed run with code ERR_OFFLINE_POLICY_ENFORCED.' }
    ],
    artifacts: [],
    verificationDetails: {
      status: 'failed',
      metrics: 'Network unreachable or offline constraint policy prevented outbound sockets.',
      verifier: 'NetworkPolicyGate'
    }
  }
];

export const MOCK_MEMORY_RECORDS = [
  {
    id: 'mem-01',
    patternName: 'Financial Workbook Generator Pattern',
    category: 'Excel Automation',
    triggerPhrases: ['create excel', 'financial summary', 'sales spreadsheet', 'generate kpi table'],
    useCount: 14,
    successRate: '98.5%',
    createdDate: '2026-10-12',
    lastUsed: '2 hours ago',
    description: 'Deterministic structure for financial spreadsheets: Header styling, numeric alignment, auto-column width, formula injections (SUM, AVERAGE, MARGIN).',
    parameters: ['Sheet Names', 'Column Headers', 'Formula Rules', 'Styling Scheme'],
    storedWorkflows: [
      'Initialize openpyxl workbook with Roboto font',
      'Apply primary brand header fill (#0EA5E9)',
      'Inject formulas in capital format (=SUM(C2:C15))',
      'Validate cell references and calculate bounding dimensions'
    ],
    feedback: 'Highly rated by user for accurate formula syntax and no truncated columns.'
  },
  {
    id: 'mem-02',
    patternName: 'Safe Batch File Categorization',
    category: 'File System Operations',
    triggerPhrases: ['organize downloads', 'sort files by type', 'clean folder', 'archive directory'],
    useCount: 8,
    successRate: '100%',
    createdDate: '2026-10-18',
    lastUsed: 'Yesterday',
    description: 'Pre-flight safety workflow: Never overwrite existing files. Check target collisions, generate dry-run manifest, obtain approval, then perform copy-verify-delete.',
    parameters: ['Source Directory', 'Destination Root', 'Date Mask', 'Collision Policy'],
    storedWorkflows: [
      'Scan directory recursively ignoring hidden .git and temp files',
      'Calculate SHA-256 hash before and after movement',
      'Prompt user with interactive diff before disk mutation',
      'Generate post-run json receipt'
    ],
    feedback: 'User noted safety against accidental file overwrites.'
  },
  {
    id: 'mem-03',
    patternName: 'PDF Invoice Key-Value Extractor',
    category: 'Document Parsing',
    triggerPhrases: ['extract invoice', 'read receipt pdf', 'parse statement'],
    useCount: 5,
    successRate: '92.0%',
    createdDate: '2026-10-24',
    lastUsed: '3 days ago',
    description: 'Extracts standard tax invoice entities (Invoice #, Date, Subtotal, Tax, Grand Total, Due Date) using regex patterns and local OCR if text layer is missing.',
    parameters: ['Currency Symbol', 'Date Format', 'Fuzzy Threshold'],
    storedWorkflows: [
      'Detect PDF text layer vs scanned bitmap',
      'Extract bounding box tables',
      'Normalize dates to ISO-8601'
    ],
    feedback: 'Works offline with PyPDF without sending invoice data to cloud.'
  }
];

export const MOCK_GENERATED_FILES = [
  {
    id: 'file-01',
    name: 'Q3_Financial_Summary.xlsx',
    extension: 'xlsx',
    type: 'Spreadsheet',
    sizeBytes: 45200,
    taskId: 'task-101',
    taskTitle: 'Generate Financial Audit Spreadsheet (Q3)',
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    isAvailableLocally: true,
    path: 'C:\\Users\\vansh\\Documents\\Forge\\frontend\\public\\samples\\Q3_Financial_Summary.xlsx',
    description: 'Categorized financial workbook containing revenue, gross margin, and overhead computations with dynamic formulas.'
  },
  {
    id: 'file-02',
    name: 'Cleanup_Manifest.json',
    extension: 'json',
    type: 'Data/JSON',
    sizeBytes: 8400,
    taskId: 'task-102',
    taskTitle: 'Organize Staging Archive & Cleanup',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isAvailableLocally: true,
    path: 'C:\\Users\\vansh\\Documents\\Forge\\frontend\\public\\samples\\Cleanup_Manifest.json',
    description: 'Cryptographic MD5 hash verification manifest for 42 organized staging files.'
  },
  {
    id: 'file-03',
    name: 'Executive_AI_Briefing.pdf',
    extension: 'pdf',
    type: 'Document',
    sizeBytes: 184500,
    taskId: 'task-098',
    taskTitle: 'Compile Offline AI Capabilities Executive Brief',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    isAvailableLocally: true,
    path: 'C:\\Users\\vansh\\Documents\\Forge\\frontend\\public\\samples\\Executive_AI_Briefing.pdf',
    description: 'Structured briefing report detailing local vs cloud model security and compliance.'
  }
];
