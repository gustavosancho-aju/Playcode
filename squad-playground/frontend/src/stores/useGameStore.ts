import { create } from 'zustand';

interface GameStore {
  artifactsCollected: number;
  stagesCompleted: number;
  totalStages: number;
  elapsedMs: number;
  isTimerRunning: boolean;
  isPipelineComplete: boolean;

  collectArtifact: () => void;
  completeStage: () => void;
  setTimerRunning: (running: boolean) => void;
  tick: (deltaMs: number) => void;
  setPipelineComplete: () => void;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set) => ({
  artifactsCollected: 0,
  stagesCompleted: 0,
  totalStages: 7,
  elapsedMs: 0,
  isTimerRunning: false,
  isPipelineComplete: false,

  collectArtifact: () =>
    set((s) => ({ artifactsCollected: s.artifactsCollected + 1 })),

  completeStage: () =>
    set((s) => ({ stagesCompleted: s.stagesCompleted + 1 })),

  setTimerRunning: (running) =>
    set({ isTimerRunning: running }),

  tick: (deltaMs) =>
    set((s) => (s.isTimerRunning ? { elapsedMs: s.elapsedMs + deltaMs } : {})),

  setPipelineComplete: () =>
    set({ isPipelineComplete: true, isTimerRunning: false }),

  reset: () =>
    set({
      artifactsCollected: 0,
      stagesCompleted: 0,
      elapsedMs: 0,
      isTimerRunning: false,
      isPipelineComplete: false,
    }),
}));
