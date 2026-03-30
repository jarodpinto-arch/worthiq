import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { login } from "../../src/lib/api";
import { isBiometricsAvailable, setBiometricsEnabled } from "../../src/lib/biometrics";

const CYAN = "#46C2E9";
const BG   = "#0A0C10";
const PANEL = "#11141B";

export default function LoginScreen() {
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password) return;
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);

      // Offer biometrics on first login
      const available = await isBiometricsAvailable();
      if (available) {
        Alert.alert(
          "Enable Face ID / Touch ID?",
          "Skip the password next time and unlock WorthIQ instantly.",
          [
            { text: "Not now", style: "cancel", onPress: () => router.replace("/(app)/dashboard") },
            {
              text: "Enable",
              onPress: async () => {
                await setBiometricsEnabled(true);
                router.replace("/(app)/dashboard");
              },
            },
          ]
        );
      } else {
        router.replace("/(app)/dashboard");
      }
    } catch (err: any) {
      Alert.alert("Login failed", err?.message ?? "Check your email and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Logo + headline */}
      <View style={styles.hero}>
        <Text style={styles.logoIQ}>Worth<Text style={{ color: CYAN }}>IQ</Text></Text>
        <Text style={styles.tagline}>Master Your Capital with AI</Text>
        <Text style={styles.sub}>Personal finance intelligence</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="#475569"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          returnKeyType="next"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#475569"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.btnText}>Log In</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.push("/(auth)/signup")}
          activeOpacity={0.75}
        >
          <Text style={styles.btnSecondaryText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root:          { flex: 1, backgroundColor: BG, justifyContent: "center", paddingHorizontal: 28 },
  hero:          { alignItems: "center", marginBottom: 48 },
  logoIQ:        { fontSize: 48, fontWeight: "900", color: "#fff", letterSpacing: -1.5 },
  tagline:       { marginTop: 12, fontSize: 17, fontWeight: "700", color: "#fff", textAlign: "center" },
  sub:           { marginTop: 6, fontSize: 13, color: "#64748b", textAlign: "center" },
  form:          { gap: 12 },
  input:         {
    backgroundColor: PANEL,
    borderWidth: 1,
    borderColor: "#1e293b",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: "#fff",
  },
  btn:           {
    marginTop: 4,
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingVertical: 17,
    alignItems: "center",
  },
  btnText:       { fontSize: 15, fontWeight: "800", color: "#000" },
  btnSecondary:  {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnSecondaryText: { fontSize: 15, fontWeight: "700", color: "#fff" },
});
