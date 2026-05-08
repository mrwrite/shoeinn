import { ConfigContext, ExpoConfig } from "expo/config";

const configuredApiUrl = process.env.EXPO_PUBLIC_API_BASE_URL ?? process.env.EXPO_PUBLIC_API_URL;
const configuredMobileRedirectBase = process.env.EXPO_PUBLIC_MOBILE_REDIRECT_BASE ?? process.env.EXPO_PUBLIC_APP_URL;
const showDemoLogins = process.env.SHOW_DEMO_LOGINS === "true";

export default ({ config }: ConfigContext): ExpoConfig => ({
  name: "Shoeinn",
  slug: "shoeinn",
  scheme: "shoeinn",
  version: "1.0.0",
  orientation: "portrait",
  platforms: ["ios", "android", "web"],
  updates: {
    checkAutomatically: "ON_ERROR_RECOVERY",
    fallbackToCacheTimeout: 0,
  },
  extra: {
    ...config.extra,
    ...(configuredApiUrl ? { API_BASE_URL: configuredApiUrl, API_URL: configuredApiUrl } : {}),
    ...(configuredMobileRedirectBase ? { MOBILE_REDIRECT_BASE: configuredMobileRedirectBase } : {}),
    SHOW_DEMO_LOGINS: showDemoLogins,
    eas: {
        "projectId": "1a753a1a-ae23-47e9-ba06-cc6148fb36ee"
      }
  },
});
