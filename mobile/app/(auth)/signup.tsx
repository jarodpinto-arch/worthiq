import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { register } from "../../src/lib/api";
import { isBiometricsAvailable, setBiometricsEnabled } from "../../src/lib/biometrics";
import { theme, wordmarkIqTight } from "../../src/theme";

export default function SignupScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup() {
    if (!email.trim() || !password || password.length < 8) {
      Alert.alert("Check your details", "Use a valid email and a password of at least 8 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(email.trim().toLowerCase(), password, name.trim() || undefined);

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
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not create account.";
      Alert.alert("Sign up failed", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.hero}>
        <Text style={styles.logoIQ}>
          Worth<Text style={[wordmarkIqTight, { color: theme.cyan }]}>IQ</Text>
        </Text>
        <Text style={styles.tagline}>Create your account</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Name (optional)"
          placeholderTextColor={theme.textDim}
          value={name}
          onChangeText={setName}
          autoComplete="name"
          returnKeyType="next"
        />
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
          placeholder="Password (min 8 characters)"
          placeholderTextColor={theme.textDim}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="new-password"
          returnKeyType="done"
          onSubmitEditing={handleSignup}
        />

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.6 }]}
          onPress={handleSignup}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={theme.bg} />
          ) : (
            <Text style={styles.btnText}>Create Account</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnSecondary}
          onPress={() => router.back()}
          activeOpacity={0.75}
        >
          <Text style={styles.btnSecondaryText}>Already have an account? Log in</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: theme.bg, justifyContent: "center", paddingHorizontal: 28 },
  hero: { alignItems: "center", marginBottom: 40 },
  logoIQ: { fontSize: 42, fontWeight: "900", color: theme.text, letterSpacing: -2 },
  tagline: { marginTop: 10, fontSize: 16, fontWeight: "600", color: theme.textMuted, textAlign: "center" },
  form: { gap: 12 },
  input: {
    backgroundColor: theme.panel,
    borderWidth: 1,
    borderColor: theme.border,
    borderRadius: theme.radiusSm,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 15,
    color: theme.text,
  },
  btn: {
    marginTop: 4,
    backgroundColor: theme.text,
    borderRadius: theme.radiusMd,
    paddingVertical: 17,
    alignItems: "center",
  },
  btnText: { fontSize: 15, fontWeight: "800", color: theme.bg },
  btnSecondary: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
    borderRadius: theme.radiusMd,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnSecondaryText: { fontSize: 14, fontWeight: "700", color: theme.text },
});
