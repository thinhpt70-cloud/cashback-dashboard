## 2024-04-18 - Added ARIA labels and focus states to dialog search bars
**Learning:** Icon-only clear buttons (like 'X' inside search/amount inputs) are frequently missing `aria-label` attributes and explicit `type="button"`. This can cause screen reader silence and potential accidental form submissions if placed inside a form.
**Action:** Always check input adornment buttons for `aria-label`, `type="button"`, and visible keyboard focus states (`focus-visible:ring-2`) when reviewing form elements or dialogs.
