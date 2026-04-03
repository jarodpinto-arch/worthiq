/**
 * Web: biometrics are not used; avoid importing expo-local-authentication.
 */

export async function isBiometricsAvailable(): Promise<boolean> {
  return false;
}

export async function isBiometricsEnabled(): Promise<boolean> {
  return false;
}

export async function setBiometricsEnabled(_enabled: boolean): Promise<void> {}

export async function authenticateWithBiometrics(): Promise<boolean> {
  return true;
}

export async function requireBiometrics(): Promise<boolean> {
  return true;
}
