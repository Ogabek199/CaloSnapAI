import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

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
    // Map raw tech errors to friendly user-safe text
    let userFriendly = message;
    if (
      message.includes('404') ||
      message.includes('500') ||
      message.includes('Network') ||
      message.includes('Failed to fetch') ||
      message.includes('ApiError')
    ) {
      userFriendly = 'Xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.';
    }

    set({ visible: true, message: userFriendly, type });

    setTimeout(() => {
      set({ visible: false });
    }, 3500);
  },

  hideToast: () => set({ visible: false }),
}));
