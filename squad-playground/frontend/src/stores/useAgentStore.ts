import { create } from 'zustand';
import type { AgentState, AgentId } from 'shared/types';
import { AGENT_DEFINITIONS } from 'shared/types';

interface AgentStore {
  agents: AgentState[];
  activeAgent: AgentId | null;
  completedSteps: AgentId[];
  updateAgent: (id: AgentId, patch: Partial<AgentState>) => void;
  setActiveAgent: (id: AgentId) => void;
  markCompleted: (id: AgentId) => void;
  resetAll: () => void;
}

const initialAgents: AgentState[] = AGENT_DEFINITIONS.map((def, i) => ({
  id: def.id,
  name: def.name,
  color: def.color,
  icon: def.icon,
  status: 'idle',
  message: null,
  artifactPath: null,
  position: { x: 200 + i * 400, y: 300 },
}));

export const useAgentStore = create<AgentStore>((set) => ({
  agents: initialAgents,
  activeAgent: null,
  completedSteps: [],

  updateAgent: (id, patch) =>
    set((s) => ({
      agents: s.agents.map((a) => (a.id === id ? { ...a, ...patch } : a)),
    })),

  setActiveAgent: (id) =>
    set((s) => ({
      activeAgent: id,
      agents: s.agents.map((a) => ({
        ...a,
        status: a.id === id ? 'active' : a.status,
      })),
    })),

  markCompleted: (id) =>
    set((s) => ({
      completedSteps: [...s.completedSteps, id],
      agents: s.agents.map((a) =>
        a.id === id ? { ...a, status: 'done' } : a
      ),
    })),

  resetAll: () =>
    set({
      agents: initialAgents,
      activeAgent: null,
      completedSteps: [],
    }),
}));
