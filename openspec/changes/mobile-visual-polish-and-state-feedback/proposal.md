# Mobile Visual Polish And State Feedback

## Summary

Apply a focused polish pass to the active mobile provider and customer flows so they feel more like a deliberate product surface and less like a collection of functional screens. This change improves visual hierarchy, state feedback, progress emphasis, and action clarity while preserving the current RootTabs-based flow and existing API behavior.

## Problem

The active mobile flow now communicates the right states more clearly after prior phases, but parts of the experience still feel mechanically correct rather than polished:

- the provider dashboard has improved counts and summaries but still feels closer to a list than a lightweight control center,
- appointment cards communicate the necessary data but can do more to guide scanning and action confidence,
- the customer progress timeline now distinguishes state categories, but the visual model can still feel text-heavy rather than reassuring and directional,
- and loading, empty, and error states are clearer than before but still not as intentional or branded as the rest of the active flow.

## Goals

- Make the active provider dashboard feel more operational and glanceable.
- Strengthen appointment-card hierarchy so job, time, place, and action state read quickly.
- Make customer progress feel like a polished progress model rather than a status list.
- Improve state feedback messaging so loading, empty, and error surfaces feel deliberate and trustworthy.
- Normalize primary versus secondary action emphasis in the touched active screens.

## Non-Goals

- Redesigning the app wholesale.
- Introducing new backend APIs or data contracts just for polish.
- Expanding into legacy/orphaned stacks.
- Reworking inactive screens or navigation architecture.

## Scope

### In scope

- `apps/mobile/src/components/AppointmentCard.tsx`
- `apps/mobile/src/screens/provider/ProviderDashboardScreen.tsx`
- `apps/mobile/src/screens/customer/AppointmentDetailScreen.tsx`
- active shared UI primitives or theme tokens touched by those screens if a small additive improvement is needed

### Out of scope

- legacy customer/company stacks
- inactive screen families
- backend changes unless unavoidable

## Proposed Approach

- Add a stronger summary strip/card near the top of the active provider dashboard using existing available and assigned job data.
- Refine card spacing, grouping, helper text, badges, and CTA emphasis so actionable cards are easier to understand quickly.
- Polish the customer progress timeline with stronger emphasis for current state, softer reassurance for completed states, clearer upcoming treatment, and more distinct terminal treatment.
- Improve screen-state messaging tone and visual treatment for loading, empty, and error situations in the touched screens.
- Adjust primary and secondary action styling only as needed to make the next-best action more obvious without introducing a new visual language.

## Impact

- Providers should be able to treat the dashboard more like a control center for what matters now.
- Providers should scan cards with less effort and more confidence.
- Customers should feel more oriented and reassured by the progress UI.
- The active flow should feel more cohesive and trustworthy without a large rewrite.
