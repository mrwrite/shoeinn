# Owner Demo Command Center And Demo Hardening

## Executive Assessment

### Is the app currently demoable?

Yes, but only narrowly. The repo supports a credible guided demo of the customer booking flow, provider claim-and-status flow, customer notification inbox, and live update story through the active `AuthGate -> RootTabs` mobile path plus the FastAPI backend in `apps/api`.

### Is it convincing enough yet for cleaner-owner conversations?

Not yet. The product can show operational mechanics, but it does not yet give a cleaner owner a strong owner-facing control surface that answers the business question: "How would I run my pickup-and-delivery operation with this?"

### Top risks to showing it now

- The strongest owner persona flow is missing or fragmented. `RootTabs` routes `company_admin` users into the same provider-style jobs tab, while `AdminStack` and `src/screens/admin/*` are placeholders and `CompanyStack` is inactive.
- Demo setup still depends on manual staging: local API URL selection, LAN reachability, `POST /dev/seed`, optional worker startup, push on physical hardware, and camera permissions for ready-photo capture.
- Seed data is not locally relevant to Helena/Pelham demos. The current `/dev/seed` creates Austin/Denver companies instead of cleaner-facing Alabama examples.
- The app still exposes legacy or duplicate mobile surfaces, increasing the risk of confusion during final prep and future work.
- Payment messaging is ambiguous in a live demo. The booking UI says payment is processed after confirmation while the local stub immediately succeeds when the payment service is unset.

## Summary

This change defines the highest-impact work needed before serious local cleaner outreach: create a cleaner-owner demo command center in the active app flow and harden the demo package around seeded local scenarios, operator clarity, and low-friction reliability.

The repo already demonstrates meaningful value in booking, assignment, notifications, and live updates. What it does not yet demonstrate well is owner control, dispatch oversight, and business trust. That gap matters more for an on-site cleaner demo than additional customer-side polish.

## Problem

The current product is strongest when shown as a consumer and provider workflow. Cleaner owners, however, are evaluating whether ShoeInn can help them run their business. Today the repo does not provide a polished owner-facing control path that clearly shows:

- incoming work across statuses,
- who is assigned to what,
- the ability to intervene or reassign work,
- team visibility,
- local-business framing and demo data,
- and a repeatable demo setup that avoids awkward operational hiccups.

Because of that, the product risks feeling like a capable prototype instead of a shop-ready operational tool.

## Goals

- Make the active app support a convincing cleaner-owner demo flow.
- Give `company_admin` users a clear owner dashboard instead of a provider-only experience.
- Show dispatch oversight, assignment state, reassignment control, and team visibility in one coherent path.
- Package the app with local-demo seed data and staging steps suitable for Helena/Pelham owner conversations.
- Reduce manual demo failure points and dev-oriented moments.
- Keep implementation focused on active surfaces, not legacy stacks.

## Non-Goals

- Building full production-grade analytics, invoicing, CRM, or route optimization.
- Replacing the existing customer or provider flows that already support the demo story.
- Implementing a separate web admin product.
- Expanding placeholder global-admin flows before company-owner flows are credible.

## Prioritized Gap Backlog

### P0: Must fix before serious owner demos

#### 1. Active cleaner-owner command center is missing

- Why it matters: Owners need to see how they would manage jobs, not just how a driver/provider would work a queue.
- Impact: Very high
- Difficulty: Medium
- Recommended timing: Next

#### 2. Demo seed package is not locally relevant or narrative-ready

- Why it matters: Austin/Denver sample companies weaken local credibility and force explanation overhead during Helena/Pelham demos.
- Impact: High
- Difficulty: Low to medium
- Recommended timing: Next, in the same change set

#### 3. Demo setup still has too many fragile manual steps

- Why it matters: Local device connectivity, seeding, optional worker behavior, and hardware-only push/photo paths can produce avoidable live-demo failures.
- Impact: High
- Difficulty: Medium
- Recommended timing: Next

#### 4. Payment behavior and messaging are not demo-clean

- Why it matters: Cleaner owners will ask what happens at booking and payment. The current stub-versus-UI story can sound improvised.
- Impact: High
- Difficulty: Low to medium
- Recommended timing: Before owner demos

### P1: Very important for a strong demo

#### 5. Company-admin oversight needs clearer job segmentation and intervention cues

- Why it matters: Owners should quickly understand unassigned, assigned, in-progress, and at-risk work.
- Impact: High
- Difficulty: Medium
- Recommended timing: Immediately after or within the owner command center change

#### 6. Team management is too bare to sell operational readiness

- Why it matters: Owners want to know they can add staff, see staff, and understand assignment ownership.
- Impact: Medium to high
- Difficulty: Medium
- Recommended timing: Same wave as owner command center if scope permits

#### 7. Customer booking trust cues are still light

- Why it matters: Cleaner owners judge the customer experience because it reflects on their brand.
- Impact: Medium
- Difficulty: Medium
- Recommended timing: After owner flow is stabilized

### P2: Valuable but can wait

#### 8. Cross-role demo script tooling and reset shortcuts

- Why it matters: Faster role switching improves repeat demos but is not the main sales blocker.
- Impact: Medium
- Difficulty: Low
- Recommended timing: After P0/P1

#### 9. Better owner-facing reporting and outcome summaries

- Why it matters: Metrics help sell the vision, but first the operational loop must feel real.
- Impact: Medium
- Difficulty: Medium
- Recommended timing: Later

### P3: Later polish or scale items

#### 10. Global admin CRUD completion

- Why it matters: Useful for platform operations, but not crucial to landing the first local cleaner.
- Impact: Low for near-term demos
- Difficulty: Medium
- Recommended timing: Later

#### 11. Broader notification channel expansion and retention tuning

- Why it matters: Helpful long term, but not the highest-risk blocker for initial demos.
- Impact: Low to medium
- Difficulty: Medium
- Recommended timing: Later

## Recommended Next Crucial Development

Build an active `company_admin` owner demo command center and ship it with local-demo seeding plus demo hardening.

This is the single highest-impact next change because it closes the biggest persuasion gap in the current product. Customer and provider mechanics already exist and test reasonably well. What is missing is the owner-facing moment where a cleaner can immediately see incoming demand, assignment coverage, job progress, and their ability to manage the day.

## Scope

### In scope

- Active mobile owner flow for `company_admin`
- Dispatch-style company dashboard
- Clear job segmentation and assignment visibility
- Reassignment entry points and team visibility
- Helena/Pelham-oriented demo seed data and scriptability
- Demo hardening around setup, validation, and messaging

### Out of scope

- New backend platform architecture
- Web admin rebuild
- Large customer UX redesign beyond demo-critical trust fixes

## Impact

- Stronger owner confidence during in-person demos
- Cleaner narrative: customer books, owner sees work, provider claims or gets assigned, customer receives updates
- Lower demo embarrassment risk
- Better prioritization for the next implementation wave
