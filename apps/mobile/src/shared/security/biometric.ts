import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

/** Re-lock after this much time in background (not while using the app). */
export const BIOMETRIC_LOCK_AFTER_MS = 2 * 60 * 1000;

export type BiometricAvailability = {
  available: boolean;
  biometryType: 'face' | 'fingerprint' | 'iris' | 'none';
};

export async function getBiometricAvailability(): Promise<BiometricAvailability> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!hasHardware || !isEnrolled) {
      return { available: false, biometryType: 'none' };
    }

    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return { available: true, biometryType: 'face' };
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return { available: true, biometryType: 'iris' };
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return { available: true, biometryType: 'fingerprint' };
    }
    return { available: true, biometryType: Platform.OS === 'ios' ? 'face' : 'fingerprint' };
  } catch {
    return { available: false, biometryType: 'none' };
  }
}

export async function authenticateWithBiometrics(promptMessage: string): Promise<boolean> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
      fallbackLabel: 'Passcode',
    });
    return result.success === true;
  } catch {
    return false;
  }
}
