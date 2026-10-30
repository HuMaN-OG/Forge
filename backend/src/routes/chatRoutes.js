const express = require('express');
const router = express.Router();
const { chatRequestSchema } = require('../schemas/chatSchema');
const chatOrchestrator = require('../services/chatOrchestrator');
const { messageRepository, conversationRepository } = require('../db/repositories');

/**
 * GET /api/v1/conversations
 * Lists all persistent conversations stored in SQLite
 */
router.get('/conversations', (req, res, next) => {
  try {
    const list = conversationRepository.list();
    return res.json({ success: true, count: list.length, conversations: list });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/conversations
 * Creates a new conversation
 */
router.post('/conversations', (req, res, next) => {
  try {
    const title = req.body?.title || 'New Conversation';
    const conv = conversationRepository.create({ title });
    return res.status(201).json({ success: true, conversation: conv });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/conversations/:id
 * Retrieves details and message history for a specific conversation
 */
router.get('/conversations/:id', (req, res, next) => {
  try {
    const conv = conversationRepository.findById(req.params.id);
    if (!conv) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }
    const messages = messageRepository.listByConversation(req.params.id);
    return res.json({ success: true, conversation: conv, messages });
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/v1/conversations/:id
 * Deletes a conversation and its messages
 */
router.delete('/conversations/:id', (req, res, next) => {
  try {
    conversationRepository.delete(req.params.id);
    return res.json({ success: true, message: 'Conversation deleted' });
  } catch (err) {
    next(err);
  }
});

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

    const { message, conversationId = 'default-session', provider } = parseResult.data;
    
    // Ensure conversation exists in SQLite
    conversationRepository.getOrCreate(conversationId, message.slice(0, 30));
    conversationRepository.touch(conversationId);

    const result = await chatOrchestrator.handleChat({ message, conversationId, provider });

    return res.status(200).json(result);
  } catch (err) {
    next(err);
  }
});

function handleGetMessages(req, res, next) {
  try {
    const conversationId = req.query.conversationId || 'default-session';
    const limit = parseInt(req.query.limit || '100', 10);
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
