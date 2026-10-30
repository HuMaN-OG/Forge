const { z } = require('zod');

// Permitted registered tool names
const REGISTERED_TOOLS = {
  EXCEL_WRITER: 'excel_writer',
  FILE_SYSTEM: 'file_system',
  DOCUMENT_PARSER: 'document_parser'
};

// Security check: strictly forbidden arbitrary execution tools
const FORBIDDEN_TOOL_KEYWORDS = [
  'terminal',
  'shell',
  'bash',
  'cmd',
  'powershell',
  'exec',
  'eval',
  'spawn',
  'subprocess',
  'os.system',
  'delete',
  'remove',
  'rm'
];

function isForbiddenTool(toolName) {
  if (!toolName) return false;
  const lower = toolName.toLowerCase();
  return FORBIDDEN_TOOL_KEYWORDS.some(kw => lower.includes(kw));
}

// Milestone-restricted allowed tool actions
// Initial milestone allows ONLY file_system.list_directory
const ALLOWED_MILESTONE_ACTIONS = {
  'file_system': ['list_directory', 'create_file']
};

const EXTENDED_REGISTERED_ACTIONS = {
  'file_system': ['list_directory', 'read_file', 'write_file', 'create_file', 'move_file', 'organize_by_extension'],
  'excel_writer': ['create_workbook', 'add_sheet', 'write_data', 'apply_formula']
};

function validateToolAndAction(tool, action) {
  if (isForbiddenTool(tool) || isForbiddenTool(action)) {
    throw new Error(`SECURITY_VIOLATION: Execution denied. Arbitrary shell, deletion, or code execution is strictly forbidden.`);
  }

  const registry = process.env.ALLOW_EXTENDED_TOOLS === 'true'
    ? EXTENDED_REGISTERED_ACTIONS
    : ALLOWED_MILESTONE_ACTIONS;

  const allowedActions = registry[tool];
  if (!allowedActions) {
    throw new Error(`Execution Denied: Tool '${tool}' is not registered or permitted in this milestone. Allowed tools: ${Object.keys(registry).join(', ')}`);
  }

  if (!action || !allowedActions.includes(action)) {
    throw new Error(`Execution Denied: Action '${action}' is not permitted for tool '${tool}'. Permitted in this milestone: ${allowedActions.join(', ')}`);
  }
}

// Excel Tool Payload Schema
const excelToolParamsSchema = z.object({
  action: z.enum(['create_workbook', 'add_sheet', 'write_data', 'apply_formula']),
  filePath: z.string(),
  sheetName: z.string().optional().default('Sheet1'),
  headers: z.array(z.string()).optional(),
  rows: z.array(z.array(z.any())).optional(),
  formulas: z.record(z.string()).optional()
});

// File System Tool Payload Schema
const fileSystemToolParamsSchema = z.object({
  action: z.enum(['list_directory', 'read_file', 'write_file', 'create_file', 'move_file', 'organize_by_extension']),
  targetDirectory: z.string(),
  targetFile: z.string().optional(),
  destinationDirectory: z.string().optional(),
  content: z.string().optional()
});

// Shared Automation Request Schema for Python FastAPI service v1.0
const toolExecutionRequestSchema = z.object({
  contractVersion: z.string().default('1.0'),
  taskId: z.string(),
  tool: z.string(),
  action: z.string().optional(),
  params: z.record(z.any()).default({}),
  workspaceId: z.string().default('default'),
  executionMode: z.string().default('approved')
});

const toolExecutionResponseSchema = z.object({
  success: z.boolean(),
  contractVersion: z.string().optional(),
  tool: z.string(),
  action: z.string().optional(),
  taskId: z.string(),
  output: z.record(z.any()).optional().nullable(),
  artifacts: z.array(z.object({
    name: z.string(),
    path: z.string(),
    type: z.string(),
    size: z.number().optional()
  })).optional(),
  error: z.string().nullable().optional()
});

module.exports = {
  REGISTERED_TOOLS,
  FORBIDDEN_TOOL_KEYWORDS,
  ALLOWED_MILESTONE_ACTIONS,
  EXTENDED_REGISTERED_ACTIONS,
  isForbiddenTool,
  validateToolAndAction,
  excelToolParamsSchema,
  fileSystemToolParamsSchema,
  toolExecutionRequestSchema,
  toolExecutionResponseSchema
};
