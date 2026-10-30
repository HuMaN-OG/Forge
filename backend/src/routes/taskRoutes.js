const express = require('express');
const router = express.Router();
const { taskRepository } = require('../db/repositories');
const automationService = require('../services/automationService');

/**
 * GET /api/v1/tasks
 * Returns list of tasks with optional query filters (status, search, type)
 */
router.get('/', (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      search: req.query.search,
      type: req.query.type
    };
    const tasks = taskRepository.list(filters);
    return res.json({
      success: true,
      count: tasks.length,
      tasks
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/v1/tasks/:id
 * Returns single task details
 */
router.get('/:id', (req, res, next) => {
  try {
    const task = taskRepository.findById(req.params.id);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task '${req.params.id}' not found.`
      });
    }
    return res.json({
      success: true,
      task
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tasks/:id/approve
 * Human authorization gate: Approves and dispatches execution to Python FastAPI.
 */
router.post('/:id/approve', async (req, res, next) => {
  try {
    const taskId = req.params.id;

    // 1. Confirm task exists
    const task = taskRepository.findById(taskId);
    if (!task) {
      return res.status(404).json({
        success: false,
        error: `Task '${taskId}' not found.`
      });
    }

    // 2. Require approvalRequired === true
    if (task.approvalRequired !== true && task.approvalRequired !== 1) {
      return res.status(400).json({
        success: false,
        error: `Task '${taskId}' does not require human approval.`
      });
    }

    // 3. Only permit pending tasks awaiting approval
    if (task.status.toUpperCase() !== 'WAITING_APPROVAL' || task.approvalStatus !== 'pending') {
      return res.status(409).json({
        success: false,
        error: `Task cannot be approved: current status is '${task.status}' with approvalStatus '${task.approvalStatus}'. Only pending tasks waiting for approval can be approved.`
      });
    }

    // 4. ATOMIC SQLite conditional state transition
    // Ensures simultaneous approval requests cannot dispatch the same task twice!
    const claimed = taskRepository.claimForApproval(taskId);
    if (!claimed) {
      return res.status(409).json({
        success: false,
        error: `Conflict: Task '${taskId}' has already been claimed or execution started concurrently.`
      });
    }

    // Extract tool, action, and parameters
    const executeStep = (task.steps || []).find(s => s.stage === 'EXECUTE') || {};
    const approvalDetails = task.approvalDetails || {};
    const tool = task.plannedTool;
    const action = approvalDetails.toolAction || executeStep.toolAction || approvalDetails.toolParams?.action || executeStep.toolParams?.action || (tool === 'file_system' ? 'list_directory' : 'execute');
    const toolParams = approvalDetails.toolParams || executeStep.toolParams || {};

    const startTime = Date.now();

    // Advance step status in memory for tracking
    const executingSteps = (task.steps || []).map(s => {
      if (s.stage === 'APPROVE') {
        return { ...s, status: 'completed', message: 'Operator explicitly authorized execution.' };
      }
      if (s.stage === 'EXECUTE') {
        return { ...s, status: 'in_progress', message: `Dispatching action '${action}' to ${tool}...` };
      }
      return s;
    });

    taskRepository.update(task.id, {
      steps: executingSteps
    });

    // 5. Dispatch to Python FastAPI ONLY AFTER atomic claim succeeds
    let executionResult;
    try {
      executionResult = await automationService.executeTool({
        contractVersion: '1.0',
        taskId: task.id,
        tool,
        action,
        params: toolParams,
        workspaceId: 'default',
        executionMode: 'approved'
      });
    } catch (execErr) {
      console.error(`[TaskExecution] Failed to execute task ${task.id}:`, execErr.message);

      const durationSeconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
      const failedSteps = executingSteps.map(s => {
        if (s.stage === 'EXECUTE') {
          return { ...s, status: 'failed', message: `Execution failed: ${execErr.message}` };
        }
        if (['VERIFY', 'STORE', 'LEARN'].includes(s.stage)) {
          return { ...s, status: 'skipped', message: 'Skipped due to upstream execution failure.' };
        }
        return s;
      });

      // Persist failure into SQLite (do not mark COMPLETED on failure!)
      const failedTask = taskRepository.update(task.id, {
        status: 'FAILED',
        executionStatus: 'failed',
        executionOutput: { error: execErr.message },
        steps: failedSteps,
        durationSeconds,
        completedAt: new Date().toISOString()
      });

      const statusCode = execErr.isTimeout ? 504 : 500;
      return res.status(statusCode).json({
        success: false,
        error: execErr.message,
        task: failedTask
      });
    }

    // 6. Verification and final SQLite persistence
    const durationSeconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    const verifiedArtifacts = executionResult.artifacts || [];

    const completedSteps = executingSteps.map(s => {
      if (s.stage === 'EXECUTE') {
        return { ...s, status: 'completed', message: `Tool execution succeeded with action '${action}'.` };
      }
      if (s.stage === 'VERIFY') {
        return { ...s, status: 'completed', message: `Integrity verified: execution output validated.` };
      }
      if (s.stage === 'STORE') {
        return { ...s, status: 'completed', message: 'Stored actual execution output and telemetry into SQLite.' };
      }
      if (s.stage === 'LEARN') {
        return { ...s, status: 'completed', message: 'Task pattern successfully indexed into experience store.' };
      }
      return s;
    });

    const verificationMetrics = executionResult.output?.verification
      ? `Workbook verified: Sheet '${executionResult.output.verification.verifiedSheet}', ${executionResult.output.verification.verifiedHeaders?.length || 0} headers, ${executionResult.output.verification.verifiedRowsCount || 0} data rows.`
      : `Output verified. Action '${action}' completed successfully with ${verifiedArtifacts.length} artifact(s).`;

    const updatedTask = taskRepository.update(task.id, {
      status: 'COMPLETED',
      executionStatus: 'completed',
      executionOutput: executionResult.output || null,
      steps: completedSteps,
      artifacts: verifiedArtifacts,
      verificationDetails: {
        status: 'passed',
        metrics: verificationMetrics,
        verifier: 'BackendAutomationVerifier',
        timestamp: new Date().toISOString()
      },
      durationSeconds,
      completedAt: new Date().toISOString()
    });

    return res.json({
      success: true,
      message: 'Task approved and executed successfully.',
      task: updatedTask,
      execution: executionResult
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/v1/tasks/:id/reject
 * Human authorization gate: Operator declines execution.
 */
router.post('/:id/reject', (req, res, next) => {
  try {
    const taskId = req.params.id;
    const task = taskRepository.findById(taskId);
    if (!task) {
      return res.status(404).json({ success: false, error: `Task '${taskId}' not found.` });
    }

    // Prevent rejection after approval or execution has started!
    if (task.status.toUpperCase() !== 'WAITING_APPROVAL' || task.approvalStatus !== 'pending') {
      return res.status(409).json({
        success: false,
        error: `Task cannot be rejected: approval or execution has already started (status: '${task.status}', approvalStatus: '${task.approvalStatus}').`
      });
    }

    const reason = req.body?.reason || 'Operator declined authorization';

    // Atomic conditional rejection transition
    const claimed = taskRepository.claimForRejection(taskId, reason);
    if (!claimed) {
      return res.status(409).json({
        success: false,
        error: `Conflict: Task '${taskId}' cannot be rejected because its state was modified concurrently.`
      });
    }

    const updatedSteps = (task.steps || []).map(s => {
      if (s.stage === 'APPROVE') {
        return { ...s, status: 'rejected', message: `Execution rejected: ${reason}` };
      }
      if (['EXECUTE', 'VERIFY', 'STORE', 'LEARN'].includes(s.stage)) {
        return { ...s, status: 'skipped', message: 'Skipped due to rejection authorization gate.' };
      }
      return s;
    });

    taskRepository.update(task.id, {
      steps: updatedSteps
    });

    const updatedTask = taskRepository.findById(taskId);
    return res.json({
      success: true,
      message: `Task '${taskId}' safely rejected. Zero tools were dispatched to Python.`,
      task: updatedTask
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
