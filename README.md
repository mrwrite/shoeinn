# ShoeInn 👟
**Sneaker Care Scheduling & Notification Platform**

ShoeInn is a full-stack appointment scheduling platform designed for sneaker care businesses. It supports customer bookings, provider workflows, and multi-channel notifications including **in-app**, **email**, and **push notifications**.

---

## 🧱 Tech Stack

### Backend (API)
- FastAPI
- PostgreSQL
- SQLAlchemy
- Alembic
- JWT Authentication
- Background workers (notification outbox pattern)

### Mobile App
- Expo (React Native)
- Expo Notifications
- EAS (Expo Application Services)

---

## ✨ Core Features

### 👤 Authentication
- Email + password login
- JWT access & refresh tokens
- Role-based access control:
  - Customer
  - Provider
  - Admin

### 📅 Appointments
- Customers can:
  - Create appointment holds
  - Confirm appointments
  - View appointment history and status
- Providers can:
  - View open appointments
  - Update appointment status
  - Receive notifications on changes

### 🏢 Companies
- Providers belong to companies
- Appointments are scoped to companies
- Admin users can:
  - Create companies
  - Manage company users
  - Assign provider roles

---

## 🔔 Notifications System

ShoeInn uses a **reliable outbox-based notification system** to guarantee delivery and avoid race conditions.

### Supported Channels
- In-app
- Email
- Push (Expo)

### Notification Types
- `NEW_APPOINTMENT`
- `APPOINTMENT_CONFIRMED`
- `APPOINTMENT_STATUS_CHANGED`

---

## 📤 Notification Outbox Pattern

Notifications are processed in three distinct steps:

1. Business logic creates a notification record
2. A corresponding outbox entry is created
3. A background worker delivers the notification

### Benefits
- Guaranteed delivery
- Retry support
- Dead-letter handling
- Decoupled business logic

---

## 🔁 Notification Worker

The notification worker is responsible for dispatching queued notifications.

### Run the worker manually

```bash
python -m app.workers.notification_worker
```

---

## 🧠 Worker Responsibilities

- Fetch pending outbox records
- Lock records to prevent duplicate processing
- Dispatch notifications by channel (email, push, in-app)
- Mark records as completed or failed
- Retry failed deliveries
- Move unrecoverable failures to dead-letter state

---

## 📲 Push Notifications (Expo)

Push notifications are delivered using **Expo Push Notifications**.

### Who receives push notifications
- Customers receive appointment confirmations and status updates
- Providers receive new appointment and status change alerts

---

## 🔧 Push Notification Setup

### Install EAS CLI

```bash
npm install -g eas-cli
```

### Initialize EAS

```bash
cd apps/mobile
eas init
```

### Configure `app.json`

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

### Register Push Token (Mobile)

```ts
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

const token = await Notifications.getExpoPushTokenAsync({
  projectId: Constants.expoConfig?.extra?.eas?.projectId,
});
```

---

## 📁 Project Structure

```
shoeinn/
├── apps/
│   ├── api/
│   │   ├── app/
│   │   │   ├── models/
│   │   │   ├── routers/
│   │   │   ├── services/
│   │   │   ├── workers/
│   │   │   └── utils/
│   │   ├── alembic/
│   │   ├── main.py
│   │   └── requirements.txt
│   └── mobile/
│       ├── app.json
│       ├── eas.json
│       ├── src/
│       └── package.json
```

---

## 🚀 Getting Started (Local Development)

### Backend Setup

```bash
cd apps/api
python -m venv .venv
```

Activate the virtual environment:

