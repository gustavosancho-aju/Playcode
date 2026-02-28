import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AgentId } from 'shared/types';
import { AGENT_DEFINITIONS, DEFAULT_PIPELINE_CONFIG } from 'shared/types';

interface EffectsSettings {
  codeRain: boolean;
  neoTrail: boolean;
  glitch: boolean;
  particles: boolean;
  reduceMotion: boolean;
  soundEnabled: boolean;
}

interface AnimationSettings {
  neoSpeed: number;       // px/s (50-300, default 150)
  typewriterSpeed: number; // chars/s (10-100, default 30)
}

interface PipelineSettings {
  approvalPerAgent: Partial<Record<AgentId, boolean>>;
}

interface SettingsStore {
  effects: EffectsSettings;
  animation: AnimationSettings;
  pipeline: PipelineSettings;

  toggleEffect: (key: keyof Omit<EffectsSettings, 'reduceMotion'>) => void;
  setReduceMotion: (value: boolean) => void;
  setNeoSpeed: (value: number) => void;
  setTypewriterSpeed: (value: number) => void;
  setAgentApproval: (agentId: AgentId, required: boolean) => void;
  resetDefaults: () => void;
}

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const defaultEffects: EffectsSettings = {
  codeRain: !prefersReducedMotion,
  neoTrail: !prefersReducedMotion,
  glitch: false,
  particles: !prefersReducedMotion,
  reduceMotion: prefersReducedMotion,
  soundEnabled: false,
};

const defaultAnimation: AnimationSettings = {
  neoSpeed: 150,
  typewriterSpeed: 30,
};

const defaultPipeline: PipelineSettings = {
  approvalPerAgent: { ...DEFAULT_PIPELINE_CONFIG.approvalRequired },
};

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      effects: { ...defaultEffects },
      animation: { ...defaultAnimation },
      pipeline: { ...defaultPipeline },

      toggleEffect: (key) =>
        set((s) => ({
          effects: { ...s.effects, [key]: !s.effects[key] },
        })),

      setReduceMotion: (value) =>
        set((s) => ({
          effects: {
            ...s.effects,
            reduceMotion: value,
            ...(value ? { neoTrail: false, glitch: false, particles: false } : {}),
          },
        })),

      setNeoSpeed: (value) =>
        set((s) => ({
          animation: { ...s.animation, neoSpeed: Math.max(50, Math.min(300, value)) },
        })),

      setTypewriterSpeed: (value) =>
        set((s) => ({
          animation: { ...s.animation, typewriterSpeed: Math.max(10, Math.min(100, value)) },
        })),

      setAgentApproval: (agentId, required) =>
        set((s) => ({
          pipeline: {
            ...s.pipeline,
            approvalPerAgent: { ...s.pipeline.approvalPerAgent, [agentId]: required },
          },
        })),

      resetDefaults: () =>
        set({
          effects: { ...defaultEffects },
          animation: { ...defaultAnimation },
          pipeline: { ...defaultPipeline },
        }),
    }),
    {
      name: 'squad-playground-settings',
    }
  )
);
