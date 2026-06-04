# Polish Mobile Luxury Care UI QA Checklist

## Automated Validation

- [x] `apps/mobile` typecheck passed
- [x] `apps/mobile` test suite passed
- [x] `openspec validate polish-mobile-luxury-care-ui --strict` passed
- [x] API tests were not required because this change stayed mobile-only and did not alter API-facing contracts

## Customer Smoke Test

- [ ] Demo login
- [ ] Customer home/discovery
- [ ] Category filtering
- [ ] Provider menu
- [ ] Service detail
- [ ] Booking date/time/details/review/pay
- [ ] Payment result
- [ ] Appointment list/detail/tracking
- [ ] Notifications
- [ ] Profile/rewards
- [ ] Bottom tabs
- [ ] Empty/loading/error states
- [ ] Category-neutral copy
- [ ] Visual alignment with design board
- [ ] Regression check for existing shoe-care booking
- [ ] Regression check for non-shoe booking

## Provider Smoke Test

- [ ] Provider login
- [ ] Provider dashboard
- [ ] Provider appointment detail
- [ ] Status updates
- [ ] Ready photo/upload flow
- [ ] Notifications/live updates
- [ ] Empty/loading/error states

## Company Admin Smoke Test

- [ ] Admin login
- [ ] Owner dashboard
- [ ] Owner appointment detail
- [ ] Assignment flow
- [ ] Status and payment context
- [ ] Empty/loading/error states

## Notes

- Manual device QA was not performed from the shell environment.
- The remaining unchecked items are intentionally left for interactive review on a device or emulator.
- No backend, booking, payment, or assignment contracts were changed in this phase.
- Deferred follow-up items: image asset upgrades for some media placeholders, final device-level spacing review, and any copy tweaks discovered during manual review.