```bash
# macOS / Linux
source .venv/bin/activate

# Windows
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Create `.env`:

```
DATABASE_URL=postgresql://user:password@localhost:5432/shoeinn
JWT_SECRET=your-secret-key
```

Run migrations:

```bash
alembic upgrade head
```

Start the API:

```bash
make dev
```

or

```bash
python -m uvicorn app.main:app --reload
```

---

## 📱 Mobile App Setup

```bash
cd apps/mobile
npm install
$env:EXPO_PUBLIC_API_URL="http://192.168.1.131:8000"; npm start -- --tunnel
```

> Push notifications require a physical device.

---

## 🗄 Database Overview

### notifications
- Stores logical notification records
- Tracks user-visible notification state

### notification_outbox
- Asynchronous delivery queue
- Processed by notification worker

### push_tokens
- Stores Expo push tokens
- One user can have multiple devices

---

## 🧪 Troubleshooting

### Push warning: `No projectId found`
- Run `eas init`
- Ensure `extra.eas.projectId` exists in `app.json`

### SQLAlchemy error: `failed to locate a name ('RefreshToken')`
- Ensure all models are imported in `app/models/__init__.py`
- Or remove unused relationships

### Notifications not sending
- Ensure the notification worker is running
- Check `notification_outbox.status`
- Verify push tokens exist for users

---

## 🛣 Roadmap

- Admin notification dashboard
- Notification preferences per user
- SMS notifications
- Delivery analytics
- Provider availability scheduling

---

## 📄 License

MIT

## UI Redesign (Peacock Theme)
- Location: `apps/mobile`
- Run: `cd apps/mobile && npm install && npm start`
- Screens included: Customer Home, Service Detail, Booking Date/Time/Confirm, Provider Dashboard, Provider Appointment Detail.
- Design system: Peacock color palette, reusable components (headers, search, chips, cards, buttons) with safe area support and sticky CTAs.

## Local Development (Windows PowerShell)

This repo is a monorepo. Do not try to run it from the repository root as a single app.

Active runtime surfaces:

- `apps/api` - main FastAPI backend
- `apps/mobile` - Expo mobile app
- `apps/payment` - optional payment service for payment-specific flows

### Startup order

1. Start Postgres from `apps/api`
2. Start the backend API from `apps/api`
3. Seed demo data
4. Start the mobile app from `apps/mobile`
5. Start the notification worker only if you need queued delivery validation

### Postgres

`apps/api/docker-compose.yml` only starts Postgres.

```powershell
cd .\apps\api
docker compose up -d
```

If your Docker install only supports the older command, use `docker-compose up -d`.

### Backend (`apps/api`)

Create and activate a Windows virtual environment:

```powershell
cd .\apps\api
py -3.11 -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install -r ..\..\requirements.txt
pip install -e .
```

Create `.env` from `.env.example`:

```powershell
Copy-Item .env.example .env
```

If the API runs on the Windows host and Postgres runs in Docker, change `DATABASE_URL` to use `localhost` instead of `db`:

```env
DATABASE_URL=postgresql+psycopg://postgres:postgres@localhost:5432/shoeinn
JWT_SECRET=changeme
ALLOWED_ORIGINS=*
```

Run migrations:

```powershell
python -m alembic upgrade head
```

Start the API:

```powershell
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Seed demo data:

```powershell
Invoke-RestMethod -Method Post http://localhost:8000/dev/seed
```

### Optional notification worker

The API does not start the notification worker automatically. Start it only if you need queued email/push/sms delivery validation:

```powershell
cd .\apps\api
.\.venv\Scripts\Activate.ps1
python -m app.workers.notification_worker
```

### Mobile (`apps/mobile`)

Install dependencies:

```powershell
cd .\apps\mobile
npm install
```

Set `EXPO_PUBLIC_API_URL` before starting Expo. The active mobile API client depends on this value.

Android emulator:

```powershell
$env:EXPO_PUBLIC_API_URL="http://10.0.2.2:8000"
npm start
```

iOS simulator:

```powershell
$env:EXPO_PUBLIC_API_URL="http://localhost:8000"
npm start
```

Physical device on the same LAN:

```powershell
$env:EXPO_PUBLIC_API_URL="http://<YOUR-LAN-IP>:8000"
npm start
```

Use Expo tunnel only for Metro connectivity if needed. It does not make your backend reachable from the device.

### Optional payment service (`apps/payment`)

`apps/payment` is optional for most local development flows, including provider appointment claiming and assignment.

- If `PAYMENT_SERVICE_BASE_URL` is unset, the main API uses stub payment behavior.
- The payment sync worker only starts when `PAYMENT_SERVICE_BASE_URL` is configured.
- See `apps/payment/README.md` for the current minimum local startup notes.

## Local Validation Checklist

Use this checklist for provider appointment claiming and assignment validation:

1. Start Postgres from `apps/api/docker-compose.yml`
2. Activate the backend venv and install dependencies
3. Run `python -m alembic upgrade head`
4. Start the API with `python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`
5. Seed demo data with `POST /dev/seed`
6. Run focused backend tests:

```powershell
cd .\apps\api
.\venv\Scripts\python.exe -m pytest tests\test_assignment_claiming.py -q
```

7. Start the mobile app with the correct `EXPO_PUBLIC_API_URL`
8. Validate that:
   - a provider can claim a confirmed appointment
   - a duplicate claim returns `409`
   - a company admin can reassign an active appointment
   - terminal appointments cannot be reassigned
   - customer detail shows the assigned provider
   - customer detail keeps the status timeline visible
