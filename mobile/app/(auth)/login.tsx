import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image,
  KeyboardAvoidingView, Platform, ActivityIndicator, Alert,
} from "react-native";
import { router } from "expo-router";
import { login } from "../../src/lib/api";
import { isBiometricsAvailable, setBiometricsEnabled } from "../../src/lib/biometrics";
import { theme } from "../../src/theme";

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
        <Image
          source={require("../../assets/splash.png")}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.sub}>Personal finance intelligence</Text>
      </View>

      {/* Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.textDim}
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
          placeholderTextColor={theme.textDim}
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
            ? <ActivityIndicator color={theme.bg} />
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
  root:          { flex: 1, backgroundColor: theme.bg, justifyContent: "center", paddingHorizontal: 28 },
  hero:          { alignItems: "center", marginBottom: 48 },
  logo:          { width: 220, height: 220, marginBottom: 4 },
  sub:           { marginTop: 4, fontSize: 13, color: theme.textMuted, textAlign: "center" },
  form:          { gap: 12 },
  input:         {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusSm,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: theme.text,
  },
  btn:           {
    marginTop: 4,
    backgroundColor: theme.text,
    borderRadius: theme.radiusMd,
    paddingVertical: 17,
    alignItems: "center",
  },
  btnText:       { fontSize: 15, fontWeight: "800", color: theme.bg },
  btnSecondary:  {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: theme.radiusMd,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnSecondaryText: { fontSize: 15, fontWeight: "700", color: theme.text },
});
