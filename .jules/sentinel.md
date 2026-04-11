# Sentinel's Journal

## 2026-01-13 - Hardcoded CORS Origin
**Vulnerability:** The CORS configuration in `server.js` was hardcoded to `http://localhost:3000`.
**Learning:** Hardcoding origins in backend code prevents secure deployment to production environments where the frontend is hosted on a different domain. It also makes the application inflexible.
**Prevention:** Always use environment variables (e.g., `ALLOWED_ORIGIN`) for configuration values that vary between environments (development, staging, production). Provide a safe default for local development.

## 2026-01-13 - Test Environment Polyfills
**Vulnerability:** N/A (Tooling Issue)
**Learning:** Modern Node.js libraries like `undici` (used by `cheerio` and others) rely on global APIs like `TextEncoder`, `ReadableStream`, and `MessagePort` which are not present in the JSDOM test environment by default.
**Prevention:** When testing backend logic or libraries that depend on these globals in a JSDOM environment, explicit polyfills must be added to `src/setupTests.js` to mirror the Node.js environment.

## 2026-01-14 - Missing Environment Variable Validation
**Vulnerability:** The backend application did not validate the presence of critical environment variables (like `JWT_SECRET`, `ACCESS_PASSWORD`, or database IDs) upon startup.
**Learning:** Failing to validate critical secrets on startup means the application could boot in a compromised state or fail insecurely during runtime when the secret is needed.
**Prevention:** Implement a fail-fast mechanism at the application entry point to ensure all required secrets are present before accepting incoming connections. Exempt testing environments from hard exits to allow proper mocking.
