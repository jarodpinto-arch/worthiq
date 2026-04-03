/**
 * Entry point — checks for existing auth token and biometrics,
 * then routes to (app) or (auth)/login.
 */
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { getToken } from "../src/lib/api";
import { requireBiometrics } from "../src/lib/biometrics";
import { theme } from "../src/theme";

export default function Index() {
  useEffect(() => {
    async function boot() {
      const token = await getToken();

      if (!token) {
        router.replace("/(auth)/login");
        return;
      }

      // Token exists — gate with biometrics if enabled
      const passed = await requireBiometrics();
      if (!passed) {
        // User cancelled biometrics — show login
        router.replace("/(auth)/login");
        return;
      }

      router.replace("/(app)/dashboard");
    }

    boot();
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator color={theme.cyan} size="large" />
    </View>
  );
}
