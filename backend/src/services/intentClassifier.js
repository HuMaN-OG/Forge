const ollamaService = require('./ollamaService');
const { intentResultSchema } = require('../schemas/chatSchema');
const { intentLogRepository } = require('../db/repositories');

const CLASSIFIER_SYSTEM_PROMPT = `You are the FORGE AI Intent Classification Engine.
Analyze the user request and categorize it into EXACTLY ONE of these categories:

1. "CHAT": Conversational messages, greetings, pleasantries, general questions, explanations, coding advice, or queries that do not ask FORGE to execute local file or system modifications on the machine.
2. "TASK": Concrete, actionable requests to perform operations on the local machine (such as creating, formatting or editing Excel workbooks, reading or organizing directories and files, parsing documents, or generating data reports).
3. "AMBIGUOUS": Requests that clearly imply an action or operation on the local computer, but lack essential details (such as which files, what path/directory, what data, or what specific operation to perform), meaning an autonomous plan cannot be formed without clarification.

Respond ONLY with a valid JSON object matching this schema:
{
  "intent": "CHAT" | "TASK" | "AMBIGUOUS",
  "confidence": number between 0.0 and 1.0,
  "reasoning": "concise 1-sentence explanation",
  "requiresClarification": boolean,
  "clarificationQuestion": "helpful question to ask user if AMBIGUOUS, else null"
}`;

/**
 * Robust JSON extractor from model output (handles raw json, markdown fences, etc.)
 */
function extractJson(rawText) {
  if (!rawText) return null;
  let cleaned = rawText.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

  // Find first { and last }
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    return null;
  }
}

/**
 * Rule-based fallback classifier in case Ollama is offline or times out
 */
function fallbackRuleClassifier(prompt) {
  const p = prompt.trim().toLowerCase();

  // Ambiguous patterns: vague action verbs with demonstrative pronouns or missing targets
  const ambiguousPatterns = [
    /^(can you\s+)?(fix|clean|do|sort|handle|process|run)\s+(it|this|them|the files?|things?)\??$/i,
    /^(please\s+)?(fix|organize|do)\s+my\s+files?\??$/i,
    /^(open|modify)\s+something\??$/i
  ];
  for (const pattern of ambiguousPatterns) {
    if (pattern.test(p)) {
      return {
        intent: 'AMBIGUOUS',
        confidence: 0.85,
        reasoning: 'Request indicates an action but lacks specific targets, paths, or execution parameters.',
        requiresClarification: true,
        clarificationQuestion: 'Could you please specify which files or directory you would like me to work on, and what specific action to take?'
      };
    }
  }

  // Concrete task patterns: creation of excel, file manipulation, etc.
  const taskPatterns = [
    /\b(create|generate|make|build|export)\b.*\b(excel|spreadsheet|xlsx|csv|workbook|report|table)\b/i,
    /\b(organize|sort|move|categorize)\b.*\b(folder|directory|downloads|documents|files)\b/i,
    /\b(extract|parse)\b.*\b(pdf|invoice|receipt|data)\b/i
  ];
  for (const pattern of taskPatterns) {
    if (pattern.test(p)) {
      return {
        intent: 'TASK',
        confidence: 0.9,
        reasoning: 'Concrete local computer operation request detected.',
        requiresClarification: false,
        clarificationQuestion: null
      };
    }
  }

  // Otherwise default to CHAT
  return {
    intent: 'CHAT',
    confidence: 0.85,
    reasoning: 'General conversational or informational inquiry.',
    requiresClarification: false,
    clarificationQuestion: null
  };
}

class IntentClassifier {
  /**
   * Classifies a prompt using local Ollama Qwen3 4B, with automatic fallback
   */
  async classify(prompt) {
    try {
      const chatResponse = await ollamaService.chat({
        messages: [
          { role: 'system', content: CLASSIFIER_SYSTEM_PROMPT },
          { role: 'user', content: prompt }
        ],
        format: 'json',
        temperature: 0.1
      });

      const parsed = extractJson(chatResponse.content);
      if (parsed) {
        const validated = intentResultSchema.safeParse(parsed);
        if (validated.success) {
          // Persist intent audit log
          intentLogRepository.create({
            prompt,
            intent: validated.data.intent,
            confidence: validated.data.confidence,
            reasoning: validated.data.reasoning,
            requiresClarification: validated.data.requiresClarification,
            clarificationQuestion: validated.data.clarificationQuestion
          });
          return validated.data;
        }
      }

      console.warn('[IntentClassifier] Model output failed schema validation. Falling back to rule heuristics:', chatResponse.content);
      const fallback = fallbackRuleClassifier(prompt);
      intentLogRepository.create({ prompt, ...fallback });
      return fallback;
    } catch (err) {
      console.warn('[IntentClassifier] Ollama inference failed, using fallback heuristic:', err.message);
      const fallback = fallbackRuleClassifier(prompt);
      intentLogRepository.create({ prompt, ...fallback });
      return fallback;
    }
  }
}

module.exports = new IntentClassifier();
