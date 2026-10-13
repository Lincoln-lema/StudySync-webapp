# Blind Test Report

## Part D: Our test of Team 11's README

**Team:** Team 11 (`Wahome-M/Team_11-webapp`, FundiLink), outside our ring (our ring partners are Team 1 SettleIn and Team 3 Jua Kali).

**Live API used:** `https://grew-anderson-cookies-carol.trycloudflare.com` (their tunnel URL, used in place of `localhost:5000`).

**Request:** `GET /jobs`, the quickstart call from their README.

**Result:** Success. `200 OK` with a JSON array containing "Fix leaking kitchen sink" and "Deep clean 2-bedroom flat".

**Time:** Succeeded at 23:18 EAST on 2026-10-13 (20:18 GMT), taking a few seconds.

**Where we got stuck:** Nowhere. The host swap was simple because their routes sit at the root (`/jobs`).

## Part D: Team 11's test of our README

**Team:** Team 11, outside our ring.

**How they got the README:** a member of our team sent Team 11 the README file directly, because it isn't on GitHub yet. Their test was of the README as sent, not a version they fetched from the repo.

**Request:** `GET /api/members` against our live tunnel, using the base URL we sent.

**Result:** Success. `200 OK`, 10 members returned, on the first request.

**Time:** 23:28 EAT on 2026-10-13 (20:28 GMT).

**Where they got stuck:**
1. **Base URL vs. README paths.** We sent a base URL ending in `/api`, but the README examples already include `/api`. Joining them gave `/api/api/members`, which returned 404. Fixed: the README now says the base URL is host only.
2. **Error format.** The 404 for an unknown path was an HTML page (`Cannot GET /api/api/members`), not the JSON error the README described. Fixed: the README now notes that unknown paths return an HTML 404.
3. **Non-`/api` paths.** `/users/anna/reliability-score` worked, but only at the host root. Fixed by the base-URL change above.
4. **macOS port conflict.** Port 5000 is taken by AirPlay, so the server returned 403. Fixed: the README now has the `PORT=5001` note.
5. **Stale `SETUP.md` seed data.** `SETUP.md` lists Anna as `A`/95, but the README and live API show `AN`/85. Fixed in `SETUP.md`.
6. **Stale `SETUP.md` commands.** `SETUP.md` says `npm run dev` and says `/api/deadlines` works with no dates, but the README says `npm start` and that `from` and `to` are required. Fixed in `SETUP.md`.

**Honest summary:** Team 11 got a successful response from our live API on the first request. Their hesitations came mostly from our base-URL wording, the HTML 404, and the macOS port note, which are now fixed in the README. The `SETUP.md` inconsistencies are fixed.

## Part E: Remaining gaps

- `SETUP.md` seed data and command notes are fixed (items 5 and 6 above).
- Our API's IDs longer than 10 characters are silently truncated, but the API still returns 201 with the full ID. Documented in `README.md` under known limitations, not fixed in code.
- Date-only deadlines are shifted to the previous day at 21:00 UTC. Documented in `README.md`.
- No authentication yet (Week 9).

## Clean-clone check

We cloned the committed code into a scratch folder, ran `npm install`, created a separate test database from `SETUP.md` and `schema_additions.sql` (with the database name changed only in the scratch copy), and started the server on port 5002. `GET /api/members`, `GET /api/tasks`, `GET /users/anna/reliability-score`, `GET /users/ghost/reliability-score`, `GET /api/deadlines`, and `GET /api/flashcards` all returned the responses shown in the README. The scratch database was then dropped. The clone used committed code only, so the uncommitted README and SETUP.md changes weren't part of this check.
