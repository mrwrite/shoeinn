## 1. Investigation

- [x] 1.1 Inspect RootTabs and nested Appointments stack behavior.
- [x] 1.2 Inspect payment return, booking success, notification, and deep-link navigation into appointment detail.
- [x] 1.3 Confirm customer appointment list query refresh/invalidation paths remain aligned.
- [x] 1.4 Identify the source of the Appointments tab badge/count.

## 2. Navigation Fix

- [x] 2.1 Add tab press handling so tapping Appointments returns to the appointment list route.
- [x] 2.2 Preserve explicit navigation to appointment detail from payment return, notifications/deep links, and list cards.
- [x] 2.3 Verify repeated Appointments tab taps return from detail to list without logout/login.

## 3. Badge Fix

- [x] 3.1 Remove notification unread count from the Appointments tab badge.
- [x] 3.2 Keep notification unread count on notification/bell surfaces only.

## 4. Validation

- [x] 4.1 Run mobile typecheck.
- [x] 4.2 Validate OpenSpec change.
- [x] 4.3 Summarize root cause, files changed, final tab behavior, badge behavior, and validation results.
