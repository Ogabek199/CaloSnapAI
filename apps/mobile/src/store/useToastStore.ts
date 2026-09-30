import { create } from 'zustand';
import { useAppStore } from './useAppStore';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

const TOAST_DURATION_MS = 3500;

// Raw runtime/transport errors that should never be shown verbatim.
const TECHNICAL_ERROR_PATTERN =
  /^(TypeError|SyntaxError|ReferenceError|Error:)|Network request failed|Failed to fetch|JSON Parse error|Unexpected token|undefined is not|null is not/i;

let hideTimer: ReturnType<typeof setTimeout> | null = null;

const clearHideTimer = () => {
  if (hideTimer) {
    clearTimeout(hideTimer);
    hideTimer = null;
  }
};

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
  showToast: (message: string, type?: ToastType) => void;
  hideToast: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  visible: false,
  message: '',
  type: 'info',

  showToast: (message: string, type = 'info') => {
    const text = typeof message === 'string' ? message.trim() : '';
    const userFriendly =
      !text || TECHNICAL_ERROR_PATTERN.test(text) ? useAppStore.getState().t().errGeneric : text;

    clearHideTimer();
    set({ visible: true, message: userFriendly, type });

    hideTimer = setTimeout(() => {
      hideTimer = null;
      set({ visible: false });
    }, TOAST_DURATION_MS);
  },

  hideToast: () => {
    clearHideTimer();
    set({ visible: false });
  },
}));
