## 2024-05-22 - [Optimizing Date Sorting in React Lists]
**Learning:** React list components that allow sorting by date often call `new Date()` inside the sort comparator. For large lists, this is expensive (O(N log N) allocations).
**Action:** Always pre-calculate timestamps (e.g., `_dateTimestamp`) during the data enrichment phase (e.g., inside `useMemo`) so the sort function only compares primitive numbers. This is especially critical in dashboards with live filtering.
