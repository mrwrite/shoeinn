# ShoeInn Mobile

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
