import React, { useRef, useEffect } from 'react';
import { 
  Activity, 
  Clock 
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { useSystem } from '../context/SystemContext';
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
    tasks,
    submitPrompt, 
    approveCurrentTask, 
    rejectCurrentTask,
    reuseTask 
  } = useTasks();
  const { selectedProvider, selectedModel, isEffectivelyOnline, automationStatus } = useSystem();
  const chatBottomRef = useRef(null);

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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Signature Command Composer Dock */}
      <div className="sticky top-0 z-30 pt-1">
        <MessageComposer
          onSubmit={submitPrompt}
          disabled={isTaskRunning}
        />
      </div>

      {/* Two-Column Balanced Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Command & Conversation Stream (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between px-1 text-xs text-[#687180] font-medium border-b border-white/[0.04] pb-2">
            <span>Activity & Output Stream</span>
            <span className="font-mono text-[10px]">{messages.length} messages logged</span>
          </div>

          <div className="space-y-3 min-h-[380px]">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Approval Gate in stream */}
            {activeTask?.status === TASK_STATUS.WAITING_APPROVAL && (
              <PlanApprovalCard
                task={activeTask}
                onApprove={approveCurrentTask}
                onReject={rejectCurrentTask}
              />
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Suggested Prompts below conversation */}
          {!isTaskRunning && (
            <div className="pt-4 border-t border-white/[0.04]">
              <SuggestedTasks onSelectSuggestion={submitPrompt} />
            </div>
          )}
        </div>

        {/* Right Column: Execution Telemetry & Environment Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Active Task Live Pipeline (if a task is in flight or recent) */}
          {activeTask ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-[#687180] font-medium px-1">
                <span>Active Operation Inspector</span>
                <span className="text-[10px] font-mono text-[#77D9E8]">Live</span>
              </div>
              <TaskProgressTimeline task={activeTask} />
            </div>
          ) : (
            /* System Environment Overview */
            <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 space-y-3.5 text-xs">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/[0.05]">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#77D9E8] stroke-[1.75]" />
                  <span className="font-semibold text-[#F1F3F5]">Autonomous Environment</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  Ready
                </span>
              </div>

              <div className="space-y-2 text-[11px]">
                <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-[#687180]">Local Inference Engine</span>
                  <span className="font-mono text-[#F1F3F5]">{selectedProvider.toUpperCase()} ({selectedModel})</span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-[#687180]">Airgap Network Boundary</span>
                  <span className={`font-mono ${isEffectivelyOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {isEffectivelyOnline ? 'Online Allowed' : 'Airgap Enforced'}
                  </span>
                </div>

                <div className="flex items-center justify-between py-1 border-b border-white/[0.03]">
                  <span className="text-[#687180]">Local Automation Tools</span>
                  <span className="text-[#F1F3F5]">{automationStatus.availableToolsCount} Registered Tools</span>
                </div>

                <div className="flex items-center justify-between py-1">
                  <span className="text-[#687180]">Authoritative Database</span>
                  <span className="font-mono text-[#929AA8]">SQLite (Backend)</span>
                </div>
              </div>

              {/* Permitted Automation Capabilities */}
              <div className="pt-2 border-t border-white/[0.05] space-y-1.5">
                <span className="text-[10px] font-semibold text-[#687180] uppercase tracking-wider block">Permitted Tool Actions</span>
                <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px] text-[#929AA8]">
                  <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">excel_writer</div>
                  <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">file_system</div>
                  <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">document_parser</div>
                  <div className="p-1.5 rounded bg-white/[0.02] border border-white/[0.04]">browser_runner</div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Operations Quick Access */}
          <div className="rounded-xl bg-[#10141D] border border-white/[0.06] p-4 space-y-2.5 text-xs">
            <div className="flex items-center justify-between text-[#687180] font-medium text-xs pb-1 border-b border-white/[0.04]">
              <span>Recent Executions</span>
              <Clock className="w-3.5 h-3.5 stroke-[1.75]" />
            </div>

            <div className="space-y-1.5">
              {tasks.slice(0, 3).map((t) => (
                <div
                  key={t.id}
                  onClick={() => reuseTask(t)}
                  className="p-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.05] border border-white/[0.04] hover:border-white/[0.1] cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-medium text-[#E2E8F0] group-hover:text-[#F1F3F5] text-[11px] truncate">
                      {t.title}
                    </div>
                    <div className="text-[10px] text-[#687180] truncate font-mono mt-0.5">
                      {t.plannedTool || 'local_tool'}
                    </div>
                  </div>
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border shrink-0 ${
                    t.status === 'completed' 
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                      : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                  }`}>
                    {t.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
