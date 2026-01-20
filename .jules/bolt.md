## 2024-05-23 - Separation of Sort and Filter in React Lists
**Learning:** In list components where users can both sort and search/filter, separating the sorting logic (O(N log N)) from the filtering logic (O(N)) into distinct `useMemo` hooks significantly improves responsiveness. By sorting the full dataset first (`sortedTransactions`) and then filtering that sorted list (`filteredData`), the expensive sort operation is bypassed during high-frequency filter updates (like typing in a search box), as `Array.prototype.filter` preserves the sort order.
**Action:** When optimizing list views, implement a "Sort First, Filter Second" data pipeline using chained `useMemo` hooks: `enriched` -> `sorted` -> `filtered`.

## 2024-05-24 - Memoizing List Containers
**Learning:** While individual list items (like `TransactionRow`) were memoized, the container component `TransactionsList` was not. This meant that whenever the parent `CashbackDashboard` re-rendered (e.g., due to unrelated state changes like `isSyncing`), the `TransactionsList` would still re-execute its function body (including VDOM diffing), even if props were stable.
**Action:** When optimizing lists, ensure BOTH the list items AND the list container are memoized to fully isolate the list from parent re-renders.

## 2026-01-20 - Memoization Broken by Object Spreading
**Learning:** In `TransactionsList`, the list flattening logic used `...tx` spreading (`{ type: 'item', ...tx }`) to create list items. This created a new object reference for every transaction on every render, causing `React.memo` on `TransactionRow` to fail (always returning false) and triggering unnecessary re-renders of all rows whenever sorting or filtering changed.
**Action:** When transforming data for a list, wrap the original object (e.g., `{ type: 'item', data: tx }`) instead of spreading it, to preserve the object reference and enable effective memoization of child components.
