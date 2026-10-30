const { z } = require('zod');

const chatRequestSchema = z.object({
  message: z.string().trim().min(1, 'Message cannot be empty'),
  conversationId: z.string().optional().default('default-session'),
  provider: z.string().optional().default('Ollama (qwen3:4b)')
});

const intentTypeSchema = z.enum(['CHAT', 'TASK', 'AMBIGUOUS']);

const intentResultSchema = z.object({
  intent: intentTypeSchema,
  confidence: z.number().min(0).max(1),
  reasoning: z.string().optional(),
  requiresClarification: z.boolean().default(false),
  clarificationQuestion: z.string().nullable().optional()
});

module.exports = {
  chatRequestSchema,
  intentTypeSchema,
  intentResultSchema
};
