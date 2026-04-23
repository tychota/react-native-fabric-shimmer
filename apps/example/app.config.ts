import type { ExpoConfig } from "expo/config";

const config: ExpoConfig = {
  name: "rn-dynamic-shimmer-example",
  slug: "rn-dynamic-shimmer-example",
  version: "0.0.0",
  orientation: "portrait",
  scheme: "shimmer-example",
  platforms: ["ios", "android"],
  ios: { bundleIdentifier: "com.theodoskeleton.shimmerexample" },
  android: { package: "com.theodoskeleton.shimmerexample" },
  plugins: [
    "expo-router",
    [
      "expo-build-properties",
      {
        android: { newArchEnabled: true },
        ios: { newArchEnabled: true },
      },
    ],
  ],
  experiments: { typedRoutes: true },
};

export default config;
