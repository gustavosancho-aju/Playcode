import { create } from 'zustand';
import type { AgentId } from 'shared/types';

interface PipelineStore {
  sessionId: string | null;
  status: 'idle' | 'executing' | 'approval_required' | 'completed' | 'error';
  currentStep: number;
  totalSteps: number;
  currentAgent: AgentId | null;
  message: string | null;
  error: string | null;
  artifacts: string[];

  setSession: (sessionId: string) => void;
  updateProgress: (data: {
    agent: AgentId;
    status: string;
    step: number;
    totalSteps: number;
    message?: string;
    artifactPath?: string;
  }) => void;
  setApprovalRequired: (agent: AgentId) => void;
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
  message: null,
  error: null,
  artifacts: [],

  setSession: (sessionId) =>
    set({ sessionId, status: 'executing', error: null }),

  updateProgress: (data) =>
    set({
      currentStep: data.step,
      totalSteps: data.totalSteps,
      currentAgent: data.agent,
      message: data.message || null,
      status: 'executing',
    }),

  setApprovalRequired: (agent) =>
    set({ status: 'approval_required', currentAgent: agent }),

  setCompleted: (artifacts) =>
    set({ status: 'completed', artifacts, currentAgent: null }),

  setError: (error) =>
    set({ status: 'error', error }),

  reset: () =>
    set({
      sessionId: null,
      status: 'idle',
      currentStep: 0,
      totalSteps: 7,
      currentAgent: null,
      message: null,
      error: null,
      artifacts: [],
    }),
}));
