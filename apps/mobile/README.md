# ShoeInn Mobile

## Expo Go local development

For a physical phone in Expo Go, the app must be able to reach both:

1. the Expo Metro server on your computer
2. the ShoeInn API on your computer

Recommended setup:

```bash
npx expo start --tunnel
```

If you want to use LAN instead, make sure your phone and computer are on the same Wi-Fi network and set:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_COMPUTER_LAN_IP:8000
EXPO_PUBLIC_MOBILE_REDIRECT_BASE=exp://YOUR_COMPUTER_LAN_IP:8081/--
```

For a dev build or standalone app, use a custom scheme redirect base instead:

```bash
EXPO_PUBLIC_MOBILE_REDIRECT_BASE=shoeinn://app
```

The mobile app now auto-detects the Expo host for local development when `EXPO_PUBLIC_API_BASE_URL` is not set, but explicit LAN configuration is still the safest option for demos.

## Google Maps Directions API key

The travel tracking card uses the Google Directions API to render the route polyline, ETA, and distance.

1. Create a key in the Google Cloud console with the **Directions API** enabled.
2. Add the key to your environment:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-key-here
```

3. Restart the Expo dev server so the env var is available.

### Optional platform notes

- **iOS**: The app uses the default Apple Maps renderer in `react-native-maps`. If you want
  to use Google Maps tiles on iOS, add `ios.config.googleMapsApiKey` to `app.config.ts`
  and rebuild the dev client.
- **Android**: Ensure Google Play services are available on your test device or emulator
  for map tiles to load correctly.
