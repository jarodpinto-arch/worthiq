/**
 * Web: localStorage only — never import expo-secure-store here (no native module in browser).
 */

export async function secureGet(key: string): Promise<string | null> {
  try {
    return typeof globalThis !== "undefined" && "localStorage" in globalThis
      ? globalThis.localStorage.getItem(key)
      : null;
  } catch {
    return null;
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      globalThis.localStorage.setItem(key, value);
    }
  } catch {
    /* quota / private mode */
  }
}

export async function secureDelete(key: string): Promise<void> {
  try {
    if (typeof globalThis !== "undefined" && "localStorage" in globalThis) {
      globalThis.localStorage.removeItem(key);
    }
  } catch {
    /* ignore */
  }
}
