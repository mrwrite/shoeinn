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
npx expo start -c
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
