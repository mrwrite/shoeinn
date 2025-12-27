import { ConfigContext, ExpoConfig } from "expo/config";

const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Shoeinn",
  slug: "shoeinn",
  version: "1.0.0",
  orientation: "portrait",
  platforms: ["ios", "android", "web"],
  updates: {
    checkAutomatically: "ON_ERROR_RECOVERY",
    fallbackToCacheTimeout: 0,
  },
  extra: {
    API_URL: DEFAULT_API_URL,
    ...config.extra,
  },
});
