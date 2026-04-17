# Fix Dev Seed Reset Demo Company Id Scope

## Summary

`POST /dev/seed?reset=true` currently fails because the reset cleanup path references `demo_company_ids` before it has been initialized.

## Goal

- Restore working `reset=true` behavior in the active `apps/api/app/routers/dev_seed.py` seed path.
- Keep the recent notification cleanup behavior intact.
- Keep the current seeded Alabama city and address realism intact.

## Scope

- Narrow fix in the active `/dev/seed` reset logic only.
