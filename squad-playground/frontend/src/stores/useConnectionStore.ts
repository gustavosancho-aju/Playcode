import { create } from 'zustand';

interface ConnectionStore {
  isConnected: boolean;
  reconnectAttempts: number;
  lastPong: number | null;
  setConnected: (value: boolean) => void;
  incrementReconnect: () => void;
  resetReconnect: () => void;
  setLastPong: (timestamp: number) => void;
}

export const useConnectionStore = create<ConnectionStore>((set) => ({
  isConnected: false,
  reconnectAttempts: 0,
  lastPong: null,
  setConnected: (value) => set({ isConnected: value }),
  incrementReconnect: () => set((s) => ({ reconnectAttempts: s.reconnectAttempts + 1 })),
  resetReconnect: () => set({ reconnectAttempts: 0 }),
  setLastPong: (timestamp) => set({ lastPong: timestamp }),
}));
