const config = require('../config');

class OllamaService {
  constructor() {
    this.baseUrl = config.ollama.baseUrl.replace(/\/$/, '');
    this.model = config.ollama.model;
    this.timeoutMs = config.ollama.timeoutMs;
  }

  /**
   * Checks whether Ollama is online and if the desired model is loaded
   */
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });
      if (!res.ok) {
        return { status: 'degraded', available: false, error: `HTTP ${res.status}` };
      }
      const data = await res.json();
      const models = data.models || [];
      const hasTargetModel = models.some(m => m.name.toLowerCase().startsWith(this.model.toLowerCase()));
      return {
        status: hasTargetModel ? 'healthy' : 'model_missing',
        available: true,
        targetModel: this.model,
        hasTargetModel,
        availableModels: models.map(m => m.name)
      };
    } catch (err) {
      return {
        status: 'offline',
        available: false,
        error: err.message
      };
    }
  }

  /**
   * Sends a structured chat request to Ollama
   */
  async chat({ messages, format = 'json', temperature = 0.1, stream = false, numPredict = 200 }) {
    const url = `${this.baseUrl}/api/chat`;
    const body = {
      model: this.model,
      messages,
      format,
      stream,
      options: {
        temperature,
        top_p: 0.9,
        num_predict: numPredict
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Ollama Error HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return {
      content: data.message?.content || '',
      thinking: data.message?.thinking || data.thinking || '',
      totalDuration: data.total_duration,
      evalCount: data.eval_count
    };
  }

  /**
   * Direct text generation completion
   */
  async generate({ prompt, system, format = 'json', temperature = 0.1 }) {
    const url = `${this.baseUrl}/api/generate`;
    const body = {
      model: this.model,
      prompt,
      system,
      format,
      stream: false,
      options: {
        temperature
      }
    };

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.timeoutMs)
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => '');
      throw new Error(`Ollama Error HTTP ${res.status}: ${errText}`);
    }

    const data = await res.json();
    return {
      response: data.response || '',
      thinking: data.thinking || '',
      totalDuration: data.total_duration
    };
  }
}

module.exports = new OllamaService();
