import { ConfigContext, ExpoConfig } from "expo/config";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_URL;

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
    ...config.extra,
    ...(configuredApiUrl ? { API_URL: configuredApiUrl } : {}),
    eas: {
        "projectId": "1a753a1a-ae23-47e9-ba06-cc6148fb36ee"
      }
  },
});
