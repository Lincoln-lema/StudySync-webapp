# Write Endpoints (Week 6)

This documents the write endpoints (POST/PUT/PATCH/DELETE) added in Week 6, for
teammates picking up the API after this point. Read `SETUP.md` first if you haven't
got the server running locally yet — everything below assumes that's done.

## What's new

Before Week 6, every endpoint was read-only (GET). This week added the ability to
actually create, update, and delete data through the API instead of only reading
whatever was seeded directly into the database.

| Resource | New endpoints |
| --- | --- |
| Members | `POST /api/members`, `PUT /api/members/{id}`, `DELETE /api/members/{id}` |
| Tasks | `POST /api/tasks`, `PATCH /api/tasks/{id}`, `DELETE /api/tasks/{id}` |

Deadlines, Activity, and Flashcards remain GET-only for now — see
`CONTRACT_DEVIATIONS.md` for what's still outstanding.

## Validation rules

Every write endpoint rejects bad input with `400 Bad Request` **before** touching
the database. Nothing is written unless all checks pass.

**`POST /api/members`**
- Required: `id`, `name`, `initials` (non-empty strings)
- Optional: `reliability` (integer, 0–100), `group_id` (string or null)

**`PUT /api/members/{id}`**
- Required: `name`, `initials` (non-empty strings)
- Optional: `reliability` (integer, 0–100), `group_id` (string or null)
- Returns `404` if the member doesn't exist

**`DELETE /api/members/{id}`**
- Returns `404` if the member doesn't exist, `204` on success

**`POST /api/tasks`**
- Required: `id`, `title`, `assigned_to`, `deadline`
- `assigned_to` must reference an existing member — returns `400` if it doesn't
- `status` optional, defaults to `pending`; must be one of `pending`/`done`/`late` if provided
- `deadline` must be a parseable date

**`PATCH /api/tasks/{id}`**
- At least one of `title`, `assigned_to`, `status`, `deadline` required
- Same field-level checks as POST, applied only to whatever fields are provided
- Returns `404` if the task doesn't exist
- Fields not included in the request keep their current value (partial update, not
  a full replace)

**`DELETE /api/tasks/{id}`**
- Returns `404` if the task doesn't exist, `204` on success

## Status codes to expect

| Situation | Code |
| --- | --- |
| POST succeeds | `201` |
| PUT/PATCH succeeds | `200` |
| DELETE succeeds | `204` |
| Validation fails | `400` |
| Target ID doesn't exist (PUT/PATCH/DELETE) | `404` |
| Unexpected server/DB error | `500` |

## Testing locally

With the server running (`node index.js`), test any endpoint with `curl`:

```
curl -i -X POST http://localhost:5000/api/tasks -H "Content-Type: application/json" -d "{\"id\":\"t9\",\"title\":\"Example\",\"assigned_to\":\"anna\",\"deadline\":\"2026-12-01T12:00:00Z\"}"
```

The `-i` flag is important — it shows the HTTP status code, not just the response
body. Always test both a valid request (expect success) and an invalid one
(missing field, bad type, or nonexistent ID — expect `400`/`404`) for any endpoint
you touch.

You can also load `openapi.yaml` into the online Swagger Editor
(`https://editor.swagger.io`, File > Import File) to explore and try requests
through a UI instead of the command line. Make sure the "Servers" dropdown is set
to `http://localhost:5000`, and note that some browsers block requests from that
HTTPS page to your plain-HTTP localhost server (mixed content) — if that happens,
stick with `curl`.

## Known gotcha: editing a route file does nothing until you restart

Node loads route files once at startup. If you edit `members.js` or `tasks.js`
while `node index.js` is still running, your changes won't take effect. Stop the
server (`Ctrl+C`) and run `node index.js` again after every route change.

## `flashcards.js` bug fix (not a new endpoint, but touched this week)

`GET /api/flashcards` was returning the raw `shared_with_group` database flag
(`0`/`1`) instead of the derived group ID the contract has specified since Week 5.
Fixed by joining to `members` on `owner_id` and returning the owner's `group_id`
when the flag is set, `null` otherwise. See `CONTRACT_DEVIATIONS.md` for the full
history on this field.
