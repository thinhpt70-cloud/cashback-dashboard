## 2024-05-23 - Custom In-Memory Rate Limiter Pattern
**Vulnerability:** Missing rate limiting on sensitive or resource-intensive endpoints (like external lookups).
**Learning:** Standard libraries like `express-rate-limit` are often preferred, but in a serverless or lightweight environment (like this Netlify function wrapper), a simple in-memory Map solution is effective for preventing basic abuse without adding dependencies.
**Prevention:**
1.  Use the `createRateLimiter` factory in `server.js` for any new public-facing endpoints.
2.  Ensure the cleanup mechanism (setTimeout or periodic sweep) exists to prevent memory leaks from IP storage.
3.  Note that this in-memory limit resets on server restarts (or cold starts in serverless), which is a known trade-off for simplicity.
