
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