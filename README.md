# StudySync API

StudySync is a study-management API for a student group. It supports members, shared tasks, deadlines, activity logs, and flashcard decks. It is designed for the student group's frontend and partner teams integrating with the API.

The complete API contract is available in [`openapi.yaml`](openapi.yaml), with a rendered version in [`docs/index.html`](docs/index.html).

## Table of Contents

- [Authentication & Rate Limiting](#authentication--rate-limiting)
- [Base URL](#base-url)
- [Run Locally](#run-locally)
- [Quickstart](#quickstart)
- [API Endpoints](#api-endpoints)
  - [Members](#members)
  - [Tasks](#tasks)
  - [Reliability & Activity](#reliability--activity)
  - [Deadlines & Calendar](#deadlines--calendar)
  - [Flashcards](#flashcards)
- [Error Handling](#error-handling)
- [Known Limitations](#known-limitations)

---

## Authentication & Rate Limiting

Every request requires a valid `X-API-Key` header. Requests without a valid key receive a `401 Unauthorized` response.

**Do not use an `Authorization` header.**

### Authentication Header

```http
X-API-Key: <your-api-key>
```

### Rate Limiting

The API enforces a limit of **100 requests per minute per API key**.

If the limit is exceeded, the API returns `429 Too Many Requests`. The response includes information indicating when you can retry.

Example response:

```json
{
  "message": "Too many requests",
  "retryAfter": 60
}
```

The `retryAfter` value indicates the number of seconds to wait before retrying.

## Base URL

The local base URL is:

```text
http://localhost:5000
```

Append each endpoint path exactly as documented. Some paths start with `/api`, while others do not. Do not add or remove `/api` manually.

| Resource | Endpoint prefix |
|---|---|
| Members | `/api/members` |
| Tasks | `/api/tasks` |
| Deadlines | `/api/deadlines` |
| Activity | `/api/activity` |
| Flashcards | `/api/flashcards` |
| Reliability score | `/users/{userId}/reliability-score` |
| User activity | `/users/{userId}/activity` |
| Calendar events | `/calendar-events` |

### Hosted Instances

For a hosted instance, replace only the host with your deployment URL.

For example:

```text
https://your-tunnel.trycloudflare.com/api/members
```

The production server URL specified in `openapi.yaml` is a placeholder and is not a live endpoint.

---

## Run Locally

Follow these steps to run the API from a clean clone.

### 1. Clone the Repository

```bash
git clone https://github.com/Lincoln-lema/StudySync-webapp.git
cd StudySync-webapp/server
npm install
```

### 2. Start MySQL

If you are using XAMPP, open the XAMPP Control Panel and click **Start** next to MySQL.

### 3. Create the Database and Tables

Follow steps 2–3 in [`SETUP.md`](SETUP.md) to create the database and initial tables.

Additional schema definitions are available in:

```text
server/schema_additions.sql
```

### 4. Configure Environment Variables

Create a `.env` file inside the `server` directory.

Add the following variables, replacing the example values with your actual configuration:

```dotenv
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your-mysql-password
DB_NAME=studysync
DB_PORT=3306
PORT=5000
API_KEYS=your-api-key-here
```

**Important:** Keep your `.env` file private. Do not commit real API keys or database credentials to version control.

### 5. Start the Server

From the `server` directory, run:

```bash
npm start
```

A successful startup prints:

```text
Server running on port 5000
```

### macOS Port Conflict

On macOS, AirPlay Receiver may use port `5000`.

If the server cannot bind to the port, or `curl` returns an empty `403 Forbidden` response with `Server: AirTunes`, change the port in `server/.env`:

```dotenv
PORT=5001
```

Restart the server using `npm start` and use port `5001` in all subsequent commands.

---

## Quickstart

Once the server is running, retrieve all members with the following request:

```bash
curl -H "X-API-Key: <your-api-key>" \
  http://localhost:5000/api/members
```

### Example Response — `200 OK`

```json
[
  {
    "id": "anna",
    "name": "Anna",
    "initials": "AN",
    "reliability": 85,
    "group_id": "g1",
    "group_name": "Study Group Alpha"
  }
]
```

The response contains the full list of members. The example above shows only one member.

---

## API Endpoints

The following examples demonstrate the available API endpoints and their expected responses.

**Note:** Some examples create, update, or delete data. Run the create, update, and delete examples in order. The examples use temporary IDs to avoid conflicts with existing sample data.

All requests require the `X-API-Key` header.

## Members

### `GET /api/members`

Returns all members.

**Request**

```bash
curl -H "X-API-Key: <your-api-key>" \
  http://localhost:5000/api/members
```

**Response — `200 OK`**

Returns an array of member objects, as shown in the Quickstart example.

### `POST /api/members`

Creates a new member.

**Required fields**

- `id` — unique member identifier.
- `name` — member's name.
- `initials` — member's initials.

**Optional fields**

- `reliability` — reliability score from `0` to `100`; defaults to `100`.
- `group_id` — identifier of the member's group.

**Request**

```bash
curl -X POST \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"id":"rdm2","name":"Test Member","initials":"TM","reliability":90,"group_id":"g1"}' \
  http://localhost:5000/api/members
```

**Response — `201 Created`**

```json
{
  "id": "rdm2",
  "name": "Test Member",
  "initials": "TM",
  "reliability": 90,
  "group_id": "g1"
}
```

### `PUT /api/members/{id}`

Replaces a member's name, initials, reliability score, and group assignment.

**Request**

```bash
curl -X PUT \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Member","initials":"TM","reliability":75,"group_id":"g1"}' \
  http://localhost:5000/api/members/rdm2
```

**Response — `200 OK`**

```json
{
  "id": "rdm2",
  "name": "Test Member",
  "initials": "TM",
  "reliability": 75,
  "group_id": "g1"
}
```

### `DELETE /api/members/{id}`

Deletes a member.

**Request**

```bash
curl -i -X DELETE \
  -H "X-API-Key: <your-api-key>" \
  http://localhost:5000/api/members/rdm2
```

**Response — `204 No Content`**

No response body is returned.

---

## Tasks

### `GET /api/tasks`

Returns all tasks.

**Request**

```bash
curl -H "X-API-Key: <your-api-key>" \
  http://localhost:5000/api/tasks
```

**Response — `200 OK`**

```json
[
  {
    "id": "debug-task",
    "title": "API Test Task",
    "assigned_to": "anna",
    "status": "pending",
    "deadline": "2030-12-31T07:00:00.000Z"
  }
]
```

### `POST /api/tasks`

Creates a new task.

**Required fields**

- `id` — task identifier, limited to 10 characters.
- `title` — task title.
- `assigned_to` — ID of an existing member.
- `deadline` — task deadline.

**Optional fields**

- `status` — task status; defaults to `pending`.

**Request**

```bash
curl -X POST \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"id":"rdm1","title":"Write README","assigned_to":"anna","deadline":"2026-10-20"}' \
  http://localhost:5000/api/tasks
```

**Response — `201 Created`**

```json
{
  "id": "rdm1",
  "title": "Write README",
  "assigned_to": "anna",
  "status": "pending",
  "deadline": "2026-10-20"
}
```

### `PATCH /api/tasks/{id}`

Updates one or more task fields. Supported fields are:

- `title`
- `assigned_to`
- `status`
- `deadline`

**Request**

```bash
curl -X PATCH \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"status":"done"}' \
  http://localhost:5000/api/tasks/rdm1
```

**Response — `200 OK`**

```json
{
  "id": "rdm1",
  "title": "Write README",
  "assigned_to": "anna",
  "status": "done",
  "deadline": "2026-10-19T21:00:00.000Z"
}
```

The returned deadline illustrates the date-only deadline conversion described in [Known Limitations](#known-limitations).

### `DELETE /api/tasks/{id}`

Deletes a task.

**Request**

```bash
curl -i -X DELETE \
  -H "X-API-Key: <your-api-key>" \
  http://localhost:5000/api/tasks/rdm1
```

**Response — `204 No Content`**

No response body is returned.

---

## Reliability & Activity

### `GET /users/{userId}/reliability-score`

Returns the reliability score of a specific member.

**Example request**

```bash
curl -H "X-API-Key: <your-api-key>" \
  http://localhost:5000/users/anna/reliability-score
```

**Response — `200 OK`**

```json
{
  "user_id": "anna",
  "user_name": "Anna",
  "reliability_score": 85
}
```

### `GET /users/{userId}/activity`

Returns the activity log for a specific member.

**Example request**

```bash
curl -H "X-API-Key: <your-api-key>" \
  http://localhost:5000/users/anna/activity
```

**Response — `200 OK`**

```json
[
  {
    "member_id": "anna",
    "activity_date": "2026-09-05T21:00:00Z",
    "minutes_studied": 45
  },
  {
    "member_id": "anna",
    "activity_date": "2026-09-06T21:00:00Z",
    "minutes_studied": 30
  }
]
```

### `GET /api/activity`

Returns activity records for all members.

To filter activity by member, add the `member` query parameter.

**Example request**

```bash
curl -H "X-API-Key: <your-api-key>" \
  "http://localhost:5000/api/activity?member=anna"
```

**Response — `200 OK`**

Returns activity records in the same format as `/users/{userId}/activity`, with one entry per activity record matching the query.

---

## Deadlines & Calendar

### `GET /api/deadlines`

Returns deadlines within a specified date range.

**Required query parameters**

- `from` — start date in ISO 8601 date format (`YYYY-MM-DD`).
- `to` — end date in ISO 8601 date format (`YYYY-MM-DD`).

Both parameters are required.

**Example request**

```bash
curl -H "X-API-Key: <your-api-key>" \
  "http://localhost:5000/api/deadlines?from=2026-09-01&to=2026-12-31"
```

**Response — `200 OK`**

```json
[
  {
    "id": "t2",
    "title": "Read chapter 6 notes",
    "assigned_to": "ben",
    "status": "late",
    "deadline": "2026-09-05T20:59:00.000Z"
  }
]
```

### `GET /calendar-events`

Returns the same data as `/api/deadlines` and accepts the same `from` and `to` query parameters.

**Example request**

```bash
curl -H "X-API-Key: <your-api-key>" \
  "http://localhost:5000/calendar-events?from=2026-09-01&to=2026-12-31"
```

---

## Flashcards

### `GET /api/flashcards`

Returns all flashcard decks, including their associated cards.

**Request**

```bash
curl -H "X-API-Key: <your-api-key>" \
  http://localhost:5000/api/flashcards
```

**Response — `200 OK`**

```json
[
  {
    "id": "d1",
    "title": "Data Structures Basics",
    "owner_id": "anna",
    "shared_with_group": "g1",
    "cards": [
      {
        "id": "f1",
        "deck_id": "d1",
        "question": "What is a hash table?",
        "answer": "A data structure that maps keys to values for O(1) average lookup"
      }
    ]
  }
]
```

---

## Error Handling

The API returns JSON error responses for errors handled by its routes.

A request to a nonexistent route returns Express's default HTML error page, such as `Cannot GET /path`, with status `404 Not Found`. It does not return the JSON format described below.

### Error Response Format

Route-level errors generally return a JSON object containing an `error` or `message` field.

Example validation error:

```json
{
  "error": "id, title, assigned_to, and deadline are required"
}
```

Authentication errors and rate-limit errors use the `message` field.

### Common HTTP Status Codes

| Status code | Meaning |
|---|---|
| `200 OK` | Request completed successfully. |
| `201 Created` | Resource created successfully. |
| `204 No Content` | Request succeeded without a response body. |
| `400 Bad Request` | Request contains missing or invalid data. |
| `401 Unauthorized` | API key is missing or invalid. |
| `404 Not Found` | Requested resource does not exist. |
| `429 Too Many Requests` | Rate limit exceeded. |
| `500 Internal Server Error` | Server encountered an unexpected error. |

### Common Error Responses

| Scenario | Status | Response body |
|---|---:|---|
| Request without a valid `X-API-Key` | `401` | `{"message":"Missing or invalid API key"}` |
| More than 100 requests per minute | `429` | `{"message":"Too many requests","retryAfter":60}` |
| `POST /api/members` with no body | `400` | `{"error":"id, name, and initials are required"}` |
| `POST /api/tasks` with required fields missing | `400` | `{"error":"id, title, assigned_to, and deadline are required"}` |
| `GET /api/deadlines?from=2026-09-01` without `to` | `400` | `{"error":"Both from and to are required for date range query"}` |
| `GET /api/deadlines?from=bad&to=2026-12-31` | `400` | `{"error":"Invalid date format. Use ISO 8601 format (e.g., 2026-09-01)"}` |
| `PUT /api/members/nobody` for a nonexistent member | `404` | `{"error":"Member not found"}` |
| `DELETE /api/members/nobody` for a nonexistent member | `404` | `{"error":"Member not found"}` |
| `PATCH /api/tasks/9999` for a nonexistent task | `404` | `{"error":"Task not found"}` |
| `DELETE /api/tasks/9999` for a nonexistent task | `404` | `{"error":"Task not found"}` |
| `GET /users/ghost/reliability-score` for a nonexistent user | `404` | `{"error":"User not found"}` |

Check the HTTP status code first when handling errors. A `2xx` status indicates success, while a `4xx` or `5xx` status indicates a client-side or server-side failure.

---

## Known Limitations

### 1. ID Length

IDs are limited to **10 characters** because the database column is defined as `VARCHAR(10)`.

Longer IDs may be silently truncated when saved. The API may still return `201 Created` with the original, untruncated ID, causing subsequent lookups to fail.

**Recommendation:** Keep all IDs at 10 characters or fewer.

### 2. Date-Only Deadline Conversion

Date-only deadlines may appear to shift by one day when returned in UTC.

For example, a deadline submitted as:

```text
2026-10-20
```

may be stored and returned as:

```text
2026-10-19T21:00:00.000Z
```

This timestamp corresponds to midnight on October 20 in Nairobi, represented in UTC (UTC+3).

When interpreting date-only deadlines, account for the timezone conversion.

### 3. In-Memory Rate Limiting

Rate-limit counters are stored in memory. Restarting the server resets the request counters.

### 4. API Key Configuration

API keys are loaded from the `.env` file at startup. Restarting the server reloads the configured keys.

Changes to the API key configuration therefore require a server restart.

---

## API Contract & Documentation

For the complete endpoint definitions, request schemas, response schemas, and API contract, refer to:

- [`openapi.yaml`](openapi.yaml) — OpenAPI specification.
- [`docs/index.html`](docs/index.html) — rendered API documentation.
- [`SETUP.md`](SETUP.md) — local database and setup instructions.

