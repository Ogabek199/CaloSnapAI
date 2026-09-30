import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { safeStorage } from '../shared/storage/safe-storage';

export type ChatMessage = {
  id: string;
  role: 'user' | 'model';
  text: string;
  createdAt: number;
  /** Set on a user message whose reply failed, so it can be retried. */
  failed?: boolean;
};

// Enough scrollback for the user; the server only ever sees the last 20 turns.
const MAX_STORED_MESSAGES = 100;

interface ChatState {
  /** History belongs to one account; another user signing in on the device starts clean. */
  ownerId: string | null;
  messages: ChatMessage[];
  ensureOwner: (userId: string | undefined) => void;
  addMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => ChatMessage;
  markFailed: (id: string, failed: boolean) => void;
  removeMessage: (id: string) => void;
  clear: () => void;
  reset: () => void;
}

const newId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const useChatStore = create<ChatState>()(
  persist(
    (set, get) => ({
      ownerId: null,
      messages: [],

      ensureOwner: (userId) => {
        const id = userId ?? null;
        if (get().ownerId !== id) set({ ownerId: id, messages: [] });
      },

      addMessage: (message) => {
        const full: ChatMessage = { ...message, id: newId(), createdAt: Date.now() };
        set((s) => ({ messages: [...s.messages, full].slice(-MAX_STORED_MESSAGES) }));
        return full;
      },

      markFailed: (id, failed) =>
        set((s) => ({ messages: s.messages.map((m) => (m.id === id ? { ...m, failed } : m)) })),

      removeMessage: (id) => set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),

      clear: () => set({ messages: [] }),

      reset: () => set({ ownerId: null, messages: [] }),
    }),
    {
      name: 'calosnap_chat_storage',
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({ ownerId: s.ownerId, messages: s.messages }),
    },
  ),
);
