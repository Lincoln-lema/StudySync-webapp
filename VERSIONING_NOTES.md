# Versioning notes (Week 13)

## 1. The change, in one sentence

`GET /v2/tasks` returns the task list wrapped as `{ "data": [...], "count": N }` instead of the bare array that v1 returns.

## 2. Why it is worth a break

A bare array has no room for anything but tasks. Wrapping it now means paging, totals and other metadata can be added later without a second breaking change. Doing it once, with notice, is cheaper than doing it under pressure when paging is actually needed.

## 3. Prediction: which line in the partner's code will fail

Jua Kali reads StudySync tasks (`API_NEEDS.md`, need 2). The line that fails is wherever their code treats the response of `GET /api/tasks` as a list, such as `tasks.map(...)`, `tasks.forEach(...)` or `for (const t of tasks)`. On v2 the body is an object, so that line throws (for example "map is not a function") or loops over nothing.

> **TODO (team):** replace the paragraph above with the exact file and line in Jua Kali's code. Ask them: "which line reads the `/api/tasks` response?" I could not see their code, so this is a prediction from the contract only.

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

- `versions.test.js` pins the exact v1 field names, the bare-list shape, the error body, and that all three v1 URLs return the same body. 19 tests, all passing.
- A before and after snapshot of `/api/tasks`, `/tasks`, `/api/tasks?status=pending` and an invalid `POST` was identical byte for byte (run with a stubbed database, so the data was identical).

> **TODO (team):** repeat the snapshot against your real database and paste the result here:
> `curl -s -H "X-API-Key: %SS_KEY%" http://localhost:5000/api/tasks > v1_before.json` (before applying the Week 13 files), then again into `v1_after.json` (after), then `fc v1_before.json v1_after.json` should print `no differences encountered`.

## 6. Who still uses v1

> **TODO (team):** after the notice has been sent and Jua Kali has had time to migrate, run
> `curl -s -H "X-API-Key: %SS_KEY%" http://localhost:5000/stats`
> and record the counts for `GET /api/tasks`, `GET /tasks`, `GET /v1/tasks` and `GET /v2/tasks`, plus the caller labels (`key-xxxxxx`) in your log for those paths.
>
> Note that our own frontend calls `/api/tasks`, so it counts under v1 until it is migrated (see section 7).
>
> Could v1 be switched off today without breaking anyone? Answer from the numbers: no, if our frontend or Jua Kali still appears on v1.

## 7. Before the sunset date

- **Migrate our own frontend.** `src/api.js` calls `/api/tasks` and expects a bare list (`fetchTasks`). Before 16 December 2026 it must call `/v2/tasks` and read `.data`. Until then, deleting v1 would break our own app.
- **At sunset,** remove the v1 task mounts in `server/index.js` (`/v1/tasks`, `/api/tasks`, `/tasks`) and the v1-only tests, after confirming `/stats` shows no v1 traffic.

## 8. Reflection (150 to 250 words, your own words)

> **TODO (team):** write this yourself. It is graded on perspective-taking, so it has to come from what actually happened. Answer these four, with specifics:
>
> 1. What was it like to receive a breaking change on short notice? How did you find out, and what did you do first?
> 2. What did your partner's notice do well, and what was missing?
> 3. Read our own notice again as Jua Kali. What would you change?
> 4. As the API owner next time, what is one thing you would do differently?
