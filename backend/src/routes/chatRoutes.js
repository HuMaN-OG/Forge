const express = require('express');
const router = express.Router();
const { chatRequestSchema } = require('../schemas/chatSchema');
const chatOrchestrator = require('../services/chatOrchestrator');
const { messageRepository } = require('../db/repositories');

/**
 * POST /api/v1/chat
 * Primary entry point for chat interface and task initiation
 */
router.post('/chat', async (req, res, next) => {
  try {
    const parseResult = chatRequestSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request payload',
        details: parseResult.error.format()
      });
    }

    const { message, conversationId, provider } = parseResult.data;
    const result = await chatOrchestrator.handleChat({ message, conversationId, provider });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

function handleGetMessages(req, res, next) {
  try {
    const conversationId = req.query.conversationId || 'default-session';
    const limit = parseInt(req.query.limit || '50', 10);
    const messages = messageRepository.listByConversation(conversationId, limit);
    return res.json({ success: true, count: messages.length, messages });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/messages and GET /api/v1/chat/messages
 * Fetches message history for a conversation
 */
router.get('/messages', handleGetMessages);
router.get('/chat/messages', handleGetMessages);

module.exports = router;
