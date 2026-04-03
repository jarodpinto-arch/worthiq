/**
 * Web stub — Metro resolves this file instead of linkSession.ts for web bundles,
 * so react-native-plaid-link-sdk (TurboModules) is never loaded in the browser.
 */

export enum LinkIOSPresentationStyle {
  MODAL = 0,
  FULL_SCREEN = 1,
}

export function create(_props: { token: string; noLoadingState?: boolean; onLoad?: () => void }): void {}

export function open(_props: {
  onSuccess?: (success: { publicToken: string }) => void;
  onExit?: (exit: { error?: { displayMessage?: string; errorDisplayMessage?: string } }) => void;
  iOSPresentationStyle?: LinkIOSPresentationStyle;
}): void {}

export async function destroy(): Promise<void> {}

export function dismissLink(): void {}
