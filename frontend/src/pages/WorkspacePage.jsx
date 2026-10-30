import React, { useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  FolderCheck,
  Terminal
} from 'lucide-react';
import { useTasks } from '../context/TaskContext';
import { ForgeLogo } from '../components/common/ForgeLogo';
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

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, activeTask?.status]);

  const isTaskRunning = activeTask && [
    TASK_STATUS.UNDERSTANDING,
    TASK_STATUS.PLANNING,
    TASK_STATUS.EXECUTING,
    TASK_STATUS.VERIFYING
  ].includes(activeTask.status);

  // If messages only contain initial greeting and no active task, show welcoming workspace canvas
  const isFreshSession = messages.length <= 1 && !activeTask;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-7.5rem)] justify-between pb-2">
      {/* Central Content Canvas */}
      <div className="flex-1 space-y-6">
        {isFreshSession ? (
          /* High-Craft Welcome State */
          <div className="py-6 sm:py-10 space-y-8 animate-in fade-in duration-300">
            {/* Ambient Logo & Greeting */}
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-b from-white/[0.08] to-white/[0.02] border border-white/[0.1] flex items-center justify-center shadow-xl">
                <ForgeLogo size={32} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-white">
                What shall we automate today?
              </h2>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                FORGE AI plans multi-step tool actions, pauses for your approval, executes locally via Python, and verifies output integrity.
              </p>
            </div>

            {/* Capability Feature Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-xs">
              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5 hover:border-white/[0.1] transition-colors">
                <div className="flex items-center gap-2 font-medium text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[1.8]" />
                  <span>Airgap Protection</span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Local Ollama LLM and offline sandboxed tools. Zero outbound network leaks.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5 hover:border-white/[0.1] transition-colors">
                <div className="flex items-center gap-2 font-medium text-white">
                  <Terminal className="w-4 h-4 text-sky-400 stroke-[1.8]" />
                  <span>Deterministic Plan</span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  7-stage lifecycle with step verifications and runtime execution telemetry.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5 hover:border-white/[0.1] transition-colors">
                <div className="flex items-center gap-2 font-medium text-white">
                  <FolderCheck className="w-4 h-4 text-indigo-400 stroke-[1.8]" />
                  <span>Operator Control</span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Human-in-the-loop authorization gate before any filesystem modifications.
                </p>
              </div>
            </div>

            {/* Popular Starter Tasks */}
            <div className="pt-2">
              <SuggestedTasks onSelectSuggestion={submitPrompt} />
            </div>
          </div>
        ) : (
          /* Active Conversational & Execution Feed */
          <div className="space-y-4 py-2">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}

            {/* Active Workflow Progression */}
            {activeTask && (
              <div className="space-y-4 animate-in fade-in duration-200">
                <TaskProgressTimeline task={activeTask} />

                {/* Authorization Gate Card */}
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
        )}
      </div>

      {/* Floating Prompt Composer Dock (Anchored at bottom) */}
      <div className="sticky bottom-0 pt-4 pb-2 z-30">
        <MessageComposer
          onSubmit={submitPrompt}
          disabled={isTaskRunning}
        />
      </div>
    </div>
  );
}
