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
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }

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
 * Fast rule-based classifier for instant sub-millisecond dispatch
 */
function fallbackRuleClassifier(prompt) {
  const p = prompt.trim().toLowerCase();

  // Ambiguous patterns: vague action verbs with demonstrative pronouns or missing targets
  const ambiguousPatterns = [
    /^(can you\s+)?(fix|clean|do|sort|handle|process|run)\s+(it|this|them|the files?|things?)\??$/i,
    /^(please\s+)?(fix|organize|do)\s+my\s+files?\??$/i,
    /^(read|open|modify|check)\s+(the\s+)?(file|document)\??$/i,
    /^(open|modify)\s+something\??$/i
  ];
  for (const pattern of ambiguousPatterns) {
    if (pattern.test(p)) {
      return {
        intent: 'AMBIGUOUS',
        confidence: 0.95,
        reasoning: 'Request indicates an action but lacks specific targets, paths, or execution parameters.',
        requiresClarification: true,
        clarificationQuestion: 'Could you please specify which files or directory you would like me to work on, and what specific action to take?'
      };
    }
  }

  // Concrete task patterns: creation of excel, file reading/writing, desktop control
  const taskPatterns = [
    /\b(read|view|inspect|display|show|cat)\b.*\b(file|document|contents?|\.[a-zA-Z0-9]+)\b/i,
    /\b(create|generate|make|build|export)\b.*\b(excel|spreadsheet|xlsx|csv|workbook|report|table)\b/i,
    /\b(create|write|make|generate)\b.*\b(file|note|document|log)\b/i,
    /\b(organize|sort|move|categorize)\b.*\b(folder|directory|downloads|documents|files)\b/i,
    /\b(list)\b.*\b(files|dir|directory|workspace|windows)\b/i,
    /\b(open|launch)\b.*\b(notepad|explorer)\b/i,
    /\b(extract|parse)\b.*\b(pdf|invoice|receipt|data)\b/i
  ];
  for (const pattern of taskPatterns) {
    if (pattern.test(p)) {
      return {
        intent: 'TASK',
        confidence: 0.95,
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
   * Classifies a prompt using fast heuristics first, falling back to local Ollama Qwen3 4B
   */
  async classify(prompt) {
    // 1. Fast dispatch: concrete tasks and ambiguous requests resolve in <1ms
    const fastRule = fallbackRuleClassifier(prompt);
    if (fastRule.intent === 'TASK' || fastRule.intent === 'AMBIGUOUS') {
      intentLogRepository.create({ prompt, ...fastRule });
      return fastRule;
    }

    // 2. Conversational messages query Ollama with safe fallback
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

      intentLogRepository.create({ prompt, ...fastRule });
      return fastRule;
    } catch (err) {
      intentLogRepository.create({ prompt, ...fastRule });
      return fastRule;
    }
  }
}

module.exports = new IntentClassifier();
