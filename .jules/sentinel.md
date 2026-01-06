## 2024-05-23 - Custom In-Memory Rate Limiter Pattern
**Vulnerability:** Missing rate limiting on sensitive or resource-intensive endpoints (like external lookups).
**Learning:** Standard libraries like `express-rate-limit` are often preferred, but in a serverless or lightweight environment (like this Netlify function wrapper), a simple in-memory Map solution is effective for preventing basic abuse without adding dependencies.
**Prevention:**
1.  Use the `createRateLimiter` factory in `server.js` for any new public-facing endpoints.
2.  Ensure the cleanup mechanism (setTimeout or periodic sweep) exists to prevent memory leaks from IP storage.
3.  Note that this in-memory limit resets on server restarts (or cold starts in serverless), which is a known trade-off for simplicity.

## 2024-05-24 - HTTP Parameter Pollution (HPP) in Express
**Vulnerability:** Express populates `req.query` parameters as arrays when multiple values are provided (e.g., `?month=A&month=B`). Calling string methods like `.trim()` or `.substring()` on these arrays causes runtime crashes (500 errors/DoS).
**Learning:** Checking for existence (`if (!month)`) is insufficient. Type checking (`typeof month === 'string'`) is critical for any input intended to be a scalar value.
**Prevention:** Always validate `typeof param === 'string'` before processing query parameters in Express, or use a middleware to enforce scalar types for specific fields.

## 2024-05-25 - Unlimited Bulk Operations (DoS Risk)
**Vulnerability:** Bulk API endpoints (e.g., `batch-update`, `bulk-approve`) accepted arrays of arbitrary length, allowing a single request to trigger thousands of backend operations and downstream API calls (Notion).
**Learning:** Even internal or authenticated endpoints can be vectors for Denial of Service if input size is unchecked, especially when operations involve heavy processing or third-party API limits (like Notion's 3 req/sec).
**Prevention:** Enforce a strict `MAX_BULK_LIMIT` (e.g., 50 items) on all array inputs for bulk endpoints to ensure predictable performance and prevent resource exhaustion.
