# Deprecation notice: StudySync Tasks API v1

**To:** Jua Kali (Team 3) **From:** Bruce Kilonzi, StudySync (Team 2) **Date:** 17 November 2026

## Summary

v1 of `GET /api/tasks` is deprecated. **v2 is live now at `GET /v2/tasks`.** v1 will stop working on **Wednesday 16 December 2026**. Please move before then.

## What is changing

- The list is wrapped: `[ ... ]` becomes `{ "data": [ ... ], "count": N }`

That is the only change. It applies to the task list only. The same applies if you call the unversioned `GET /tasks` or `GET /v1/tasks`: all three are v1 and all three stop on the sunset date.

**What is not changing:**

- The fields on each task: `id`, `title`, `assigned_to`, `status`, `deadline` (same names, same types, `id` is still a string like `t1`)
- The filters: `?status=` and `?assignee=` work exactly as before
- POST, PATCH and DELETE on tasks (they also work on `/v2/tasks`, with identical requests and responses)
- Your API key and the `X-API-Key` header
- Error bodies, and the 401 and 429 behaviour
- Every other endpoint (members, deadlines, activity, flashcards, reliability score): untouched, and not versioned

## Why

Wrapping the list in an object lets us add paging and other metadata later without breaking you a second time. A bare array leaves no room to add anything.

## Before and after

v1 `GET /api/tasks`

```json
[
  { "id": "t1", "title": "Finish calculus problem set", "assigned_to": "anna", "status": "pending", "deadline": "2026-09-12T23:59:00Z" }
]
```

v2 `GET /v2/tasks`

```json
{
  "data": [
    { "id": "t1", "title": "Finish calculus problem set", "assigned_to": "anna", "status": "pending", "deadline": "2026-09-12T23:59:00Z" }
  ],
  "count": 1
}
```

## How to migrate

1. Call `/v2/tasks` instead of `/api/tasks`. Same key, same `?status=` and `?assignee=` filters.
2. Read the list from `body.data` instead of from the body itself. (Anything that loops over the response, such as `.map` or `for...of`, will fail on v2 until you change it.)
3. Optionally read `body.count` for the number of tasks.
4. Test it, then tell me, so I can see your calls on `GET /v2/tasks` in our logs.

You can check you are on v1 at any time: every v1 response carries `Deprecation: true`, `Sunset: Wed, 16 Dec 2026 00:00:00 GMT` and a `Link` header pointing to `/v2/tasks`. v2 responses do not.

## Timeline

- **Today (17 Nov 2026):** v2 is live. v1 still works exactly as before and now sends the Deprecation headers.
- **Wednesday 16 December 2026:** v1 stops working. Calls to `/api/tasks`, `/tasks` and `/v1/tasks` will no longer return tasks.

## Questions

Message me any time. I will reply within one working day.
