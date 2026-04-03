/**
 * Native: expo-secure-store. Web bundle uses `secureStorage.web.ts` (no SecureStore import).
 */
import * as SecureStore from "expo-secure-store";

export async function secureGet(key: string): Promise<string | null> {
  return SecureStore.getItemAsync(key);
}

export async function secureSet(key: string, value: string): Promise<void> {
  return SecureStore.setItemAsync(key, value);
}

export async function secureDelete(key: string): Promise<void> {
  return SecureStore.deleteItemAsync(key);
}
