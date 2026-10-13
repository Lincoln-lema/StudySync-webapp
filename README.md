# StudySync API

StudySync is a study-management API for a student group: members, shared tasks, deadlines, activity logs, and flashcard decks. It is for the student group's frontend and for partner teams who integrate with it. The full contract is in [`openapi.yaml`](openapi.yaml), and a rendered version is in [`docs/index.html`](docs/index.html).

## Authentication

There is no authentication yet. Send requests without any `Authorization` header. Real auth arrives in Week 9, and this section will be replaced then.

## Base URL

The base URL is the host only: `http://localhost:5000`. Append each path exactly as written in this README. Some paths start with `/api` and some don't, so don't add or remove `/api` yourself.

- `/api/...` paths: `/api/members`, `/api/tasks`, `/api/deadlines`, `/api/activity`, `/api/flashcards`
- Paths without `/api`: `/users/{userId}/reliability-score`, `/users/{userId}/activity`, `/calendar-events`

For a hosted instance, replace only the host, for example `https://your-tunnel.trycloudflare.com/api/members`. The production server URL in `openapi.yaml` is a placeholder and is not live.

## Run it locally

Starting from a clean clone:

```
git clone https://github.com/Lincoln-lema/StudySync-webapp.git
cd StudySync-webapp/server
npm install
```

1. Start MySQL. With XAMPP, click Start next to MySQL in the control panel.
2. Create the database and tables by following steps 2–3 in [`SETUP.md`](SETUP.md). The rest of the schema is in `server/schema_additions.sql`.
3. Create `server/.env` with these variables (the example values are placeholders):

   ```
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your-mysql-password
   DB_NAME=studysync
   DB_PORT=3306
   PORT=5000
   ```

4. Start the server:

   ```
   npm start
   ```

   It prints `Server running on port 5000`.

   **macOS:** AirPlay Receiver uses port 5000. If the server can't bind, or `curl` returns an empty `403 Forbidden` with `Server: AirTunes`, set `PORT=5001` in `server/.env`, restart with `npm start`, and use port 5001 in every command below.

## Quickstart

Once the server is running, this request returns every member:

```
curl http://localhost:5000/api/members
```

Response (200):

```json
[{"id":"anna","name":"Anna","initials":"AN","reliability":85,"group_id":"g1","group_name":"Study Group Alpha"}]
```

The full list has every member, and the example above shows only the first one.

## Endpoints

The examples below change data. Run them in the order shown: each create example is followed by its update and delete. Each example uses its own temporary ID so it doesn't clash with the sample data.

### Members

**GET /api/members** returns all members:

```
curl http://localhost:5000/api/members
```

Response (200): an array of member objects, the same shape as the quickstart example.

**POST /api/members** creates a member. The body needs `id`, `name`, and `initials`. `reliability` (0–100, default 100) and `group_id` are optional.

```
curl -X POST -H "Content-Type: application/json" \
  -d '{"id":"rdm2","name":"Test Member","initials":"TM","reliability":90,"group_id":"g1"}' \
  http://localhost:5000/api/members
```

Response (201):

```json
{"id":"rdm2","name":"Test Member","initials":"TM","reliability":90,"group_id":"g1"}
```

**PUT /api/members/{id}** replaces a member's `name`, `initials`, `reliability`, and `group_id`:

```
curl -X PUT -H "Content-Type: application/json" \
  -d '{"name":"Test Member","initials":"TM","reliability":75,"group_id":"g1"}' \
  http://localhost:5000/api/members/rdm2
```

Response (200):

```json
{"id":"rdm2","name":"Test Member","initials":"TM","reliability":75,"group_id":"g1"}
```

**DELETE /api/members/{id}** deletes a member:

```
curl -i -X DELETE http://localhost:5000/api/members/rdm2
```

Response (204): no body.

### Tasks

**GET /api/tasks** returns all tasks:

```
curl http://localhost:5000/api/tasks
```

Response (200):

```json
[{"id":"debug-task","title":"API Test Task","assigned_to":"anna","status":"pending","deadline":"2030-12-31T07:00:00.000Z"}]
```

**POST /api/tasks** creates a task. The body needs `id` (10 characters or fewer), `title`, `assigned_to` (an existing member ID), and `deadline`. `status` is optional and defaults to `pending`.

```
curl -X POST -H "Content-Type: application/json" \
  -d '{"id":"rdm1","title":"Write README","assigned_to":"anna","deadline":"2026-10-20"}' \
  http://localhost:5000/api/tasks
```

Response (201):

