/**
 * Native: Face ID / Touch ID + secure storage flag.
 */
import * as LocalAuthentication from "expo-local-authentication";
import { secureDelete, secureGet, secureSet } from "./secureStorage";

const BIOMETRICS_ENABLED_KEY = "worthiq_biometrics_enabled";

export async function isBiometricsAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function isBiometricsEnabled(): Promise<boolean> {
  const val = await secureGet(BIOMETRICS_ENABLED_KEY);
  return val === "true";
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  if (enabled) {
    await secureSet(BIOMETRICS_ENABLED_KEY, "true");
  } else {
    await secureDelete(BIOMETRICS_ENABLED_KEY);
  }
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Verify your identity to access WorthIQ",
    fallbackLabel: "Use passcode",
    cancelLabel: "Cancel",
    disableDeviceFallback: false,
  });
  return result.success;
}

export async function requireBiometrics(): Promise<boolean> {
  const available = await isBiometricsAvailable();
  const enabled = await isBiometricsEnabled();
  if (!available || !enabled) return true;
  return authenticateWithBiometrics();
}
