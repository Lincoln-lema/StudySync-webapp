# Monitoring Notes

## 1. Predictions

1. Slowest endpoint and why:
   `POST /api/bookings` should be slowest, because it also calls the partner's
   SettleIn API. Among GETs, `GET /api/flashcards` should be slowest, because
   it runs two queries. `GET /users/:userId/reliability-score` should be
   fastest, because it reads one row. Unsure about members versus tasks.

2. Most errors and why:
   `GET /users/:userId/reliability-score` should give the most 404s, because
   any unknown user id returns 404. 401s and 429s can hit any route, so a
   busy caller could produce more of those. Unsure which is largest.

## 2. Measured results (from /stats and requests.log, 2026-11-03)

Source: `GET /stats` after 268 requests (uptime 75 s), plus the per-request log in `server/requests.log`.

| Route | Count | Client errors | Server errors | Avg ms | Max ms |
|---|---|---|---|---|---|
| GET /api/tasks | 38 | 0 | 0 | 1.7 | 4.0 |
| GET /api/members | 14 | 0 | 0 | 6.7 | 71.7 |
| GET /users/:userId/reliability-score | 29 | 12 | 0 | 1.5 | 3.3 |
| GET /stats | 1 | 0 | 0 | 1.1 | 1.1 |
| (no route) | 186 | 186 | 0 | 0.5 | 3.2 |

Overall: total 268, client errors 198 (186 of them with no route, including rate-limited 429s and key-less 401s), server errors 0, error rate 0%, average 1.1 ms.

## 2b. Run 2 (2026-11-04, backend restarted, traffic.js with N=200)

Source: the per-request log in `server/requests.log` for this run (202 lines). `/stats` was rate-limited when I read it, so these figures come from the log, not from `/stats`.

| Route (from log) | Count | Avg ms | Max ms | Status codes |
|---|---|---|---|---|
| GET /api/tasks | 86 | 1.2 | 8.8 | 200 (keyed), 401 (no key) |
| GET /api/members | 24 | 5.6 | 87.8 | 200 |
| GET /users/ghost/reliability-score | 29 | 1.3 | 4.3 | 404 |
| GET /users/anna/reliability-score | 28 | 1.2 | 2.6 | 200 |
| GET /not-a-route | 35 | 0.8 | 3.5 | 404 |

Status totals: 200 x60, 404 x40, 429 x75, 401 x27. No 5xx. The script's own summary matched the log: 200 x59, 401 x26, 404 x40, 429 x75.

What changed from run 1: the slowest call was again `GET /api/members` at 87.8 ms, the first request after the restart. The 429 count was 75 this time, against about 125 in run 1, because this run was shorter and started after the window had reset. Errors are still almost entirely 4xx.

## 3. Part E: answers from the data

| Question | Answer |
|---|---|
| Which endpoint is slowest on average? | `GET /api/members`, 6.7 ms over 14 requests. The other measured routes averaged 1.5 to 1.7 ms. |
| Which has a slow worst case? | `GET /api/members`, max 71.7 ms. It was the first request after a restart, so the average hides it. |
| Which endpoint fails most often? | By route: `GET /users/:userId/reliability-score`, 12 client errors (all 404 for `ghost`). Overall: requests with no matching route (429s and 401s), 186 of the 198 client errors. No server errors anywhere. |
| Are the 401s a mistake or probing? | They came from our traffic script, which sends requests without a key on purpose (`caller: "none"`). The log alone cannot tell a mistake from probing. |
| Is the error rate healthy? | Yes by the numbers: error rate 0%, no 5xx. The 429s show the rate limiter working, not a fault. |

## 4. Predicted versus actual

- Slowest endpoint: `POST /api/bookings` and `GET /api/flashcards` were not measured, because the traffic script sent neither. `reliability-score` being fastest is close to correct: 1.5 ms against 1.7 ms for tasks, which is a 0.2 ms gap, so it is not a strong result. Members versus tasks: members was slower (6.7 ms against 1.7 ms), but that average is driven by the one slow first call.
- Most errors: correct on the route. `reliability-score` gave the most 404s (12). Correct on the overall picture too: 429s (about 125) were the largest group, and 401s (42) were the next largest.

## 5. A real pattern in the data

- `GET /api/members` averages 6.7 ms across 14 calls, but its slowest call took 71.7 ms. That call was the first request after the server restarted, so the average hides a slow first request.
- About 125 requests returned 429 under the 100-per-minute limit, all from the same key. The rate limiter, not the routes, produced most of the client errors.
- `GET /users/:userId/reliability-score` returned 12 client errors, from the test user `ghost` that does not exist.

## 6. Hypothesis and what I would check next

- Hypothesis: the 71.7 ms outlier is database connection warm-up after a restart. To check: restart the server, send one `GET /api/members`, then several more, and compare the first call's `ms` with later calls in the log.
- Hypothesis: the high `(no route)` count is mostly our own traffic script hitting the rate limit. To check: count the 429 lines against the 401 lines in the log.

## 7. One alert for production

- Alert: `errorRatePercent` above 5% over five minutes, from `/stats`. `/stats` counts live in memory and reset on restart, so production needs an external collector.
- When it fires: page the on-call person, and the feature serves its fallback message (as in Week 11) rather than errors to users while the cause is found.

## 8. Ring partner traffic

- No traffic from our ring partner (Team 3, Jua Kali) reached our API during this session. Their requests would appear in the log with a different `caller` label. This handout item is not met.
- Why: our public URL depends on a tunnel. The Cloudflare tunnel was blocked on this network, and ngrok is installed but has no authtoken yet. The backend is also not running right now (MySQL is stopped).

## 9. Log file note

- `server/requests.log` was overwritten after the analysis above. It now holds only the first few lines. The figures in sections 2 to 5 come from the `/stats` output and the log analysis taken before it was overwritten. Re-run `traffic.js` to regenerate them.

