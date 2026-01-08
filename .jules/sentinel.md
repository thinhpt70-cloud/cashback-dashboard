## 2024-01-08 - Secure PIN Comparison
**Vulnerability:** Simple string comparison (`===`) for PIN verification allows for timing attacks.
**Learning:** Even for simple secrets like a PIN, `===` returns faster if the first character doesn't match, potentially leaking information about the secret.
**Prevention:** Use `crypto.timingSafeEqual` which runs in constant time regardless of the input, masking the validity of partial matches. I also added `express.json({ limit: '10mb' })` as a defense-in-depth measure against DoS via large payloads.
