## 2025-01-06 - [Split Action List Items]
**Learning:** When a list item has a primary action (view details) and a secondary action (selection checkbox), making the entire container a button creates accessibility issues due to nested interactive elements.
**Action:** Use a "Split Focus" pattern:
1. Keep the outer container as a layout wrapper (optional click handler for mouse users).
2. Make the specific "content area" a keyboard-focusable button (`tabIndex="0"`, `role="button"`).
3. Keep the secondary action (checkbox) as a separate focusable element.
4. Ensure visible focus styles on the inner content area so keyboard users know which part is active.
