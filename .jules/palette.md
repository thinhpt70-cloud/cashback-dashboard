## 2026-01-04 - Accessibility: Icon-only Buttons
**Learning:** Shadcn UI `Button` components with `size="icon"` often lack accessible names. Developers frequently use them for "x" (close), "info", or "lookup" actions without adding `aria-label`, making them invisible to screen readers.
**Action:** Always check `size="icon"` usage. If no text children exist, an `aria-label` is mandatory.
