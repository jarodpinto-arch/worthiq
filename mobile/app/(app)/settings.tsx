import { useCallback, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { router } from "expo-router";
import { logout } from "../../src/lib/api";
import {
  isBiometricsAvailable,
  isBiometricsEnabled,
  setBiometricsEnabled,
} from "../../src/lib/biometrics";
import { theme } from "../../src/theme";

export default function SettingsScreen() {
  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioOn, setBioOn] = useState(false);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const [avail, on] = await Promise.all([isBiometricsAvailable(), isBiometricsEnabled()]);
    setBioAvailable(avail);
    setBioOn(on);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function toggleBio(value: boolean) {
    await setBiometricsEnabled(value);
    setBioOn(value);
  }

  function confirmLogout() {
    Alert.alert("Log out", "You will need to sign in again.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Log out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={styles.root} edges={["top"]}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Security</Text>
        {loading ? (
          <ActivityIndicator color={theme.cyan} style={{ marginVertical: 16 }} />
        ) : (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowTitle}>Face ID / Touch ID</Text>
              <Text style={styles.rowSub}>
                {bioAvailable
                  ? "Require biometrics when opening the app"
                  : "Not available on this device"}
              </Text>
            </View>
            <Switch
              value={bioOn && bioAvailable}
              onValueChange={toggleBio}
              disabled={!bioAvailable}
              trackColor={{ false: "#334155", true: "#164e63" }}
              thumbColor={bioOn && bioAvailable ? theme.cyan : theme.textMuted}
            />
          </View>
        )}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={confirmLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>Log out</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, paddingHorizontal: 20 },
  title: { fontSize: 28, fontWeight: "900", color: theme.text, marginBottom: 24 },
  card: {
    backgroundColor: theme.panel,
    borderRadius: theme.radiusMd,
    padding: 18,
    borderWidth: 1,
    borderColor: theme.border,
    marginBottom: 24,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: theme.textDim,
    letterSpacing: 2,
    marginBottom: 12,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  rowTitle: { fontSize: 16, fontWeight: "700", color: theme.text },
  rowSub: { fontSize: 12, color: theme.textMuted, marginTop: 4 },
  logoutBtn: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: theme.danger,
    borderRadius: theme.radiusMd,
    paddingVertical: 16,
    alignItems: "center",
  },
  logoutText: { fontSize: 15, fontWeight: "800", color: theme.danger },
});
