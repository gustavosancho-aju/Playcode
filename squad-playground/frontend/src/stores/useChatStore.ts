import { create } from 'zustand';

export interface ChatMessage {
  agentId: string;
  icon: string;
  name: string;
  color: string;
  text: string;
  timestamp: number;
}

interface ChatStore {
  messages: ChatMessage[];
  addMessage: (msg: Omit<ChatMessage, 'timestamp'>) => void;
  clear: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  addMessage: (msg) =>
    set((s) => ({
      messages: [...s.messages, { ...msg, timestamp: Date.now() }],
    })),
  clear: () => set({ messages: [] }),
}));
