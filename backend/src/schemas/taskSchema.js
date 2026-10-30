const { z } = require('zod');

const taskStatusEnum = z.enum([
  'UNDERSTANDING',
  'PLANNING',
  'WAITING_APPROVAL',
  'EXECUTING',
  'VERIFYING',
  'COMPLETED',
  'REJECTED',
  'FAILED'
]);

const approvalStatusEnum = z.enum(['pending', 'approved', 'rejected']);

const stepStageEnum = z.enum([
  'UNDERSTAND',
  'PLAN',
  'APPROVE',
  'EXECUTE',
  'VERIFY',
  'STORE',
  'LEARN'
]);

const taskStepSchema = z.object({
  id: z.string(),
  stage: stepStageEnum,
  status: z.enum(['pending', 'in_progress', 'completed', 'rejected', 'failed', 'skipped']),
  message: z.string(),
  tool: z.string().optional(),
  toolParams: z.record(z.any()).optional()
});

const taskArtifactSchema = z.object({
  name: z.string(),
  size: z.number().optional().default(0),
  type: z.string(), // 'excel' | 'json' | 'csv' | 'file'
  path: z.string()
});

const approvalDetailsSchema = z.object({
  action: z.string(),
  target: z.string(),
  riskLevel: z.string(),
  explanation: z.string()
});

const verificationDetailsSchema = z.object({
  status: z.enum(['passed', 'failed', 'pending']),
  metrics: z.string(),
  verifier: z.string()
}).nullable();

const taskSchema = z.object({
  id: z.string(),
  conversationId: z.string().optional(),
  title: z.string(),
  prompt: z.string(),
  status: taskStatusEnum,
  type: z.enum(['offline', 'online_only']).default('offline'),
  provider: z.string().default('Ollama (qwen3:4b)'),
  plannedTool: z.string(),
  approvalRequired: z.boolean().default(true),
  approvalStatus: approvalStatusEnum.default('pending'),
  approvalDetails: approvalDetailsSchema.nullable().optional(),
  steps: z.array(taskStepSchema),
  artifacts: z.array(taskArtifactSchema).default([]),
  verificationDetails: verificationDetailsSchema.optional(),
  durationSeconds: z.number().default(0),
  createdAt: z.string(),
  completedAt: z.string().nullable().optional()
});

module.exports = {
  taskStatusEnum,
  approvalStatusEnum,
  stepStageEnum,
  taskStepSchema,
  taskArtifactSchema,
  approvalDetailsSchema,
  verificationDetailsSchema,
  taskSchema
};
