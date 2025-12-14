# Developer Guidelines

## Environment

* **Node.js Version:** This project requires **Node.js 20+**.
    * This is strictly required because `cheerio` (and other dependencies) pull in `undici` v7+, which has dropped support for Node 18 and requires the global `File` API (standard in Node 20).
    * Do not downgrade the Node version in `netlify.toml` or `package.json` engines without verifying `undici` version compatibility.
