import React, { useRef, useEffect } from 'react';
import { useTasks } from '../context/TaskContext';
import { SystemStatusBar } from '../components/dashboard/SystemStatusBar';
import { SuggestedTasks } from '../components/chat/SuggestedTasks';
import { ChatMessage } from '../components/chat/ChatMessage';
import { TaskProgressTimeline } from '../components/chat/TaskProgressTimeline';
import { PlanApprovalCard } from '../components/chat/PlanApprovalCard';
import { MessageComposer } from '../components/chat/MessageComposer';
import { TASK_STATUS } from '../utils/constants';

export function WorkspacePage() {
  const { 
    messages, 
    activeTask, 
    submitPrompt, 
    approveCurrentTask, 
    rejectCurrentTask 
  } = useTasks();
  const chatBottomRef = useRef(null);

  // Auto-scroll to latest message or active action
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTask?.status]);

  const isTaskRunning = activeTask && [
    TASK_STATUS.UNDERSTANDING,
    TASK_STATUS.PLANNING,
    TASK_STATUS.EXECUTING,
    TASK_STATUS.VERIFYING
  ].includes(activeTask.status);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-6">
      {/* Telemetry Status Bar */}
      <SystemStatusBar />

      {/* Main Conversation Stream */}
      <div className="space-y-4 min-h-[360px]">
        {/* Chat Thread Messages */}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {/* Active Task Workflow Pipeline (if active) */}
        {activeTask && (
          <div className="space-y-4">
            <TaskProgressTimeline task={activeTask} />

            {/* Approval Gate Card */}
            {activeTask.status === TASK_STATUS.WAITING_APPROVAL && (
              <PlanApprovalCard
                task={activeTask}
                onApprove={approveCurrentTask}
                onReject={rejectCurrentTask}
              />
            )}
          </div>
        )}

        <div ref={chatBottomRef} />
      </div>

      {/* Suggested Autonomous Tasks (Displayed when idle or after first prompt) */}
      {!isTaskRunning && (
        <div className="pt-2">
          <SuggestedTasks onSelectSuggestion={submitPrompt} />
        </div>
      )}

      {/* Message / Task Composer Area */}
      <div className="sticky bottom-0 pt-2 z-10">
        <MessageComposer
          onSubmit={submitPrompt}
          disabled={isTaskRunning}
        />
      </div>
    </div>
  );
}
