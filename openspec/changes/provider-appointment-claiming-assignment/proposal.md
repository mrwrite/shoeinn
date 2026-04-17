# Provider Appointment Claiming Assignment

## Summary

Introduce a formal provider appointment claiming flow that lets providers view claimable confirmed appointments for the companies they belong to, claim those appointments for themselves, and see claimed work in their existing "my appointments" flow. The change also standardizes customer-facing visibility of the assigned provider and adds customer notifications when assignment changes.

## Problem

The repository already contains most of the backend and mobile primitives for appointment claiming and assignment, but the behavior is only partially expressed across the active app flow and is mixed with legacy navigation and older screens. This creates ambiguity about:

- which provider screens are active,
- which routes and models should be reused,
- how customer detail should surface assigned provider state,
- and when assignment notifications should be sent.

## Goals

- Reuse the existing provider/company operations routes, appointment assignment tables, appointment events, notification services, and mobile API client patterns.
- Make claimable confirmed appointments visible to eligible providers in the active `RootTabs`-based provider flow.
- Ensure a provider can claim an appointment and assign it to themselves.
- Ensure claimed appointments appear in the provider "my jobs" flow.
- Ensure customer appointment detail reflects assigned provider and current appointment status.
- Notify customers through in-app and push channels when an appointment is claimed or reassigned.
- Explicitly document active versus legacy mobile screens so new work is wired only into the active navigation path.

## Non-Goals

- Replacing the existing company/provider routing model or introducing a new provider dashboard architecture.
- Reworking legacy `CustomerStack`, `CompanyStack`, or `AdminStack` flows beyond documenting them as inactive unless migration is required.
- Introducing a full multi-provider dispatch or admin reassignment console beyond what is needed to support assignment notifications and read visibility.
- Rewriting payment, hold, or appointment status workflows.

## Scope

### Backend

- Clarify and, where needed, extend assignment behavior around claimable confirmed appointments.
- Reuse `company_ops.py`, `appointments.py`, `appointment_assignment.py`, `appointment_event.py`, and notification services for assignment lifecycle events.
- Add or formalize notification behavior for claim and reassignment events.

### Mobile

- Keep new UI in the active `RootTabs` provider and customer flows.
- Reuse existing endpoints and `src/api/http.ts` request patterns.
- Update provider and customer screens only where the active navigation path requires it.

### Data and Contracts

- Preserve current appointment and assignment model ownership.
- Add only minimal contract changes required for assigned-provider visibility and assignment notifications.

## Impact

- Providers get a coherent claim-and-work queue in the active app flow.
- Customers can see who is assigned to their appointment.
- The architecture becomes easier to maintain because the change distinguishes active mobile surfaces from legacy/orphaned screens.
