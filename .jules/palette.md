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

## 2026-01-28 - [Custom Input Labels]
**Learning:** Custom form controls (like `Combobox` built with Popovers) often break standard `<label htmlFor="...">` behavior because the trigger element doesn't receive the ID.
**Action:** Ensure custom input components accept an `id` prop and forward it to the actual interactive trigger element (e.g., the Button). This restores the native behavior where clicking the label focuses the control and allows screen readers to announce the label correctly.
