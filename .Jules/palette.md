## 2026-01-19 - Accessible Icon Buttons
**Learning:** Icon-only buttons (like FABs and menu toggles) are common but often lack accessible names. Adding `aria-label` directly to the `Button` component is a simple, high-impact fix that works seamlessly with shadcn/ui.
**Action:** Always check icon-only buttons for `aria-label` during component creation.
