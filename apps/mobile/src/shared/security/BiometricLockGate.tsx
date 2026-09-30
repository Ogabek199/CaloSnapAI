import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  AppStateStatus,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  ActivityIndicator,
} from 'react-native';
import { ScanFace } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppStore, usePalette, useStrings } from '../../store/useAppStore';
import {
  authenticateWithBiometrics,
  BIOMETRIC_LOCK_AFTER_MS,
  hasDeviceAuthentication,
} from './biometric';
import { FontSize, Radius, Spacing } from '../theme/spacing';
import { useColdLockStore } from './lock-state';

/**
 * Locks the app on cold start and after inactivity in background.
 * Only when the user has enabled biometric lock in Profile.
 * Does not prompt while the user is actively using the app.
 */
export function BiometricLockGate() {
  const insets = useSafeAreaInsets();
  const biometricLockEnabled = useAppStore((s) => s.biometricLockEnabled);
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const token = useAppStore((s) => s.token);
  const isOnboardingCompleted = useAppStore((s) => s.isOnboardingCompleted);
  const c = usePalette();
  const strings = useStrings();

  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  const [unlocked, setUnlocked] = useState(true);
  const [busy, setBusy] = useState(false);
  // On cold start the system Face ID sheet is shown over the splash; the lock screen only appears if it fails.
  const [coldPrompting, setColdPrompting] = useState(false);
  const backgroundedAt = useRef<number | null>(null);
  const authenticating = useRef(false);
  const promptedForLock = useRef(false);
  const setColdStatus = useColdLockStore((s) => s.setStatus);

  const shouldGate =
    hydrated &&
    biometricLockEnabled &&
    isLoggedIn &&
    !!token &&
    isOnboardingCompleted;

  const locked = shouldGate && !unlocked;

  useEffect(() => {
    const applyColdStartLock = () => {
      setHydrated(true);
      const s = useAppStore.getState();
      if (
        s.biometricLockEnabled &&
        s.isLoggedIn &&
        s.token &&
        s.isOnboardingCompleted
      ) {
        setUnlocked(false);
        setColdPrompting(true);
        setColdStatus('locked');
      } else {
        setColdStatus('open');
      }
    };

    if (useAppStore.persist.hasHydrated()) {
      applyColdStartLock();
    }
    return useAppStore.persist.onFinishHydration(applyColdStartLock);
  }, []);

  useEffect(() => {
    if (!shouldGate) {
      setUnlocked(true);
      setColdPrompting(false);
      promptedForLock.current = false;
      if (hydrated) setColdStatus('open');
    }
  }, [shouldGate, hydrated, setColdStatus]);

  useEffect(() => {
    if (!shouldGate) return;

    const onChange = (next: AppStateStatus) => {
      if (next === 'background') {
        if (!authenticating.current) {
          backgroundedAt.current = Date.now();
        }
        return;
      }
      if (next === 'active') {
        const bg = backgroundedAt.current;
        backgroundedAt.current = null;
        if (bg != null && Date.now() - bg >= BIOMETRIC_LOCK_AFTER_MS) {
          promptedForLock.current = false;
          setUnlocked(false);
        }
      }
    };

    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, [shouldGate]);

  const unlock = useCallback(async () => {
    if (authenticating.current) return;
    authenticating.current = true;
    setBusy(true);
    try {
      const ok = await authenticateWithBiometrics(strings.biometricPrompt);
      if (ok) {
        setUnlocked(true);
        promptedForLock.current = false;
        setColdStatus('open');
      } else if (!(await hasDeviceAuthentication())) {
        // Biometrics and passcode were removed from the device; the lock can never be satisfied.
        useAppStore.getState().setBiometricLockEnabled(false);
        setUnlocked(true);
        promptedForLock.current = false;
        setColdStatus('open');
      }
    } finally {
      authenticating.current = false;
      setBusy(false);
      setColdPrompting(false);
    }
  }, [strings.biometricPrompt, setColdStatus]);

  useEffect(() => {
    if (!locked || promptedForLock.current) return;
    promptedForLock.current = true;
    unlock();
  }, [locked, unlock]);

  if (!locked || coldPrompting) return null;

  return (
    <Modal visible animationType="fade" presentationStyle="fullScreen" statusBarTranslucent>
      <View
        style={[
          styles.root,
          {
            backgroundColor: c.background,
            paddingTop: insets.top + Spacing.xl,
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.center}>
          <View style={[styles.iconWrap, { backgroundColor: c.primaryBg }]}>
            <ScanFace size={48} color={c.primary} strokeWidth={1.6} />
          </View>
          <Text style={[styles.title, { color: c.text }]}>{strings.biometricLockTitle}</Text>
          <Text style={[styles.sub, { color: c.textMuted }]}>{strings.biometricLockSub}</Text>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={unlock}
            disabled={busy}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.btn,
              {
                backgroundColor: c.primary,
                opacity: busy ? 0.7 : pressed ? 0.9 : 1,
              },
            ]}
          >
            {busy ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.btnText}>{strings.biometricUnlock}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={() => useAppStore.getState().logout()}
            disabled={busy}
            accessibilityRole="button"
            hitSlop={8}
            style={({ pressed }) => [styles.secondaryBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Text style={[styles.secondaryBtnText, { color: c.textMuted }]}>{strings.logout}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'space-between',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: FontSize.xl,
    fontWeight: '700',
    letterSpacing: -0.3,
    textAlign: 'center',
  },
  sub: {
    fontSize: FontSize.sm,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
  btn: {
    height: 54,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    color: '#fff',
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  actions: {
    gap: Spacing.sm,
  },
  secondaryBtn: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontSize: FontSize.sm,
    fontWeight: '600',
  },
});
