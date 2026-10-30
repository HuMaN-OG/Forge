const fs = require('node:fs');
const path = require('node:path');
const config = require('../config');
const {
  validateToolAndAction,
  toolExecutionResponseSchema
} = require('../schemas/toolSchema');

class AutomationService {
  constructor() {
    this.baseUrl = config.pythonAutomation.baseUrl.replace(/\/$/, '');
    this.timeoutMs = 30000;
  }

  /**
   * Reads and validates the configured automation token.
   * Fails safely if missing. Never logs or exposes the token.
   */
  getToken() {
    const token = config.pythonAutomation.token;
    if (!token || typeof token !== 'string' || token.trim() === '') {
      throw new Error('Configuration Error: FORGE_AUTOMATION_TOKEN is missing or empty in backend configuration.');
    }
    return token.trim();
  }

  /**
   * Probes the Python FastAPI automation service health
   */
  async checkHealth() {
    try {
      const res = await fetch(`${this.baseUrl}/health`, {
        signal: AbortSignal.timeout(3000)
      });
      if (!res.ok) {
        return {
          available: false,
          status: 'degraded',
          statusCode: res.status,
          error: `HTTP ${res.status}: ${res.statusText}`
        };
      }
      const data = await res.json();
      return {
        available: true,
        status: data.status || 'healthy',
        service: data.service,
        registeredTools: data.registered_tools || [],
        sandboxDirectory: data.sandbox_directory
      };
    } catch (err) {
      return {
        available: false,
        status: 'offline',
        error: `Python automation service unreachable at ${this.baseUrl} (${err.message}). Is the FastAPI service running?`
      };
    }
  }

  /**
   * Dispatches an authenticated v1.0 task operation to Python FastAPI
   */
  async executeTool({
    tool,
    action,
    taskId,
    params = {},
    workspaceId = 'default',
    executionMode = 'approved'
  }) {
    // 1. Tool and Action validation against milestone registry
    validateToolAndAction(tool, action);

    // 2. Validate token presence without exposing it
    const token = this.getToken();

    // 3. Check Python service availability
    const health = await this.checkHealth();
    if (!health.available) {
      throw new Error(`Automation Service Offline: Cannot execute task. Python service on ${this.baseUrl} is unreachable.`);
    }

    // 4. Exact v1.0 execution request contract
    const payload = {
      contractVersion: '1.0',
      taskId,
      tool,
      action,
      params,
      workspaceId,
      executionMode
    };

    // 5. Dispatch HTTP POST with X-FORGE-TOKEN header
    const endpoint = `${this.baseUrl}${config.pythonAutomation.executeEndpoint}`;
    let response;
    try {
      response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-FORGE-TOKEN': token
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(this.timeoutMs)
      });
    } catch (err) {
      if (err.name === 'TimeoutError' || err.name === 'AbortError') {
        const timeoutErr = new Error(`Automation execution timed out after ${this.timeoutMs}ms.`);
        timeoutErr.isTimeout = true;
        throw timeoutErr;
      }
      throw new Error(`Failed to dispatch tool execution to Python service: ${err.message}`);
    }

    // 6. Handle authentication errors (401/403)
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Authentication Denied (HTTP ${response.status}): Python service rejected X-FORGE-TOKEN.`);
    }

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      const msg = errBody.detail || errBody.error || `HTTP ${response.status}: ${response.statusText}`;
      throw new Error(`Python Automation Error (${response.status}): ${msg}`);
    }

    // 7. Validate response schema (do not assume HTTP 200 means operation succeeded!)
    const rawData = await response.json().catch(() => null);
    if (!rawData) {
      throw new Error('Invalid Response: Python automation service returned empty or non-JSON body.');
    }

    const parsed = toolExecutionResponseSchema.safeParse(rawData);
    if (!parsed.success) {
      throw new Error(`Invalid response schema from Python automation service: ${JSON.stringify(parsed.error.format())}`);
    }

    const result = parsed.data;
    if (result.success !== true) {
      throw new Error(result.error || 'Automation tool reported execution failure.');
    }

    // 8. Disk verification of artifacts if any
    const verifiedArtifacts = [];
    if (Array.isArray(result.artifacts)) {
      for (const art of result.artifacts) {
        if (art.path && fs.existsSync(art.path)) {
          const stats = fs.statSync(art.path);
          if (stats.size > 0) {
            verifiedArtifacts.push({
              name: art.name || path.basename(art.path),
              path: path.resolve(art.path),
              type: art.type || 'file',
              size: stats.size,
              verified: true,
              verifiedAt: new Date().toISOString()
            });
          }
        }
      }
    }

    return {
      success: true,
      contractVersion: result.contractVersion || '1.0',
      tool: result.tool,
      action: result.action || action,
      taskId: result.taskId,
      output: result.output,
      artifacts: verifiedArtifacts,
      verified: true
    };
  }
}

module.exports = new AutomationService();
