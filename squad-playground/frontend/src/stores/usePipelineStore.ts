import { create } from 'zustand';
import type { AgentId, Task } from 'shared/types';

interface ApprovalData {
  agentId: AgentId;
  artifactName: string;
  artifactContent: string;
}

interface PipelineStore {
  sessionId: string | null;
  status: 'idle' | 'executing' | 'approval_required' | 'completed' | 'error';
  currentStep: number;
  totalSteps: number;
  currentAgent: AgentId | null;
  currentTasks: Task[];
  allTasks: Partial<Record<AgentId, Task[]>>;
  message: string | null;
  error: string | null;
  artifacts: string[];
  pendingApproval: ApprovalData | null;

  setSession: (sessionId: string) => void;
  updateProgress: (data: {
    agent: AgentId;
    status: string;
    step: number;
    totalSteps: number;
    message?: string;
    artifactPath?: string;
  }) => void;
  updateTasks: (agent: AgentId, tasks: Task[]) => void;
  setApprovalRequired: (agent: AgentId, artifactName: string, artifactContent: string) => void;
  clearApproval: () => void;
  handleRollback: (targetStep: number, targetAgent: AgentId) => void;
  setCompleted: (artifacts: string[]) => void;
  setError: (error: string) => void;
  reset: () => void;
}

export const usePipelineStore = create<PipelineStore>((set) => ({
  sessionId: null,
  status: 'idle',
  currentStep: 0,
  totalSteps: 7,
  currentAgent: null,
  currentTasks: [],
  allTasks: {},
  message: null,
  error: null,
  artifacts: [],
  pendingApproval: null,

  setSession: (sessionId) =>
    set({ sessionId, status: 'executing', error: null, allTasks: {} }),

  updateProgress: (data) =>
    set((state) => ({
      currentStep: data.step,
      totalSteps: data.totalSteps,
      currentAgent: data.agent,
      currentTasks: state.currentAgent !== data.agent ? [] : state.currentTasks,
      message: data.message || null,
      status: 'executing',
      pendingApproval: null,
    })),

  updateTasks: (agent, tasks) =>
    set((state) => ({
      currentTasks: tasks,
      allTasks: { ...state.allTasks, [agent]: tasks },
    })),

  setApprovalRequired: (agent, artifactName, artifactContent) =>
    set({
      status: 'approval_required',
      currentAgent: agent,
      pendingApproval: { agentId: agent, artifactName, artifactContent },
    }),

  clearApproval: () =>
    set({ pendingApproval: null, status: 'executing' }),

  handleRollback: (targetStep, targetAgent) =>
    set({
      status: 'executing',
      currentStep: targetStep,
      currentAgent: targetAgent,
      pendingApproval: null,
      error: null,
    }),

  setCompleted: (artifacts) =>
    set({ status: 'completed', artifacts, currentAgent: null, pendingApproval: null }),

  setError: (error) =>
    set({ status: 'error', error }),

  reset: () =>
    set({
      sessionId: null,
      status: 'idle',
      currentStep: 0,
      totalSteps: 7,
      currentAgent: null,
      currentTasks: [],
      allTasks: {},
      message: null,
      error: null,
      artifacts: [],
      pendingApproval: null,
    }),
}));
