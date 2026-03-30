/**
 * Biometric authentication helper.
 * On login, store the JWT in SecureStore (encrypted, device-bound).
 * On subsequent launches, prompt Face ID / fingerprint before loading data.
 */
import * as LocalAuthentication from "expo-local-authentication";
import * as SecureStore from "expo-secure-store";

const BIOMETRICS_ENABLED_KEY = "worthiq_biometrics_enabled";

export async function isBiometricsAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return compatible && enrolled;
}

export async function isBiometricsEnabled(): Promise<boolean> {
  const val = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
  return val === "true";
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, enabled ? "true" : "false");
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

/**
 * Gate function — resolves true if auth passes, false if cancelled.
 * Skips if biometrics not enabled or not available.
 */
export async function requireBiometrics(): Promise<boolean> {
  const available = await isBiometricsAvailable();
  const enabled = await isBiometricsEnabled();
  if (!available || !enabled) return true; // skip
  return authenticateWithBiometrics();
}
