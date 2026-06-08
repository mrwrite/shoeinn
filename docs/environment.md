# Environment Variable Reference

Do not commit real secrets. Use `.env.example` and `.env.staging.example` files as templates.

## API

Read by `apps/api/app/core/config.py`.

| Variable | Required | Default | Example | Description |
| --- | --- | --- | --- | --- |
| `DATABASE_URL` | Yes for Postgres | `sqlite:///./dev.db` | `postgresql+psycopg://postgres:postgres@localhost:5432/shoeinn` | API database connection. Use `localhost` for host-run API, `db` in Compose. |
| `API_HOST` | No | `0.0.0.0` | `0.0.0.0` | Host Uvicorn binds to in scripts/docs. |
| `API_PORT` | No | `8000` | `8000` | API port. |
| `JWT_SECRET` | Yes outside local | `changeme` | `replace-me` | JWT signing secret. Replace for staging/production. |
| `ALLOWED_ORIGINS` | No | `*` | `https://app.example.com` | Comma-separated CORS origins. |
| `ACCESS_TOKEN_TTL_MINUTES` | No | `15` | `15` | Access token lifetime. |
| `REFRESH_TOKEN_TTL_DAYS` | No | `30` | `30` | Refresh token lifetime. |
| `APPOINTMENT_HOLD_MINUTES` | No | `15` | `15` | Booking hold duration. |
| `HOLD_CLEANUP_INTERVAL_SECONDS` | No | `60` | `60` | Reserved for future scheduled hold cleanup. |
| `NOTIFICATION_DISPATCH_INTERVAL_SECONDS` | No | `5` | `5` | Notification dispatcher polling interval. |
| `NOTIFICATION_MAX_ATTEMPTS` | No | `5` | `5` | Max notification delivery attempts. |
| `NOTIFICATION_BACKOFF_SECONDS` | No | `30` | `30` | Retry backoff. |
| `ENABLE_NOTIFICATION_DISPATCHER` | No | `true` | `false` | In-process notification dispatcher toggle. Use `false` when a separate worker drains notifications. |
| `DB_AUTO_CREATE` | No | `false` | `false` | Auto-create DB schema outside migrations. Keep false for normal API runs. |
| `PAYMENT_MODE` | No | `mock` | `mock` or `service` | Mock mode for local demos, service mode for Stripe payment service. |
| `PAYMENT_SERVICE_BASE_URL` | Required for service mode | blank | `http://localhost:8001` | Payment service base URL. |
| `PAYMENT_CHECKOUT_SUCCESS_URL` / `PAYMENT_SUCCESS_URL` | Optional | blank | `https://api.example.com/payments/return/success` | Browser success return URL alias. |
| `PAYMENT_CHECKOUT_CANCEL_URL` / `PAYMENT_CANCEL_URL` | Optional | blank | `https://api.example.com/payments/return/cancel` | Browser cancel return URL alias. |
| `PAYMENT_MOBILE_REDIRECT_BASE` | Required for service mobile return path | blank | `shoeinn://app` | Mobile/frontend redirect base. Aliases: `PAYMENT_SUCCESS_URL_BASE`, `PAYMENT_RETURN_APP_URL`. |
| `PAYMENT_SERVICE_TIMEOUT_SECONDS` | No | `10.0` | `10` | Timeout for payment-service calls. |
| `PAYMENT_CURRENCY` | No | `usd` | `usd` | Default payment currency. |
| `ENABLE_PAYMENT_SYNC_WORKER` | No | `true` | `true` | Starts payment sync worker when service mode is configured. |
| `PAYMENT_SYNC_INTERVAL_SECONDS` | No | `5` | `5` | Payment sync polling interval. |

## Mobile

Read by `apps/mobile/app.config.ts`, `src/api/http.ts`, `src/api/services.ts`, demo login helpers, and map cards.

| Variable | Required | Default | Example | Description |
| --- | --- | --- | --- | --- |
| `EXPO_PUBLIC_API_BASE_URL` | Recommended | auto-detected in some local paths | `http://192.168.1.14:8000` | Primary API base URL. |
| `EXPO_PUBLIC_API_URL` | Recommended compatibility | none | `http://192.168.1.14:8000` | Compatibility API URL used by some helpers and EAS config. |
| `EXPO_PUBLIC_APP_ENV` | No | none | `staging` | Build/environment label. |
| `EXPO_PUBLIC_ENABLE_DEMO_LOGINS` | No | `false` | `true` | Show demo login buttons. |
| `SHOW_DEMO_LOGINS` | No | `false` | `true` | Non-public fallback read by app config. |
| `EXPO_PUBLIC_DEMO_MARKET` | No | `shelby` | `mt_juliet` | Demo login/market selector. |
| `EXPO_PUBLIC_GOOGLE_MAPS_API_KEY` | Optional | none | `AIza...` | Enables Google Directions API route line, ETA, distance, and native map API keys. |
| `EXPO_PUBLIC_MOBILE_REDIRECT_BASE` | Required for service payment return | none | `shoeinn://app` | Mobile return base for Stripe Checkout. |
| `EXPO_PUBLIC_APP_URL` | Optional alias | none | `shoeinn://app` | Alias for mobile redirect base. |

## Payment Service

Read by `apps/payment/app/config.py`.

| Variable | Required | Default | Example | Description |
| --- | --- | --- | --- | --- |
| `ENVIRONMENT` | No | `development` | `staging` | Payment service environment label. |
| `DATABASE_URL` | No | `sqlite:///./payment.db` | `sqlite:///./payment.db` | Payment service database. |
| `STRIPE_API_KEY` | Yes | none | `sk_test_...` | Stripe secret API key. |
| `STRIPE_WEBHOOK_SECRET` | Yes | none | `whsec_...` | Stripe webhook signing secret. |
| `TENANT_ID` | No | `public` | `public` | Tenant identifier stored with payments. |
| `PAYMENT_EVENT_TOPIC` | No | `payments` | `payments` | Logical outbox topic for future publishers. |
| `BOOKING_API_WEBHOOK_URL` | No | none | `http://localhost:8000/webhooks/payments` | Optional callback to booking API after payment state changes. |
| `BOOKING_API_WEBHOOK_SECRET` | No | none | `replace-me` | Optional callback header secret. |
| `DEFAULT_CURRENCY` | No | `usd` | `usd` | Payment default currency. |
| `PAYMENT_ALLOW_TEST_CLOCK` | No | `true` | `true` | Allows Stripe test clock behavior in non-production testing. |

