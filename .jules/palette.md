## 2025-01-06 - [Split Action List Items]
**Learning:** When a list item has a primary action (view details) and a secondary action (selection checkbox), making the entire container a button creates accessibility issues due to nested interactive elements.
**Action:** Use a "Split Focus" pattern:
1. Keep the outer container as a layout wrapper (optional click handler for mouse users).
2. Make the specific "content area" a keyboard-focusable button (`tabIndex="0"`, `role="button"`).
3. Keep the secondary action (checkbox) as a separate focusable element.
4. Ensure visible focus styles on the inner content area so keyboard users know which part is active.

## 2026-01-07 - [Card Expand Toggles]
**Learning:** Using `div` elements for expand/collapse toggles in cards creates a barrier for keyboard users.
**Action:** Always use `<button type="button">` for card toggles, ensuring to add `aria-expanded` state and a descriptive `aria-label`. For the main card area, if it's clickable, use `role="button"` with `tabIndex="0"` and explicit `onKeyDown` (Enter/Space) handlers to ensure full keyboard operability.

## 2026-05-21 - [Segmented Controls vs Toggles]
**Learning:** Using a Toggle Switch for mutually exclusive modes (e.g., "Input Mode: A vs B") creates "Mystery Meat Navigation" where the user doesn't know what the unchecked state represents without toggling it. Labels like "Input Mode" are insufficient.
**Action:** Use a Segmented Control (or Toggle Group) with explicit text labels for each option. This makes both states visible and actionable immediately, reducing cognitive load and improving accessibility.
