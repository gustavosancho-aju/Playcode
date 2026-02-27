import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: number;
  type: ToastType;
  message: string;
  createdAt: number;
}

let nextId = 1;

interface ToastStore {
  toasts: Toast[];
  addToast: (type: ToastType, message: string) => void;
  removeToast: (id: number) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = nextId++;
    set((s) => ({ toasts: [...s.toasts.slice(-4), { id, type, message, createdAt: Date.now() }] }));
    // Auto-dismiss after 5s
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },

  removeToast: (id) =>
    set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
