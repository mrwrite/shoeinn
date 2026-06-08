# ShoeInn Mobile

Expo React Native app for customer booking, provider job handling, company admin operations, live appointment updates, notifications, maps, and payment return flows.

## Requirements

- Node.js 20 LTS recommended
- npm
- Expo CLI via `npx expo`
- Expo Go for quick local testing
- Android Studio and an Android emulator, or a physical Android device
- Xcode/iOS Simulator on macOS, or a physical iPhone through Expo Go/development builds
- EAS CLI for preview/development/production builds: `npm install -g eas-cli`

Current app stack:

- Expo SDK `~54.0.35`
- React Native `0.81.5`
- React `19.1.0`

## Install and Validate

```bash
cd apps/mobile
npm install
npm run typecheck
npm test -- --runInBand
```

Start Expo:

```bash
npx expo start
```

Equivalent npm script:

```bash
npm start
```

## API URL Configuration

Set both API URL variables for compatibility:

```bash
EXPO_PUBLIC_API_BASE_URL=http://YOUR_API_HOST:8000
EXPO_PUBLIC_API_URL=http://YOUR_API_HOST:8000
```

Common values:

- Windows host or iOS Simulator: `http://localhost:8000`
- Android emulator: `http://10.0.2.2:8000`
- Physical phone on LAN: `http://<YOUR-LAN-IP>:8000`

Expo tunnel helps the phone reach Metro, but it does not expose the backend API. Physical devices still need a reachable API URL.

Windows PowerShell example:

```powershell
$env:EXPO_PUBLIC_API_BASE_URL="http://192.168.1.14:8000"
$env:EXPO_PUBLIC_API_URL=$env:EXPO_PUBLIC_API_BASE_URL
npx expo start --tunnel
```

The helper script sets these values and checks the API:

```powershell
.\scripts\start-mobile.ps1 -ApiBaseUrl "http://<YOUR-LAN-IP>:8000"
```

## Demo Logins and Markets

Demo login buttons are shown when:

```bash
EXPO_PUBLIC_ENABLE_DEMO_LOGINS=true
```

Select the visible demo market:

```bash
EXPO_PUBLIC_DEMO_MARKET=shelby
# or
EXPO_PUBLIC_DEMO_MARKET=mt_juliet
```

Shelby County demo accounts use `Password1!`:

- Customer: `customer@shoeinn.com`
- Provider: `pelham.driver1@shoeinn.com`
- Company admin: `pelham.admin@shoeinn.com`

Mt. Juliet demo accounts use `Password123!`:

- Customer: `customer.mtjuliet@shoeinn.demo`
- Provider: `provider.mtjuliet@shoeinn.demo`
- Company admin: `admin.mtjuliet@shoeinn.demo`

Seed data from the API before logging in:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true&demo_market=mt_juliet"
```

## Maps

Travel tracking cards use `react-native-maps` and optionally the Google Directions API for route polylines, ETA, and distance:

```bash
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-google-directions-api-key
```

Platform notes:

- Android needs Google Play services for map tiles on test devices/emulators.
- iOS uses the default Apple Maps renderer unless a Google Maps key is configured in `app.config.ts` and the app is rebuilt.
- Without a Directions API key, map cards can still show markers and fallback copy, but route line/ETA/distance are unavailable.

## Payment Redirects

For mock payment mode, no Stripe redirect setup is required.

For service payment mode with Stripe Checkout, configure the app return base:

```bash
EXPO_PUBLIC_MOBILE_REDIRECT_BASE=shoeinn://app
```

For Expo Go return-flow testing:

```bash
EXPO_PUBLIC_MOBILE_REDIRECT_BASE=exp://<YOUR-LAN-IP>:8081/--
```

The API must also be configured with a matching `PAYMENT_MOBILE_REDIRECT_BASE` or `PAYMENT_RETURN_APP_URL`.

## EAS Builds

The checked-in `eas.json` defines:

- `development`: internal development client
- `preview`: internal Android APK preview with demo logins enabled
- `production`: production profile with demo logins disabled

Commands:

```bash
cd apps/mobile
npx eas build --profile development --platform android
npx eas build --profile preview --platform android
npx eas build --profile preview --platform ios
npx eas build --profile production --platform all
```

The repository uses Expo project id `1a753a1a-ae23-47e9-ba06-cc6148fb36ee` in `app.config.ts`.

## Troubleshooting

- API unreachable on Android emulator: use `http://10.0.2.2:8000`.
- API unreachable on physical phone: use LAN IP, bind API to `0.0.0.0`, and allow Windows Firewall inbound traffic.
- Maps blank: verify Google Play services on Android and rebuild if native map config changed.
- Stripe Checkout returns to nowhere: verify `EXPO_PUBLIC_MOBILE_REDIRECT_BASE` and API payment redirect env values.
- Push warning about missing project id: run EAS setup and confirm `extra.eas.projectId` remains configured.

More details: [docs/troubleshooting.md](../../docs/troubleshooting.md).
