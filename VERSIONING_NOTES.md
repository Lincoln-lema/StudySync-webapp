# Versioning notes (Week 13)

## 1. The change, in one sentence

`GET /v2/tasks` returns the task list wrapped as `{ "data": [...], "count": N }` instead of the bare array that v1 returns.

## 2. Why it is worth a break

A bare array has no room for anything but tasks. Wrapping it now means paging, totals and other metadata can be added later without a second breaking change. Doing it once, with notice, is cheaper than doing it under pressure when paging is actually needed.

## 3. Prediction: which line in the partner's code will fail

Jua Kali reads StudySync tasks (`API_NEEDS.md`, need 2). The line that fails is wherever their code treats the response of `GET /api/tasks` as a list, such as `tasks.map(...)`, `tasks.forEach(...)` or `for (const t of tasks)`. On v2 the body is an object, so that line throws (for example "map is not a function") or loops over nothing. The fix on their side is to read `body.data` instead of `body`.

**Status: predicted, not confirmed.** I could not see Jua Kali's code, so this comes from the contract only. Confirmed file and line: ______ (asked of Jua Kali; awaiting reply).

## 4. How the rollout works

| URL | Version | Response | Headers |
|---|---|---|---|
| `GET /v2/tasks` | v2 | `{ data, count }` | none |
| `GET /v1/tasks` | v1 | bare list | Deprecation, Sunset, Link |
| `GET /api/tasks` (used by our own frontend) | v1 | bare list | Deprecation, Sunset, Link |
| `GET /tasks` (contract path) | v1 | bare list | Deprecation, Sunset, Link |

- Sunset date: **Wednesday 16 December 2026**.
- v1 is the existing `routes/tasks.js`, untouched. v2 (`server/v2.js`) has its own list handler and reuses v1's POST, PATCH and DELETE handlers, so writes behave identically.
- v2 is mounted after the API-key check and the rate limiter in `server/index.js`, so it needs a key like everything else.
- `monitoring.js` did not need to change: it records the full path at the start of the request, so the log and `/stats` already show `/v1/tasks`, `/api/tasks`, `/tasks` and `/v2/tasks` separately.

## 5. Evidence that v1 did not change

- `git diff 435e3ca HEAD -- server/routes/tasks.js` prints nothing: the v1 task handlers are identical to the last commit before Week 13 (`435e3ca`). Week 13 only wrapped them with the deprecation headers in `server/index.js`.
- `server/__tests__/versions.test.js` (19 tests, all passing) pins the exact v1 field names, the bare-list shape, the error body, and that all three v1 URLs return the same body. It also checks that v2 needs a key, that v1 responses carry the three headers, and that v2 and other endpoints do not.
- **Live check, 17 Nov 2026 (about 05:25 GMT), against the real database:**
  - `GET /api/tasks` returned `200` with a bare list of 5 tasks and the headers `Deprecation: true`, `Sunset: Wed, 16 Dec 2026 00:00:00 GMT` and `Link: </v2/tasks>; rel="successor-version"`.
  - `GET /v2/tasks` returned `200` with `{ "data": [ ...the same 5 tasks... ], "count": 5 }`.
  - `GET /v2/tasks` with no key returned `401`.
- I did not take a before and after snapshot of the live responses, because the Week 13 change was applied before the first live run. The git diff above is the evidence that v1 is unchanged.

## 6. Who still uses v1

As of 17 Nov 2026:

- **Our own frontend** still calls `/api/tasks` (`src/api.js`, `fetchTasks`), so it counts as a v1 user.
- **Jua Kali** was sent the notice (dated 17 Nov 2026) and has not yet confirmed that they have moved to `/v2/tasks`.
- Counts from `GET /stats` and caller labels from the log (`key-xxxxxx`): `GET /api/tasks` ____, `GET /tasks` ____, `GET /v1/tasks` ____, `GET /v2/tasks` ____; Jua Kali's label: ____.

**Could v1 be switched off today without breaking anyone? No.** Our own frontend would break, and Jua Kali has not confirmed their move.

## 7. Receiving SettleIn's notice (Part E)

SettleIn's notice, dated 9 Nov 2026:

- **What it changes:** the property list only. `GET /api/v2/properties` returns `{ "data": [...], "count": N }` instead of the bare list at `/api/v1/properties`. Item fields, IDs, filters, the key, detail responses and writes are unchanged.
- **What it did well:** it says what changes and why, gives a before and after example, lists migration steps, says what stays the same, and allows rollback to the old URL.
- **What was missing:**
  - It is marked "prepared locally; not sent; deployment pending", so v2 was not confirmed live.
  - The proposed deadline (13 Nov 2026) had already passed when it reached me, and it is conditional on partner agreement.
  - There is no named contact or response time.
  - The example is abbreviated (`id`, `title`, `price`).
  - It does not say whether `study-amenities`, the endpoint our feature calls, has a v2 path. It only says detail responses are unchanged.
- **What it means for us:** our Study Spot page and bookings call `GET /api/v1/properties/{id}/study-amenities`, which is not affected. Only our own `GET /api/properties` route, which lists properties, changes.
- **What I changed:** `server/partner.js` is the one file that knows the v1 and v2 list shapes. A `PARTNER_VERSION` setting in `.env` (default `v1`) chooses which one is called, so migrating and rolling back are one-word changes. `server/__tests__/partner.test.js` (12 tests) checks both parsers, the switch, the rollback, and that study-amenities still uses its v1 path.
- **Status:** migration code is written and tested against SettleIn's documented v2 shape. The live migration is pending their deployment of v2. When it is live: set `PARTNER_VERSION=v2`, call `GET /api/properties`, and ask SettleIn to check their `/stats` for `GET /api/v2/properties` with our caller label.
- **Open questions for SettleIn:** is v2 deployed, and on what URL? Is study-amenities unchanged with no v2 path? What is the confirmed v1 deadline? Do v2 list items keep the same fields as v1?

How it felt to receive this notice (1 to 2 sentences, in your own words):

> TODO (yours): ______

## 8. Before the sunset date

- **Migrate our own frontend.** `src/api.js` calls `/api/tasks` and expects a bare list (`fetchTasks`). Before 16 December 2026 it must call `/v2/tasks` and read `.data`. Until then, deleting v1 would break our own app.
- **At sunset,** remove the v1 task mounts in `server/index.js` (`/v1/tasks`, `/api/tasks`, `/tasks`) and the v1-only tests, after confirming `/stats` shows no v1 traffic.

## 9. Reflection (150 to 250 words, your own words)

> TODO (yours): write this yourself; it is graded on perspective-taking, so it has to come from what actually happened. Answer these four, with specifics:
>
> 1. What was it like to receive a breaking change on short notice? How did you find out, and what did you do first?
> 2. What did your partner's notice do well, and what was missing?
> 3. Read our own notice again as Jua Kali. What would you change?
> 4. As the API owner next time, what is one thing you would do differently?