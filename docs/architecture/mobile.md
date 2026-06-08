# Mobile Architecture

The mobile app lives in `apps/mobile` and is an Expo React Native app.

## Core Areas

- `src/navigation` - root tabs, auth gate, customer/company/admin stacks.
- `src/screens/home` - modern marketplace discovery, provider menu, service detail, booking flow, review/pay.
- `src/screens/customer` - legacy and customer-specific appointments, notifications, payment result, booking surfaces.
- `src/screens/provider` - provider dashboard and appointment detail.
- `src/screens/owner` - company owner/admin dashboard and appointment detail.
- `src/components/ui` - shared design primitives such as `AppScreen`, `Button`, `Card`, `StatusBadge`, `SectionHeader`, `BookingStepper`, loading/empty states, and media placeholders.
- `src/api` - HTTP client and service adapters.
- `src/auth` - demo login metadata.
- `src/hooks` - live events, push notifications, focused refresh, city/state helpers.
- `src/state` - Zustand stores for auth, booking, and company state.

## Runtime Configuration

Important variables:

- `EXPO_PUBLIC_API_BASE_URL`
- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_ENABLE_DEMO_LOGINS`
- `EXPO_PUBLIC_DEMO_MARKET`
- `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY`
- `EXPO_PUBLIC_MOBILE_REDIRECT_BASE`

See [environment.md](../environment.md).

## Development

```bash
cd apps/mobile
npm install
npm run typecheck
npm test -- --runInBand
npx expo start
```

For Android emulator, set API URL to `http://10.0.2.2:8000`.

For a physical phone, use the computer LAN IP and make sure the API is reachable from the phone.

## Builds

`eas.json` contains `development`, `preview`, and `production` profiles. Preview Android builds use APK output and demo logins are enabled in the checked-in profile.

```bash
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios
```

## UI Architecture Notes

The current modern UI is tokenized through `src/theme/theme.ts` and shared primitives under `src/components/ui`. Prefer those components for new screens and fixes.

Avoid fixed-width row layouts for narrow phones unless the content has an explicit wrap/stack fallback.

