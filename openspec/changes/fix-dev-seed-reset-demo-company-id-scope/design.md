# Design

## Root Cause

The reset path executes notification cleanup using `demo_company_ids` before `demo_companies` and `demo_company_ids` are computed. That raises `UnboundLocalError` before the seed flow can proceed.

## Fix

- Compute `demo_users`, `demo_user_ids`, `demo_companies`, and `demo_company_ids` first inside the `reset` block.
- Run notification child cleanup only after `demo_company_ids` exists.
- Keep the cleanup ordering intact so child rows are removed before parent notifications and related demo entities.
- Remove unrelated drift from the file only if it directly supports the narrow fix.
