# Notification Inbox Filters And Priority Segmentation

## Summary

Refine the customer notification inbox with a lightweight `All` / `Unread` filter and stronger priority-aware visual emphasis inside grouped appointment cards so the inbox stays easy to scan as notification volume grows.

## Problem

The customer inbox now supports grouped notifications, live refresh, push, deep links, and group-based read actions. That foundation is solid, but as more appointments accumulate updates the inbox still needs better scan controls:

- customers need a simple way to focus on unread groups,
- high-value updates need to stand out faster inside grouped cards,
- and the inbox should feel easier to scan without adding tabs, heavy categorization, or backend complexity.

Without that refinement, a larger inbox will feel denser and more cognitively expensive even if the underlying grouping is correct.

## Goals

- Add a lightweight customer inbox filter with `All` and `Unread`.
- Make high-value updates visually stand out within grouped appointment cards.
- Preserve appointment-based grouping as the primary inbox structure.
- Keep the implementation mobile-only and compatible with existing read-state, live refresh, push, and deep-link behavior.

## Non-Goals

- Adding backend filtering endpoints or schema changes.
- Introducing notification tabs, categories, pagination, or archive/delete flows.
- Reworking notification kinds into a new taxonomy.
- Changing the current grouped-by-appointment model.

## Proposed Approach

- Add a small client-side filter state to the customer notification screen with two options: `All` and `Unread`.
- Filter grouped appointment cards after the existing grouping step so unread logic continues to work at the group level.
- Reuse the existing high-value notification rules already implicit in the inbox copy logic and make them visually stronger through group-level presentation.
- Keep lower-value notifications visible but more subdued, especially when they are older or not the leading update in a group.

## Impact

- Customers can focus on what still needs attention.
- Important assignment and milestone updates become easier to recognize at a glance.
- The inbox stays calm and performant because all filtering and priority presentation happen on the client without backend churn.
