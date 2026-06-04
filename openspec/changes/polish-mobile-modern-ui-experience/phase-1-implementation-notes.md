## Phase 1 Implementation Notes

Phase 1 establishes the mobile visual foundation only. It does not redesign individual screens, change API calls, or alter booking, payment, websocket, notification, provider, or admin business logic.

Active route boundary for later migration:

- Auth entry: `src/screens/auth/LoginScreen.tsx`
- Customer marketplace: `src/screens/home/*`
- Customer appointments and notifications: `src/screens/appointments/*`, `src/screens/customer/AppointmentDetailScreen.tsx`, `src/screens/customer/CustomerNotificationsScreen.tsx`
- Provider operations: `src/screens/provider/*`
- Company admin operations: `src/screens/owner/*`
- Shared shell/navigation: `src/components/*`, `src/components/ui/*`, `src/navigation/RootTabs.tsx`

Legacy or duplicate screens should only be migrated after the active `RootTabs` paths are complete, or when shared component changes naturally cover them.
