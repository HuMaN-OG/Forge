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

  // If messages only contain initial welcome and no active task, show clean hero presentation
  const isFreshSession = messages.length <= 1 && !activeTask;

  return (
    <div className="max-w-4xl mx-auto flex flex-col min-h-[calc(100vh-8rem)] justify-between pb-4">
      {/* Central Content Area */}
      <div className="flex-1 space-y-6">
        {isFreshSession ? (
          /* Hero Introduction for Judges & Operators */
          <div className="py-8 sm:py-12 space-y-8 animate-in fade-in duration-300">
            {/* Ambient Brand Header */}
            <div className="text-center space-y-3 max-w-xl mx-auto">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center shadow-lg">
                <ForgeLogo size={28} />
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                What shall we automate today?
              </h2>
              <p className="text-sm text-[#A1A1AA] leading-relaxed">
                FORGE is an autonomous computer-use assistant running locally on your hardware. It plans multi-step actions, seeks your explicit approval, and verifies results.
              </p>
            </div>

            {/* Core Capability Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-2xl mx-auto text-xs">
              <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1">
                <div className="flex items-center gap-2 font-medium text-[#F4F4F5]">
                  <ShieldCheck className="w-4 h-4 text-emerald-400 stroke-[1.8]" />
                  <span>Airgap Enforced</span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Zero cloud telemetry. Local Ollama LLM and local Python execution sandbox.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1">
                <div className="flex items-center gap-2 font-medium text-[#F4F4F5]">
                  <Terminal className="w-4 h-4 text-sky-400 stroke-[1.8]" />
                  <span>7-Stage Pipeline</span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  Deterministic workflow from Intent Understanding to Post-execution Verification.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white/[0.025] border border-white/[0.05] space-y-1">
                <div className="flex items-center gap-2 font-medium text-[#F4F4F5]">
                  <FolderCheck className="w-4 h-4 text-indigo-400 stroke-[1.8]" />
                  <span>Human-in-the-Loop</span>
                </div>
                <p className="text-[11px] text-[#71717A] leading-relaxed">
                  No arbitrary disk alterations without your explicit authorization.
                </p>
              </div>
            </div>

            {/* Suggested Starter Actions */}
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
