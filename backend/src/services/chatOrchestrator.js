const intentClassifier = require('./intentClassifier');
const taskPlanner = require('./taskPlanner');
const ollamaService = require('./ollamaService');
const { messageRepository, taskRepository } = require('../db/repositories');

class ChatOrchestrator {
  /**
   * Main entry point for POST /api/v1/chat
   */
  async handleChat({ message, conversationId = 'default-session', provider = 'Ollama (qwen3:4b)' }) {
    const startTime = Date.now();

    // 1. Persist user message to SQLite
    const userMsg = messageRepository.create({
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

    // 3. Retrieve conversation history for context resolution
    const priorMessages = messageRepository.listByConversation(conversationId);
    const historyWithoutCurrent = priorMessages.filter(m => m.id !== userMsg.id);

    // 4. Handle "Continue" / "Resume" intent for task continuity
    const trimmed = message.trim().toLowerCase();
    if (/^(?:continue|resume|proceed|go ahead|keep going|do it)\b/i.test(trimmed)) {
      const latestTask = taskRepository.getLatestTaskForConversation(conversationId);
      if (latestTask) {
        let replyText = '';
        let status = 'waiting_approval';

        if (latestTask.status === 'WAITING_APPROVAL') {
          replyText = `Resuming pending task: **${latestTask.title}**.\n\n` +
            `Proposed tool: \`${latestTask.plannedTool}\`\n` +
            `Impact: ${latestTask.approvalDetails?.target || 'Workspace sandbox'}\n\n` +
            `Awaiting your confirmation to execute. Please review the authorization card below.`;
          status = 'waiting_approval';
        } else if (latestTask.status === 'COMPLETED') {
          replyText = `The previous task **${latestTask.title}** has already been completed with verified artifacts: ${latestTask.artifacts.map(a => a.name).join(', ') || 'verified on disk'}. What would you like to automate next?`;
          status = 'completed';
        } else {
          replyText = `Current status of task **${latestTask.title}** is **${latestTask.status}**.`;
          status = 'completed';
        }

        const assistantMsg = messageRepository.create({
          conversationId,
          sender: 'assistant',
          text: replyText,
          intent: 'TASK',
          metadata: { taskId: latestTask.id, status }
        });

        return {
          success: true,
          intent: 'TASK',
          confidence: 1.0,
          reply: replyText,
          task: latestTask,
          status,
          messageId: assistantMsg.id,
          metadata: {
            model: provider,
            executionTimeMs: Date.now() - startTime,
            timestamp: new Date().toISOString()
          }
        };
      }
    }

    // 5. Context Enrichment: Resolve follow-up parameters
    let effectivePrompt = message;
    const lastAssistantMsg = [...historyWithoutCurrent].reverse().find(m => m.sender === 'assistant');
    const lastUserMsg = [...historyWithoutCurrent].reverse().find(m => m.sender === 'user');

    if (lastAssistantMsg && lastUserMsg) {
      const isShortAnswer = message.split(/\s+/).length <= 8;
      const wasClarification = lastAssistantMsg.metadata?.status === 'requires_clarification' ||
                               lastAssistantMsg.text.includes('?') ||
                               /what.*(?:include|contain|about|do)/i.test(lastAssistantMsg.text);
      const isRefinement = /more\s+detailed|detailed|longer|shorter|add|modify|change/i.test(message);

      if ((wasClarification && isShortAnswer) || isRefinement) {
        effectivePrompt = `${lastUserMsg.text}. Specification: ${message}`;
      }
    }

    try {
      // 6. Classify intent (CHAT, TASK, AMBIGUOUS)
      const classification = await intentClassifier.classify(effectivePrompt);
      const { intent, confidence, reasoning, requiresClarification, clarificationQuestion } = classification;

      let replyText = '';
      let task = null;
      let status = 'completed';

      // 7. Handle based on intent
      if (intent === 'CHAT') {
        replyText = await this.generateChatResponse(message, conversationId, priorMessages);
        status = 'completed';
      } else if (intent === 'AMBIGUOUS') {
        replyText = clarificationQuestion ||
          "I'd like to help with that, but I need a few more details. Could you please specify what specific action or target to work on?";
        status = 'requires_clarification';
      } else if (intent === 'TASK') {
        // Plan the task using enriched effectivePrompt
        task = await taskPlanner.planTask(effectivePrompt, { conversationId, provider });
        replyText = `I have formulated a structured execution plan for your request: **${task.title}**.\n\n` +
          `Proposed tool: \`${task.plannedTool}\`\n` +
          `Impact: ${task.approvalDetails?.target || 'Restricted workspace'}\n\n` +
          `This action requires your approval before proceeding. Please review the authorization card below.`;
        status = 'waiting_approval';
      }

      // 8. Persist assistant reply to SQLite
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
   * Generates a conversational response with full multi-turn context
   */
  async generateChatResponse(userPrompt, conversationId = 'default-session', priorMessages = []) {
    // 1. Detect user name from history
    let knownUserName = null;
    for (const m of priorMessages) {
      const nameMatch = m.text.match(/(?:my name is|call me|i am)\s+([A-Za-z]+)/i);
      if (nameMatch && !/^(?:a|an|the|ready|fine|here|trying)$/i.test(nameMatch[1])) {
        knownUserName = nameMatch[1];
      }
    }
    // Check if assistant previously asked "What should I call you?" and user replied with their name
    for (let i = 0; i < priorMessages.length - 1; i++) {
      if (/what should i call you/i.test(priorMessages[i].text) && priorMessages[i + 1].sender === 'user') {
        const clean = priorMessages[i + 1].text.replace(/[.!,]/g, '').trim();
        if (clean && clean.split(/\s+/).length <= 2 && !/^(?:hello|hi|hey)$/i.test(clean)) {
          knownUserName = clean;
        }
      }
    }

    // Direct deterministic rule for "What is my name?"
    if (/what(?:'s|\s+is)\s+my\s+name\??/i.test(userPrompt.trim())) {
      if (knownUserName) {
        return `Your name is ${knownUserName}.`;
      } else {
        return "I don't have your name yet. What should I call you?";
      }
    }

    // Direct deterministic rule for user stating their name (e.g. "Bhuvan." or "My name is Bhuvan.")
    const stateNameMatch = userPrompt.match(/^(?:my name is\s+|i am\s+|call me\s+)?([A-Z][a-zA-Z]+)[.!]?$/);
    const lastMsgWasAskName = priorMessages.length >= 2 &&
      /what should i call you/i.test(priorMessages[priorMessages.length - 2].text);
    if (stateNameMatch && (lastMsgWasAskName || /(?:my name is|call me)/i.test(userPrompt))) {
      const name = stateNameMatch[1];
      return `Your name is ${name}.`;
    }

    // 2. Multi-turn prompt construction for Ollama
    const chatPrompt = `You are FORGE AI, a helpful, precise autonomous computer-use assistant running locally on the user's workstation.
Do not output thinking process or <think> tags. Answer directly and concisely in English (under 60 words).
You have direct conversational context with the user.
Remember information the user tells you in this conversation (such as their name or preferences) and answer follow-up questions accurately.
${knownUserName ? `[Context: User's name is ${knownUserName}]` : ''}`;

    const recentHistory = priorMessages
      .slice(-8)
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'assistant',
        content: m.text
      }));

    try {
      const response = await ollamaService.chat({
        messages: [
          { role: 'system', content: chatPrompt },
          ...recentHistory
        ],
        format: '', // freeform text
        temperature: 0.2,
        numPredict: 300
      });

      if (response && response.content) {
        return response.content.trim();
      }
    } catch (err) {
      console.warn('[ChatOrchestrator] Ollama chat generation failed, using canned reply:', err.message);
    }

    return "Hello! I am FORGE AI, your local computer-use assistant. I can help organize files, create structured documents, and execute verified workflows with your explicit authorization.";
  }
}

module.exports = new ChatOrchestrator();
