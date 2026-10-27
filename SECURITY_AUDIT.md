# Week 9 Security Audit

## 1. What We Checked
- **Sensitive fields:** Inspected `/api/members`, `/api/tasks`, `/users/{id}/reliability-score`, and `/api/flashcards`. All routes return explicit data shapes (not raw `SELECT *` database rows). No password hashes or internal flags are returned.
- **Other people's data:** Our current API does not have user login/ownership (that arrives in a future week), so there is no private user data to leak yet. All data is currently group-shared.
- **Error messages:** Triggered 401, 404, and 500 errors. Confirmed no stack traces, SQL queries, file paths, or table names are returned to the client.
- **Write endpoints:** Verified that POST/PUT requests drop extra fields. Database queries use parameterized inputs (`?`), preventing SQL injection.
- **Keys in the wrong place:** Confirmed `.env` is ignored by Git, `.env.example` has placeholders, and no API keys are printed in server logs. 

## 2. What We Found and Fixed
- **Found:** Unauthenticated access. Anyone with the URL could read the whole database.
  - **Fixed:** Added `requireApiKey` middleware to `index.js`. All routes now return `401 Unauthorized` without a valid `X-API-Key` header.
- **Found:** No protection against spam or infinite loops.
  - **Fixed:** Added a custom in-memory `rateLimit` middleware.

## 3. Rate Limit Threshold and Rationale
- **Threshold:** 100 requests per minute per API key.
- **Why:** This is the default suggested by the lab handout. It is high enough to support normal frontend usage (loading a dashboard, switching tabs, refreshing the page), but low enough to stop accidental infinite loops or malicious spam. 
- **Demonstration:** We temporarily lowered this to `3` requests to prove the `429 Too Many Requests` response and `Retry-After` headers work correctly, then returned it to `100`.