## 2024-01-08 - Secure PIN Comparison
**Vulnerability:** Simple string comparison (`===`) for PIN verification allows for timing attacks.
**Learning:** Even for simple secrets like a PIN, `===` returns faster if the first character doesn't match, potentially leaking information about the secret.
**Prevention:** Use `crypto.timingSafeEqual` which runs in constant time regardless of the input, masking the validity of partial matches. I also added `express.json({ limit: '10mb' })` as a defense-in-depth measure against DoS via large payloads.

## 2025-05-18 - IP Spoofing in Rate Limiter
**Vulnerability:** Manual parsing of `X-Forwarded-For` header (`split(',')[0]`) in `server.js` allowed attackers to spoof their IP address by injecting a fake IP at the beginning of the header.
**Learning:** Naive parsing of `X-Forwarded-For` often ignores the fact that proxies *append* IPs to the list. Taking the first element means trusting the client's input if they manually set the header.
**Prevention:** Use Express's built-in `app.set('trust proxy', 1)` configuration. This correctly parses the `X-Forwarded-For` chain, trusting only the configured number of hops (e.g., the Netlify load balancer), and safely populates `req.ip`.
