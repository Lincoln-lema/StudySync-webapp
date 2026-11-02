https://github.com/Lincoln-lema/StudySync-webapp.git

# Contract Deviations — Week 5

Two changes were made to `openapi.yaml` during implementation. Both were confirmed against the real database schema before changing the contract — see reasoning below.

## 1. `Task.id`, `Deadline.id`, and `group_id` — type changed from `integer` to `string`

**What changed:** In the `Task`, `Deadline`, and `Member` schemas, the `id`/`group_id` fields were typed as `integer` in the Week 4 contract. Changed to `string`.

**Why:** The actual `tasks` table uses string primary keys (`t1`, `t2`, `t3`, ...) and `groups_table` uses string IDs (`g1`, `g2`, ...) — the same convention already used for `Member.id` (e.g. `anna`, `ben`), which the original contract correctly typed as `string`. The database schema was built this way intentionally and is consistent across all tables; the contract's `integer` typing for these two fields was the error, not the implementation. Fixing the contract rather than forcing string IDs into an integer type.

## 2. `FlashcardDeck.shared_with_group` — semantics changed from group ID to derived boolean-backed value

**What changed:** The contract originally implied `shared_with_group` is a group ID value directly stored per deck. In the real schema, `flashcard_decks.shared_with_group` is a `TINYINT(1)` boolean flag (0 or 1), not a group ID — there's no column storing *which* group a deck is shared with.

**How it's implemented:** The API response maps this at query time: if the flag is `1`, the response returns the deck owner's own `group_id` (via a join to `members`); if the flag is `0`, it returns `null`. The contract's field type was changed to nullable `string` to match, and its description updated to explain the derivation.

**Why this one is a deviation, not just a type fix:** Unlike #1, this isn't just renaming a type — it's a real behavioral assumption (a deck is only ever "shared" with its owner's own group, never a different one). Flagging this explicitly in case the actual product requirement was for decks to be shareable with any group, which the current schema doesn't support without a schema change.

## No other deviations

All other endpoints, fields, and status codes match the Week 4 contract as written. No fields were added, removed, or renamed beyond the two changes above.

---

# Contract Deviations — Week 6

## Path corrections (contract now matches implementation)

- `/tasks` → `/api/tasks`
- `/deadlines` → `/api/deadlines`
- `/activity` → `/api/activity`
- `/flashcard-decks` → `/api/flashcards`

These paths were documented without the `/api` prefix, but the server has always mounted them with it (see `index.js`). No server code changed — the contract was corrected to describe the existing implementation.

## Bug fix — code did not match Week 5's decision

Week 5's decision above (`FlashcardDeck.shared_with_group` as a derived value) was documented but never implemented: `routes/flashcards.js` was still returning the raw `0`/`1` flag directly instead of deriving the owner's `group_id`. Fixed in Week 6 by joining to `members` on `owner_id` and deriving the value as Week 5 specified. `openapi.yaml` was not changed for this field — it already correctly described the derived-string behavior from Week 5.

## New write endpoints added (contract + implementation)

- `POST /api/members` — now documented with a `requestBody` schema (previously undocumented despite existing in code). Validates `id`, `name`, `initials` required; `reliability` must be 0–100 if provided.
- `PUT /api/members/{id}` — now documented with a `requestBody` schema (previously undocumented despite existing in code). Same validation as POST, minus `id`.
- `DELETE /api/members/{id}` — new endpoint. Returns 404 if the member does not exist.
- `POST /api/tasks` — new endpoint. Requires `id`, `title`, `assigned_to`, `deadline`; validates `assigned_to` references an existing member before creating the task.
- `PATCH /api/tasks/{id}` — new endpoint. Accepts any subset of `title`, `assigned_to`, `status`, `deadline`; requires at least one field; returns 404 if the task does not exist.
- `DELETE /api/tasks/{id}` — new endpoint. Returns 404 if the task does not exist.

## Not yet implemented (unchanged from prior weeks, flagged for visibility)

- `GET /calendar-events`
- `GET /users/{userId}/activity`
- `GET /users/{userId}/reliability-score`

These remain documented in the contract as planned/future work per `API_NEEDS.md`, but have no corresponding route in the server as of Week 6.

## Week 6 follow-up: length validation and error bodies

- Write endpoints now reject over-long values with 400 instead of letting the database truncate them silently: member id and group_id 10, name 100, initials 5; task id 10, title 150. The openapi.yaml request bodies declare the same minLength/maxLength, plus minProperties: 1 on PATCH /api/tasks/{id}.
- 401 and 429 responses now include `error` as well as `message`, so they match the contract's Error schema. `message` is kept for existing consumers. The contract documents both through shared components.responses (Unauthorized, TooManyRequests).
- openapi.yaml also declares maxLength on the Member, Task and Deadline response schemas, with the same limits.

---

# Contract Deviations — Week 10

`openapi.yaml` is now version **1.2.0**. No existing path, field, status code or auth rule changed for consumers. The first section corrects the contract to match the code; the second adds new endpoints.

## Corrections (contract now matches implementation)

- `GET /api/tasks`: removed the `groupId` query parameter and its 400 response. The route has never filtered by group or returned a 400.
- `GET /api/flashcards`: removed the `groupId` query parameter and its 400 response, for the same reason.
- `GET /calendar-events`: `from` and `to` are now documented as optional but must be supplied together. Sending only one returns 400 (`Both from and to are required for date range query`). With neither, all deadlines are returned. The code already behaved this way.

## New endpoints (additive)

- `GET /api/properties` — lists properties from the upstream partner (SettleIn).
- `GET /api/properties/{id}/study-amenities` — study amenities for one property. The response is normalized: quiet hours always arrive as a nested `quiet_hours` object, numbers and booleans are coerced, and a `source` field says `live` or `stand-in`. A partner 404 is passed through as 404. If the partner is down or returns an unexpected shape, the response is `502` with `{"error":"Partner data unavailable"}`.
- `GET /api/bookings` — optional filters `memberId`, `propertyId`, and `status` (`confirmed` (default), `cancelled` or `all`).
- `POST /api/bookings` — required: `property_id`, `booked_by` (an existing member id), `session_date` (YYYY-MM-DD, not in the past), `start_time`, `end_time` (HH:MM, end after start). Optional: `guests` (default 1) and `note` (max 200 characters). Before saving, the server fetches the property's amenities from SettleIn and rejects the booking with 400 if guests exceed `max_study_guests` or the session overlaps enforced quiet hours (including windows that cross midnight). Returns 201, 404 for an unknown property, 409 if another confirmed booking overlaps the slot, and 502 if the partner cannot be reached. Nothing is written in the 502 case.
- `DELETE /api/bookings/{id}` — cancels a booking (sets `status` to `cancelled`, the row is kept) and returns `{id, status}`. 404 if the booking does not exist.

New components: `PartnerUnavailable` response and `Property`, `StudyAmenities`, `Booking` schemas.

## Behaviour note

On the properties routes, errors now use `{"error": "..."}` instead of `{"message": "..."}`, matching the contract's Error schema and the rest of the API. Only our own frontend calls these routes.

## Database change

New table `study_bookings`. Teammates run `node scripts/migrate-bookings.js` from `server/` once after pulling.

## Still read-only or local (not deviations, flagged for visibility)

There is no write endpoint for activity logging, flashcard decks or nudges. In the frontend, flashcard decks are demo data and the nudge log is stored in the browser only.
