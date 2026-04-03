import type { ExpoConfig } from "expo/config";

const projectId =
  process.env.EAS_PROJECT_ID && process.env.EAS_PROJECT_ID !== ""
    ? process.env.EAS_PROJECT_ID
    : "REPLACE_WITH_EAS_PROJECT_ID";

const config: ExpoConfig = {
  name: "WorthIQ",
  slug: "worthiq",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./assets/icon.png",
  scheme: "worthiq",
  userInterfaceStyle: "dark",
  backgroundColor: "#0A0C10",
  splash: {
    image: "./assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#0A0C10",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "io.worthiq.app",
    infoPlist: {
      NSFaceIDUsageDescription: "WorthIQ uses Face ID to keep your financial data secure.",
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#0A0C10",
    },
    package: "io.worthiq.app",
    permissions: ["USE_BIOMETRIC", "USE_FINGERPRINT"],
  },
  plugins: [
    "expo-router",
    "expo-font",
    "expo-asset",
    "expo-dev-client",
    "expo-secure-store",
    [
      "expo-local-authentication",
      { faceIDPermission: "WorthIQ uses Face ID to secure your account." },
    ],
    [
      "expo-notifications",
      {
        icon: "./assets/notification-icon.png",
        color: "#46C2E9",
      },
    ],
  ],
  extra: {
    eas: {
      projectId,
    },
  },
};

export default config;