```json
{"id":"rdm1","title":"Write README","assigned_to":"anna","status":"pending","deadline":"2026-10-20"}
```

**PATCH /api/tasks/{id}** updates any of `title`, `assigned_to`, `status`, `deadline`:

```
curl -X PATCH -H "Content-Type: application/json" -d '{"status":"done"}' \
  http://localhost:5000/api/tasks/rdm1
```

Response (200):

```json
{"id":"rdm1","title":"Write README","assigned_to":"anna","status":"done","deadline":"2026-10-19T21:00:00.000Z"}
```

**DELETE /api/tasks/{id}** deletes a task:

```
curl -i -X DELETE http://localhost:5000/api/tasks/rdm1
```

Response (204): no body.

### Reliability and activity

**GET /users/{userId}/reliability-score** returns one member's reliability score:

```
curl http://localhost:5000/users/anna/reliability-score
```

Response (200):

```json
{"user_id":"anna","user_name":"Anna","reliability_score":85}
```

**GET /users/{userId}/activity** returns a member's activity log:

```
curl http://localhost:5000/users/anna/activity
```

Response (200):

```json
[{"member_id":"anna","activity_date":"2026-09-05T21:00:00Z","minutes_studied":45},{"member_id":"anna","activity_date":"2026-09-06T21:00:00Z","minutes_studied":30}]
```

**GET /api/activity** returns activity for all members. Add `?member=anna` to filter to one member:

```
curl "http://localhost:5000/api/activity?member=anna"
```

Response (200): the same shape as the `/users/{userId}/activity` example above, with one entry per activity record.

### Deadlines and calendar

**GET /api/deadlines** requires `from` and `to` dates in ISO 8601 format (`YYYY-MM-DD`):

```
curl "http://localhost:5000/api/deadlines?from=2026-09-01&to=2026-12-31"
```

Response (200):

```json
[{"id":"t2","title":"Read chapter 6 notes","assigned_to":"ben","status":"late","deadline":"2026-09-05T20:59:00.000Z"}]
```

**GET /calendar-events** returns the same data as `/api/deadlines`, and takes the same `from` and `to` parameters.

### Flashcards

**GET /api/flashcards** returns all flashcard decks, each with its cards:

```
curl http://localhost:5000/api/flashcards
```

Response (200):

```json
[{"id":"d1","title":"Data Structures Basics","owner_id":"anna","shared_with_group":"g1","cards":[{"id":"f1","deck_id":"d1","question":"What is a hash table?","answer":"A data structure that maps keys to values for O(1) average lookup"}]}]
```

## Errors

The JSON format below applies to errors from the API's routes. A request to a path that doesn't exist gets Express's default HTML page (`Cannot GET /path`) with status 404, not JSON.

Errors from the API routes return a JSON body with one `error` string:

```json
{"error":"id, title, assigned_to, and deadline are required"}
```

Check the status code first: 2xx means success, and 4xx or 5xx means the request failed. The `error` string says what went wrong.

Examples:

| Request | Status | Body |
|---|---|---|
| `POST /api/members` with no body | 400 | `{"error":"id, name, and initials are required"}` |
| `POST /api/tasks` with missing fields | 400 | `{"error":"id, title, assigned_to, and deadline are required"}` |
| `GET /api/deadlines?from=2026-09-01` (no `to`) | 400 | `{"error":"Both from and to are required for date range query"}` |
| `GET /api/deadlines?from=bad&to=2026-12-31` | 400 | `{"error":"Invalid date format. Use ISO 8601 format (e.g., 2026-09-01)"}` |
| `PUT /api/members/nobody` (no such member) | 404 | `{"error":"Member not found"}` |
| `DELETE /api/members/nobody` (no such member) | 404 | `{"error":"Member not found"}` |
| `PATCH /api/tasks/9999` (no such task) | 404 | `{"error":"Task not found"}` |
| `DELETE /api/tasks/9999` (no such task) | 404 | `{"error":"Task not found"}` |
| `GET /users/ghost/reliability-score` | 404 | `{"error":"User not found"}` |

## Known limitations

- **IDs are limited to 10 characters.** The database column is `VARCHAR(10)`. A longer ID is silently truncated on save, but the API still returns 201 with the untruncated ID, so later lookups fail. Keep IDs at 10 characters or fewer.
- **Date-only deadlines shift by a day.** A deadline sent as `2026-10-20` is stored and returned as `2026-10-19T21:00:00.000Z`, which is local midnight in Nairobi, shown in UTC.
- **No authentication.** Anyone who can reach the server can read and change its data.
