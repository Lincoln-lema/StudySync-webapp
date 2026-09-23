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
