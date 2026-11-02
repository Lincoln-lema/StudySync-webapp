Resilience Notes (Week 11)
Feature: the Study Spots page, which shows a property's study amenities (Wi-Fi, desk, quiet hours, ...). Browser -> our backend GET /api/properties/:id/study-amenities -> partner SettleIn GET /api/v1/properties/:id/study-amenities.

Partner used for testing: a stand-in I control (server/flaky_partner.js, from the handout, plus one extra route for the path my feature calls). The stand-in returns "Stand-in Hostel (not real data)". The real SettleIn server was not reachable (see section 5).

Config names: my env variables are SETTLEIN_URL and SETTLEIN_API_KEY. The handout calls them PARTNER_URL and PARTNER_KEY. Same purpose.

1. What I tested
All timings are from curl against my backend, except the browser rows.

Failure	Before the fix (Week 10 code)	After the fix	What my backend log said
Slow partner (answers after 10 s)	Backend waited 10.0 s, then answered 200. A user would stare at "Loading live partner data..." the whole time.	Gives up after 1.5 s per try. With 2 retries it stops after 5.13 s. With saved data it returns that data flagged stale: true (200); with nothing saved it returns a 502 "Partner data unavailable".	Timeout and retry lines (attempt 1 failed, retrying in 200 ms, then attempt 2 ... 400 ms), then SettleIn amenities call failed: timeout.
Flaky partner (fails 2 of every 3 calls with 503)	2 of 3 calls failed (502, 502, 200), although a second try would have worked.	200 after 0.70 s. The user never saw a failure.	Two lines: attempt 1 failed, retrying in 200 ms and attempt 2 failed, retrying in 400 ms.
Partner always errors (500)	Immediate 502.	502 after 0.65 s. Exactly 2 retries, then it stops (the stand-in counted 3 calls: 1 try + 2 retries). No infinite loop.	Two retry lines, then SettleIn amenities failed 500 ... { message: 'Internal error' }.
Slow partner, browser, with saved data	n/a	After about 5 s the Study Spots page showed the same data with an amber banner: "Showing saved data from 16:24:26. The partner is not responding." The header changed to "Saved data from SettleIn Housing API". Screenshot: fallback-banner.png.	Same timeout lines as the slow row.
Slow partner, browser, nothing saved (backend just restarted; the same happened once with the partner stopped and no saved copy)	n/a	After about 5 s the page showed "Partner data is unavailable right now. Please try again later." No crash, no blank page.	Same timeout lines as the slow row.
Partner stopped (stand-in process closed with Ctrl+C)	Not measured (I had already replaced the Week 10 code).	curl through my backend: 200 with stale: true after 0.62 s, asOf still the earlier saved time. Browser: the Study Spots page showed the saved data, the subtitle "Saved data from SettleIn Housing API", and the amber banner "Showing saved data from 17:27:00. The partner is not responding." A stopped server refuses the connection at once, so there is no 1.5 s timeout to wait for, only the two waits (200 ms + 400 ms).	attempt 1 failed, retrying in 200 ms, attempt 2 failed, retrying in 400 ms, SettleIn amenities call failed: ECONNREFUSED http://localhost:4000
Partner back after a failure	n/a	I restarted the stand-in with node flaky_partner.js and reloaded the page: live data again, no banner, subtitle back to "Live data from SettleIn Housing API". I changed no code.	Stand-in log showed new GET amenities calls arriving from my backend.
Before I fixed anything: normal response time was 0.0077 s (curl against the stand-in in ok mode).

2. My numbers, and why
Setting	Value	Why
Normal response time (measured)	0.0077 s (about 8 ms)	curl against the stand-in in ok mode.
Timeout	1500 ms per attempt	About 190 times my measured normal time, so a bad moment will not trigger it, but far below how long a user waits. I used the handout's starting point because my measurement was so small.
Retries	2 (so at most 3 attempts)	A flaky partner that fails 2 of 3 calls needs exactly 2 retries to succeed. More retries make a struggling partner worse.
Wait between attempts	200 ms, then 400 ms	Short, and longer each time, so I never hammer the partner in a tight loop.
Retried statuses	429, 500, 502, 503, 504, plus timeouts and connection failures	Momentary failures that often work a second later. 429 also honours Retry-After (capped at 5 s).
Never retried	400, 401, 403, 404, and anything that is not a GET	A wrong key or wrong path fails the same way every time. A write could be done twice.
Worst case wait: (2 retries + 1) x 1500 ms + 200 + 400 = 5100 ms. I measured 5.13 s with the partner in slow mode, so the calculation matches.

Is 5.1 s acceptable? Yes, for this feature. Study Spots is a reference page, not a payment or a form, so nobody loses work by waiting. The full 5.1 s only happens when the partner is completely unresponsive. A normal call takes about 8 ms, and a flaky partner is fixed in 0.7 s. I considered lowering the timeout to 1000 ms (worst case 3600 ms), but with a normal response of 8 ms, 1500 ms already leaves room for a bad moment without making users wait much longer.

3. What a real user would experience without this code
Without this code, a student who opens the Study Spots screen while SettleIn is slow would see "Loading live partner data..." for the full 10 seconds I measured, with no sign that anything is wrong, and would probably leave or press reload. If SettleIn were flaky, the page would fail two times out of three even though a second attempt would have worked, so the student would see "Partner data is unavailable" and have to reload by hand. After the fix, a slow or flaky partner is cut off after 1.5 s and retried automatically, so most users never notice. If the partner stays down, the student still sees the last study-spot details with an amber banner saying when they were saved, so they can keep planning. Only a student who is the very first to open the page after our server starts, while SettleIn is down, sees the plain "unavailable" message.

4. What I did not build
A circuit breaker is a switch that stops calling a partner that has been failing for a while, and tests it only occasionally. Mine still tries every request three times, even when the partner has been down all afternoon. A circuit breaker would make my backend answer from the saved copy (or the friendly message) immediately, instead of making every user wait the full 5.1 s, and it would stop adding load to a partner that is already struggling.

Other limits: the saved copy lives in memory, so it is lost when my backend restarts (that is why the "nothing saved" case exists), and it only covers the amenities route, not the property list.

5. Real partner drill (Part E)
Not done yet. I did not have SettleIn's live URL (Group 1 was unreachable), so I could not run the stop-and-restart drill with them. All results above are from the stand-in, which I label as such everywhere.

