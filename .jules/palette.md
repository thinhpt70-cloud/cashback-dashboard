## 2024-05-22 - Accessibility Improvements for Interactive Elements

**Learning:**
I found that many icon-only buttons (like `X`, `Sparkles`, `Info`) in `AddTransactionForm` and other components were missing `aria-label` attributes. This makes them inaccessible to screen reader users who wouldn't know what action the button performs. Additionally, custom interactive elements like the "Review Needed" accordion header in `TransactionReview` were using `div`s with `onClick` but missing proper ARIA roles (`role="button"`) and keyboard support (`onKeyDown`, `tabIndex`), making them inaccessible to keyboard-only users.

**Action:**
Going forward, I will ensure that:
1.  All icon-only buttons have a descriptive `aria-label`.
2.  Custom interactive elements (like custom accordions or toggles) include:
    *   `role="button"`
    *   `tabIndex={0}` to be focusable.
    *   `aria-expanded` (if applicable) to communicate state.
    *   `onKeyDown` handler for 'Enter' and 'Space' keys to mirror click behavior.
3.  Use existing semantic HTML elements (like `<button>`) whenever possible instead of `div`s with handlers, as they provide these features out of the box.
