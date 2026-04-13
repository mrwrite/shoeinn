# Notification Inbox Read State And Bulk Actions

## Summary

Improve the customer notification center by making grouped read state more predictable and adding lightweight bulk actions that help customers clear inbox noise without redesigning the grouped-by-appointment model.

## Problem

The current grouped inbox is calmer than a flat feed, but it still feels incomplete in two ways:

- tapping a grouped appointment card only acknowledges the latest notification,
- group unread state can therefore remain active even after the customer opens the group,
- and there is no lightweight way to clear accumulated read noise across the inbox.

That makes the inbox feel less controlled than it should, especially once appointments have several updates.

## Goals

- Make grouped-card read behavior predictable and trustworthy.
- Let customers mark one appointment group as read without opening every child update individually.
- Add one lightweight inbox-wide bulk action.
- Preserve the grouped appointment-card model and tap-to-detail behavior.
- Keep backend changes additive and low-risk.

## Non-Goals

- Adding archive, delete, filter, undo, or a full inbox management system.
- Redesigning the customer notification center layout.
- Replacing existing notification records or changing delivery behavior.
- Introducing reversible read state if the current system is one-way.

## Proposed Approach

- Keep the grouped inbox model.
- Change grouped-card interaction so opening a grouped appointment card acknowledges all unread notifications in that appointment group before navigating.
- Add an explicit lightweight group action to mark that group as read without forcing navigation.
- Add a top-level `Mark all read` action for the customer inbox.
- Add one backend bulk endpoint for customer in-app notifications to support `mark all read`.
- Reuse the existing single-notification ack endpoint for direct child-item acknowledgment when needed.

## Impact

- Customers can clear noise more intentionally.
- Group unread styling becomes easier to trust because opening a group clears the group.
- The inbox stays calm and compact while gaining basic management controls.
