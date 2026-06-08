# Troubleshooting

## API and Database

### `password authentication failed for user`

The Postgres Docker volume was probably created with older credentials.

```powershell
cd .\apps\api
docker compose down -v
docker compose up -d
python -m alembic upgrade head
```

### Alembic migration fails

- Confirm `DATABASE_URL` points at the intended database.
- Use `localhost` when API/Alembic runs on the host.
- Use `db` only inside Docker Compose.
- Check `docker compose ps` and `docker compose logs db`.

### `/ready` fails but `/health` passes

`/health` only checks process liveness. `/ready` checks database, migrations, notification table, and payment mode. Inspect the JSON response and fix the failing dependency.

## Mobile and Expo

### Mobile cannot reach API

- Android emulator: `http://10.0.2.2:8000`.
- iOS simulator or host browser: `http://localhost:8000`.
- Physical phone: `http://<YOUR-LAN-IP>:8000`.
- Confirm API uses `--host 0.0.0.0`.
- Allow inbound Windows Firewall traffic for the API port.

### Expo build or Metro failures

```powershell
cd .\apps\mobile
npm install
npx expo start -c
```

If native config changed, rebuild the dev client instead of relying on Expo Go.

### EAS device registration issues

- Run `npx eas device:create`.
- Confirm the device is included in the internal distribution profile.
- Rebuild the `development` or `preview` profile after registering devices.

### iOS certificate or provisioning issues

- Run `npx eas credentials`.
- Regenerate credentials only if the existing profile/certificate is invalid.
- Make sure the bundle identifier remains `com.mrwrite.shoeinn`.

## Maps

### Map tiles blank

- Android: use an emulator/device with Google Play services.
- iOS: rebuild after changing native Google Maps config.
- Confirm `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` is present before Expo starts.

### Route, ETA, or distance missing

Markers can render without Directions API. Route line/ETA/distance require `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` with Directions API enabled.

## Payments

### Stripe Checkout does not open

- API must be in `PAYMENT_MODE=service`.
- `PAYMENT_SERVICE_BASE_URL` must point at a healthy payment service.
- `PAYMENT_MOBILE_REDIRECT_BASE` or `PAYMENT_RETURN_APP_URL` must be non-placeholder.

### Payment service unavailable

```powershell
Invoke-RestMethod http://localhost:8001/health
```

If it fails, check `apps/payment/.env` for `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET`, then restart:

```powershell
.\scripts\start-payment.ps1
```

### Stripe webhook not updating booking

- Run `stripe listen --forward-to http://localhost:8001/payments/webhooks/stripe`.
- Copy the emitted `whsec_...` into `STRIPE_WEBHOOK_SECRET`.
- Set `BOOKING_API_WEBHOOK_URL=http://localhost:8000/webhooks/payments`.
- Use the appointment detail "Check payment status" action as a manual reconciliation fallback.

## Demo Data

### Stale or mixed demo records

Reseed with reset:

```powershell
Invoke-RestMethod -Method Post "http://localhost:8000/dev/seed?reset=true&demo_market=mt_juliet"
```

`reset=true` clears known demo markets before creating the selected market.

## Live Updates and Notifications

### WebSocket/live updates do not appear

- Confirm the API is reachable from the mobile device.
- Confirm the logged-in role is customer, provider, company, or company admin.
- Staging currently supports single API instance live updates only.

### Notifications do not send

- Start the notification worker if validating queued delivery:

```powershell
cd .\apps\api
.\.venv\Scripts\Activate.ps1
python -m app.workers.notification_worker
```

- Check `notification_outbox.status`.
- Confirm mobile push tokens were registered through the app.
