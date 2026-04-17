# Design

## Overview

This phase is a polish pass on top of the earlier mobile UX clarity changes. The functional structure of the active flow remains intact. The focus is on visual confidence, hierarchy, and better state feedback using the app's existing theme and active navigation.

## Active Flow Boundary

Work remains limited to the active `RootTabs`-based flow:

- provider dashboard in the active provider stack
- customer appointment detail in the active appointment stack
- shared card/button polish used by those active screens

No legacy or orphaned screen families should be touched.

## Design Goals

- Make the provider dashboard read like an operational surface rather than a plain list.
- Make appointment cards self-explanatory within a short scan.
- Make current progress visually dominant on customer detail.
- Make supporting states feel intentional, helpful, and on-brand.
- Make the primary action look primary and let secondary actions step back.

## Interaction and Visual Direction

### Provider dashboard summary strip

The summary area should sit near the top and answer:

- how many jobs are available now,
- how many belong to me,
- what is the next notable operational cue from current data if one exists.

Possible operational cues from existing data:

- earliest available pickup/start window,
- first active assigned job status,
- or a simple fallback summary when those details are unavailable.

This summary should feel distinct from the rest of the list through spacing, background treatment, and metric grouping.

### Appointment card polish

The card should be visually grouped into:

1. identity: service and top badge
2. schedule/location block
3. action state + helper text
4. CTA

Cards should still use existing theme colors, but:

- actionable cards can feel slightly more energized,
- owned/my-job cards can feel more stable and task-oriented,
- helper text should reduce ambiguity before the CTA.

### Customer progress polish

The timeline already has semantic state categories. This phase improves presentation through:

- stronger current-step contrast and optional left-rail feel,
- calmer completed-state treatment,
- clearer spacing and borders for upcoming states,
- more final-looking terminal states,
- and short supportive copy that reinforces meaning.

### State feedback polish

Loading, empty, and error states should:

- use friendlier operational copy,
- visually align with the rest of the active screens,
- explain what is happening or what to do next,
- and avoid feeling like raw placeholder fallback text.

### Primary versus secondary actions

In the touched screens:

- the main CTA should carry stronger visual weight,
- supporting or tab-switch actions should remain clear but less visually dominant,
- and ghost/secondary treatments should feel intentionally quieter.

## Risks

- Too much embellishment would push the app toward redesign rather than polish, so changes should stay additive.
- Summary-strip content must gracefully degrade when no useful operational cue is available from current data.
- Global button adjustments must not unintentionally weaken unrelated screens.

## Validation

Implementation should verify:

- provider dashboard feels more like a control center,
- cards are faster to scan,
- current progress stands out most on customer detail,
- touched loading/empty/error states feel more polished,
- primary actions are obvious and secondary actions step back,
- and no legacy screens are changed.
