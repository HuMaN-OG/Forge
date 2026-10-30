const intentClassifier = require('./intentClassifier');
const taskPlanner = require('./taskPlanner');
const ollamaService = require('./ollamaService');
const { messageRepository } = require('../db/repositories');

class ChatOrchestrator {
  /**
   * Main entry point for POST /api/v1/chat
   */
  async handleChat({ message, conversationId = 'default-session', provider = 'Ollama (qwen3:4b)' }) {
    const startTime = Date.now();

    // 1. Persist user message to SQLite
    messageRepository.create({
      conversationId,
      sender: 'user',
      text: message
    });

    // 2. Strict Security Policy Gate upfront: Intercept arbitrary terminal / shell execution attempts immediately
    if (taskPlanner.detectTerminalExecutionAttempt(message)) {
      const securityAlert = 'Security Gate Notice: Arbitrary terminal or shell command execution is strictly disallowed by FORGE AI policy. Only pre-registered, sandboxed tools are executed with explicit operator confirmation.';

      messageRepository.create({
        conversationId,
        sender: 'system',
        text: securityAlert,
        intent: 'TASK',
        metadata: { securityViolation: true }
      });

      return {
        success: false,
        intent: 'TASK',
        confidence: 1.0,
        reply: securityAlert,
        task: null,
        status: 'security_blocked',
        clarificationQuestion: null,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
    }

    try {
      // 3. Classify intent (CHAT, TASK, AMBIGUOUS)
      const classification = await intentClassifier.classify(message);
      const { intent, confidence, reasoning, requiresClarification, clarificationQuestion } = classification;

      let replyText = '';
      let task = null;
      let status = 'completed';

      // 4. Handle based on intent
      if (intent === 'CHAT') {
        replyText = await this.generateChatResponse(message);
        status = 'completed';
      } else if (intent === 'AMBIGUOUS') {
        replyText = clarificationQuestion ||
          "I'd like to help with that, but I need a few more details. Could you please specify which files or directory you want to work on, and what specific action to perform?";
        status = 'requires_clarification';
      } else if (intent === 'TASK') {
        // Plan the task
        task = await taskPlanner.planTask(message, { conversationId, provider });
        replyText = `I have formulated a structured execution plan for your request: **${task.title}**.\n\n` +
          `Proposed tool: \`${task.plannedTool}\`\n` +
          `Impact: ${task.approvalDetails?.target || 'Restricted workspace'}\n\n` +
          `This action requires your approval before proceeding. Please review the authorization card below.`;
        status = 'waiting_approval';
      }

      // 5. Persist assistant reply to SQLite
      const assistantMsg = messageRepository.create({
        conversationId,
        sender: 'assistant',
        text: replyText,
        intent,
        metadata: {
          taskId: task ? task.id : null,
          confidence,
          status
        }
      });

      const executionTimeMs = Date.now() - startTime;

      return {
        success: true,
        intent,
        confidence,
        reasoning,
        reply: replyText,
        task,
        status,
        clarificationQuestion: clarificationQuestion || null,
        messageId: assistantMsg.id,
        metadata: {
          model: provider,
          executionTimeMs,
          timestamp: new Date().toISOString()
        }
      };
    } catch (err) {
      console.error('[ChatOrchestrator] Error processing message:', err);

      const isSecurityError = err.message && err.message.includes('SECURITY_VIOLATION');
      const errorReply = isSecurityError
        ? 'Security Gate Alert: Arbitrary terminal or shell command execution is prohibited. FORGE AI only executes pre-registered, sandboxed tools.'
        : `An error occurred while processing your request: ${err.message}`;

      messageRepository.create({
        conversationId,
        sender: 'system',
        text: errorReply,
        intent: 'AMBIGUOUS',
        metadata: { error: true, securityViolation: isSecurityError }
      });

      return {
        success: false,
        intent: 'AMBIGUOUS',
        confidence: 1.0,
        reply: errorReply,
        task: null,
        status: isSecurityError ? 'security_blocked' : 'error',
        clarificationQuestion: null,
        error: err.message,
        metadata: {
          executionTimeMs: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Generates a conversational response for CHAT intent
   */
  async generateChatResponse(userPrompt) {
    const chatPrompt = `You are FORGE AI, a helpful, precise autonomous computer-use assistant running locally on the user's workstation.
Answer the user's question or greeting concisely and politely. Explain what you can do (organizing files, generating Excel workbooks, parsing documents, and automating routine local tasks under explicit human supervision) if relevant. Keep response under 100 words.`;

    try {
      const response = await ollamaService.chat({
        messages: [
          { role: 'system', content: chatPrompt },
          { role: 'user', content: userPrompt }
        ],
        format: '', // freeform text
        temperature: 0.3
      });

      if (response && response.content) {
        return response.content.trim();
      }
    } catch (err) {
      console.warn('[ChatOrchestrator] Ollama chat generation failed, using canned reply:', err.message);
    }

    return "Hello! I am FORGE AI, your local computer-use assistant. I can help organize files, create structured Excel spreadsheets, and execute verified workflows with your explicit authorization.";
  }
}

module.exports = new ChatOrchestrator();
