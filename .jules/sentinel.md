# Sentinel's Journal

## 2026-01-13 - Hardcoded CORS Origin
**Vulnerability:** The CORS configuration in `server.js` was hardcoded to `http://localhost:3000`.
**Learning:** Hardcoding origins in backend code prevents secure deployment to production environments where the frontend is hosted on a different domain. It also makes the application inflexible.
**Prevention:** Always use environment variables (e.g., `ALLOWED_ORIGIN`) for configuration values that vary between environments (development, staging, production). Provide a safe default for local development.

## 2026-01-13 - Test Environment Polyfills
**Vulnerability:** N/A (Tooling Issue)
**Learning:** Modern Node.js libraries like `undici` (used by `cheerio` and others) rely on global APIs like `TextEncoder`, `ReadableStream`, and `MessagePort` which are not present in the JSDOM test environment by default.
**Prevention:** When testing backend logic or libraries that depend on these globals in a JSDOM environment, explicit polyfills must be added to `src/setupTests.js` to mirror the Node.js environment.

## 2025-02-23 - [Sensitive Data Exposure in Logs]
**Vulnerability:** The application was logging raw error bodies from the Notion API directly to `console.error`. These bodies can contain PII or sensitive transaction details.
**Learning:** A `secureLog` function was implemented but never used, likely due to developer oversight or lack of enforcement.
**Prevention:** Enforce usage of safe logging wrappers. Replaced all raw `console.error` calls with `secureLog` which sanitizes the input.
