# Sentinel's Journal

## 2026-01-13 - Hardcoded CORS Origin
**Vulnerability:** The CORS configuration in `server.js` was hardcoded to `http://localhost:3000`.
**Learning:** Hardcoding origins in backend code prevents secure deployment to production environments where the frontend is hosted on a different domain. It also makes the application inflexible.
**Prevention:** Always use environment variables (e.g., `ALLOWED_ORIGIN`) for configuration values that vary between environments (development, staging, production). Provide a safe default for local development.

## 2026-01-13 - Test Environment Polyfills
**Vulnerability:** N/A (Tooling Issue)
**Learning:** Modern Node.js libraries like `undici` (used by `cheerio` and others) rely on global APIs like `TextEncoder`, `ReadableStream`, and `MessagePort` which are not present in the JSDOM test environment by default.
**Prevention:** When testing backend logic or libraries that depend on these globals in a JSDOM environment, explicit polyfills must be added to `src/setupTests.js` to mirror the Node.js environment.
## 2026-02-04 - Input Validation & Logging
**Vulnerability:** The `/api/transactions` endpoint logged the `filterBy` parameter without validation, potentially allowing log flooding or confusing logs if massive strings or objects were passed. The `month` parameter was validated for length but not content type (digits only).
**Learning:** Even simple query parameters can be vectors for DoS (via log flooding or expensive processing) or confusion if not strictly validated. Secure logging should be used to prevent leaking raw error objects which might contain PII.
**Prevention:** Always whitelist enum-like parameters (like `filterBy`). Use strict regex validation for formatted inputs (like `YYYYMM`). Use a sanitized logging helper instead of raw `console.error` for request-dependent errors.
