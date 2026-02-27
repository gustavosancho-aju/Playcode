import { create } from 'zustand';

interface EffectsStore {
  codeRain: boolean;
  neoTrail: boolean;
  glitch: boolean;
  particles: boolean;
  reduceMotion: boolean;
  neoSpeed: number;
  typewriterSpeed: number;
  toggle: (effect: keyof Pick<EffectsStore, 'codeRain' | 'neoTrail' | 'glitch' | 'particles'>) => void;
  resetDefaults: () => void;
}

const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export const useEffectsStore = create<EffectsStore>((set) => ({
  codeRain: !prefersReducedMotion,
  neoTrail: !prefersReducedMotion,
  glitch: false,
  particles: !prefersReducedMotion,
  reduceMotion: prefersReducedMotion,
  neoSpeed: 1,
  typewriterSpeed: 50,

  toggle: (effect) => set((s) => ({ [effect]: !s[effect] })),

  resetDefaults: () =>
    set({
      codeRain: !prefersReducedMotion,
      neoTrail: !prefersReducedMotion,
      glitch: false,
      particles: !prefersReducedMotion,
      neoSpeed: 1,
      typewriterSpeed: 50,
    }),
}));
