import { create } from 'zustand';

/**
 * Cold-start lock status, shared so the launch animation can wait for Face ID.
 * - pending: persisted session not restored yet
 * - locked:  biometric check required before the app may be shown
 * - open:    nothing to unlock (or already unlocked)
 */
export type ColdLockStatus = 'pending' | 'locked' | 'open';

export const useColdLockStore = create<{
  status: ColdLockStatus;
  setStatus: (status: ColdLockStatus) => void;
}>((set) => ({
  status: 'pending',
  setStatus: (status) => set({ status }),
}));
