# Contract Questions — SettleIn (Team 1) API Review

**Evaluating Team:** StudySync (Team 2) — Student Group Collaboration & Study Coordination Platform  
**Upstream Partner Reviewed:** SettleIn (Team 1) — Student Housing & Accommodation Marketplace  
**Target Specification:** SettleIn openapi.yaml (5 endpoints for residence areas, accommodation amenities, lease timelines, verified profiles, and group housing inquiries)

> **Status: RESOLVED** — SettleIn's updated `openapi.yaml` (v1.0.0) answers all three questions below. See the [Resolution Summary](#resolution-summary) at the bottom of this document.

---

## Overview

As future consumers of SettleIn's API, StudySync conducted an in-depth contract review of their endpoint specifications. Below are three specific, technical questions and ambiguities identified in SettleIn's contract that require clarification before we begin integration development in Week 5.

---

## Question 1: Ambiguity in Coordinate Format and Distance Unit for Residence-Area Proximity Calculations

**Endpoint Affected:** `GET /api/v1/users/{id}/residence-area`

**Specific Field(s):** `location_coordinates`, `distance_to_campus`, and `neighborhood_level_privacy`

**Identified Ambiguity:**

The endpoint is documented to return "general location coordinates" and "distance to campus" for calculating central meetup locations between team members. However, the response schema is missing critical precision details:

1. **Coordinate Format:** Are coordinates returned as:
   - `{ latitude: number, longitude: number }` (separate fields)?
   - A single GeoJSON Point object `{ type: "Point", coordinates: [lon, lat] }`?
   - A string like `"-1.2345,36.7890"`?

2. **Distance Unit:** Is `distance_to_campus` measured in:
   - Kilometers (e.g., `2.5`)?
   - Meters (e.g., `2500`)?
   - Walking time in minutes (e.g., `15`)?
   - Driving time in minutes?

3. **Precision & Privacy Boundary:** The API_NEEDS states "neighborhood-level privacy only (e.g., 'Madaraka', 'Parklands')" — does this mean:
   - Coordinates are rounded/truncated to neighborhood-level granularity (e.g., ±0.01 degrees)?
   - Or the `neighborhood_name` is returned as a string, with raw coordinates available only to authenticated group members?

4. **Stale Data Handling:** Is there a `fetched_at` or `updated_at` timestamp in the response so StudySync can detect if residence data is stale (e.g., a student moved but the API returns cached old data)?

**Why This Matters:**

StudySync's meetup map feature calculates midpoints between group members using `( (lat1+lat2)/2, (lon1+lon2)/2 )`. If coordinates are returned in an unexpected format or at the wrong precision, the calculated meeting venues will be incorrect, and our group collaboration feature will fail silently.

**Actionable Clarification Requested for SettleIn:**

```
1. Please specify the exact coordinate format (separate lat/lon fields, GeoJSON, or string).
2. Please specify the distance unit and whether it accounts for walking/driving routes or 
   straight-line distance.
3. Clarify the privacy boundary: are raw coordinates returned, or only neighborhood names? 
   If coordinates are returned, to what decimal precision?
4. Include a timestamp field (e.g., "updated_at": "2026-02-09T10:00:00Z") so we can 
   determine data freshness and cache appropriately.
```

---

## Question 2: Missing Error Responses, Validation Constraints, and Null-Handling Semantics for Study-Amenities Endpoint

**Endpoint Affected:** `GET /api/v1/accommodations/{id}/study-amenities`

**Specific Field(s):** `wifi_rating`, `dedicated_desk_space`, `backup_generator`, `quiet_hours_policy`, and response error schemas

**Identified Ambiguity:**

The endpoint documentation lacks critical edge-case specifications:

1. **Error Cases:** The contract only documents a 200 OK response. What HTTP status codes are returned if:
   - An invalid accommodation ID is provided (e.g., non-existent ID or malformed UUID)?
   - The accommodation exists but has no amenity data on record?
   - The authenticated student lacks permission to view that accommodation's details?
   
   Are error responses structured as `{ "error": "...", "code": "..." }` or some other format?

2. **Nullable/Missing Fields:** The schema doesn't indicate which amenity fields are optional:
   - Is `wifi_rating` required, or can it be `null` if the accommodation hasn't been rated?
   - If `backup_generator: false`, is the field still returned, or omitted entirely?
   - Does `quiet_hours_policy` have an enum (e.g., `["flexible", "strict", "not_specified"]`), or is it free-form text?

3. **Rating Scale & Boundaries:** For `wifi_rating`, what is the valid range?
   - Integer 1–5 (like Airbnb)?
   - Decimal 0.0–10.0?
   - Categorical ("excellent", "good", "poor")?

4. **Caching & Freshness:** Similar to Question 1, is there a `fetched_at` or HTTP `Cache-Control` header so StudySync knows whether amenity data is real-time or cached?

**Why This Matters:**

StudySync displays amenity badges (Wi-Fi speed, desk space, backup power) on the group venue selection screen. If a field is unexpectedly `null` or missing, our frontend logic (`if (amenities.wifi_rating > 4)`) will crash or show incorrect information. Without knowing error response schemas, we can't gracefully handle API failures.

**Actionable Clarification Requested for SettleIn:**

```
1. Define all possible HTTP error responses (400, 404, 403, 5xx) with their JSON schemas.
2. Specify which amenity fields are required vs. optional, and what null/omitted values mean.
3. Define the exact scale/format for wifi_rating, dedicated_desk_space, and backup_generator 
   (e.g., boolean, 1-5 integer, percentage, or enum).
4. Document quiet_hours_policy as an enum (e.g., ["flexible", "strict", "custom"]) 
   or free-form string, and provide an example value.
5. Include a timestamp field (updated_at or Last-Modified header) so we can validate 
   data freshness for study session planning.
```

---

## Question 3: Ambiguous Lease Timeline Date Semantics, Timezone Handling, and Multi-Lease Scenarios

**Endpoint Affected:** `GET /api/v1/students/{id}/lease-timeline`

**Specific Field(s):** `lease_start_date`, `lease_end_date`, `move_in_date`, and timezone information

**Identified Ambiguity:**

The API_NEEDS statement says StudySync needs "lease start and move-in dates...to automatically flag student relocation periods as busy/unavailable on the group collaboration calendar." However, the endpoint specification is missing several critical details:

1. **Multiple Active Leases:** Can a student have multiple concurrent or overlapping leases (e.g., transitioning from one dorm to another)?
   - Does the endpoint return a single lease object, an array, or just the "active" lease?
   - If an array, is there a `is_active` flag or date range to indicate which lease is current?

2. **Date Format & Timezone:** Are `lease_start_date` and `move_in_date` returned as:
   - ISO 8601 strings with timezone info (`"2026-02-15T00:00:00Z"` or `"2026-02-15T00:00:00+03:00"`)?
   - Date-only strings (`"2026-02-15"`)?
   - Unix timestamps (seconds since epoch)?
   
   If timezone information is omitted, StudySync's calendar feature cannot correctly map "move-in on Feb 15" to the correct UTC time, leading to calendar sync errors.

3. **Lease Duration vs. End Date:** Should StudySync expect:
   - Both `lease_start_date` and `lease_end_date` (explicit range)?
   - Or `lease_start_date` + `lease_duration_months` (compute end date)?
   
   This matters for displaying "busy" blocks on the group calendar.

4. **Partial/Incomplete Data:** What if a student has signed a lease but the move-in date hasn't been confirmed yet?
   - Is `move_in_date` nullable (`null`) or omitted entirely?
   - Is there a `status` field (e.g., `"pending"`, `"confirmed"`, `"moved_in"`) to distinguish?

5. **Update Frequency & Caching:** When does lease timeline data get refreshed?
   - Is it fetched on every group calendar load (expensive)?
   - Is there a recommended cache TTL?
   - Is there a `fetched_at` or `Last-Modified` timestamp so StudySync can cache intelligently?

**Why This Matters:**

StudySync's group calendar marks student unavailability during relocation. If we don't know:
- Whether a lease is active or in the past
- The exact timezone of the move-in date
- Whether there are multiple concurrent leases

...our calendar feature will show incorrect busy blocks, causing group scheduling conflicts or missed availability windows.

**Actionable Clarification Requested for SettleIn:**

```
1. Specify whether the endpoint returns a single lease, an array of leases, or only the active lease.
   If array: include an is_active field and/or date comparison logic to identify the current lease.

2. Confirm date format is ISO 8601 with timezone info (e.g., "2026-02-15T00:00:00+03:00" for EAT).
   If different, provide the exact format and timezone handling instructions.

3. Clarify whether to expect both lease_end_date AND lease_duration_months, or just one of them.

4. Define null/omitted semantics:
   - If move_in_date is not yet confirmed, is it null or omitted?
   - Include a status field (e.g., "pending", "confirmed", "in_progress", "completed") 
     to distinguish lease lifecycle states.

5. Include a fetched_at timestamp so StudySync can cache lease data and avoid redundant API calls.
   Recommend a cache TTL based on typical lease update frequency.
```

---

## Deliverable Sign-Off

✅ **Specification Reviewed:** SettleIn's 5-endpoint openapi.yaml for residence areas, accommodation amenities, lease timelines, verified profiles, and group housing inquiries.

✅ **Precision Gaps Identified:** 3 critical questions covering coordinate formats, error handling, amenity rating scales, lease multi-tenancy, timezone semantics, and data freshness indicators.

✅ **Actionable Feedback:** Each question includes specific, technical clarifications requested to unblock StudySync development in Week 5.

---

## Resolution Summary

SettleIn addressed all three questions in `openapi.yaml` v1.0.0. Integration is now unblocked; StudySync's client lives in `src/api/settlein.js` with integration test stubs in `server/integration/settlein.test.js`.

### Question 1 → Residence-Area Coordinates, Distance, Privacy & Freshness

| Concern | Resolved by SettleIn openapi.yaml |
| --- | --- |
| Coordinate format | `coordinates: { latitude: number, longitude: number }` — separate fields, ranges `[-90,90]` and `[-180,180]` |
| Distance unit | `distance_to_campus_km` (float `min: 0.0`) — walking/transit distance to the campus gate in kilometers |
| Privacy boundary | Neighborhood-level only: `estate_name` string returned; exact building/room number redacted |
| Data freshness | `cached_at` (ISO 8601 date-time) returned on every residence-area response |

### Question 2 → Study-Amenities Errors, Null Semantics, Rating Scale & Freshness

| Concern | Resolved by SettleIn openapi.yaml |
| --- | --- |
| Error responses | Unified `ErrorResponse { error, message, status_code, timestamp }` documented for `401`, `404`, `500` on every endpoint |
| Nullable/optional fields | All amenity fields are `required`; booleans (`has_dedicated_desk`, `has_backup_generator`) always present; `quiet_hours` is an object with `starts_at`/`ends_at` (24-h `HH:mm` regex) and `policy_enforced` |
| Rating scale | `wifi_rating` float `1.0–5.0`; `wifi_speed_mbps` integer |
| Freshness | `last_inspected_at` (ISO 8601 date-time) indicating last verified inspection |

### Question 3 → Lease Timeline Semantics, Timezone, Multi-Lease & Caching

| Concern | Resolved by SettleIn openapi.yaml |
| --- | --- |
| Multiple/single leases | Single lease object per student identified by `booking_id`, with lifecycle via `lease_status` enum (`pending`, `confirmed`, `active`, `terminated`, `completed`) |
| Date format & timezone | `move_in_date` is ISO 8601 date-time (`Z`); `lease_start_date`/`lease_end_date` are date-only (`YYYY-MM-DD`) |
| End date provided | `lease_end_date` is explicit and required — no duration computation needed |
| Partial/incomplete data | Covered by the `lease_status` enum (e.g., `pending`) rather than null-swallowing |
| Busy-window semantics | `relocation_window_start`/`relocation_window_end` (ISO 8601) plus computed `is_relocating: boolean` for calendar unavailability |

---

## Next Steps

- [x] Spec reviewed and questions resolved against SettleIn `openapi.yaml` v1.0.0
- [x] SettleIn API client generated in `src/api/settlein.js`
- [ ] Enable `server/integration/settlein.test.js` (`SETTLEIN_LIVE_TESTS=1`) once SettleIn's server is reachable
- [ ] Wire residence-area, amenities, and lease data into the Calendar/Group/Housing pages

**Date Submitted:** Week 4  
**Date Resolved:** 2026-09-16 (after SettleIn published openapi.yaml v1.0.0)  
**Target Resolution Date:** Before Week 5 build kickoff

---

**Reviewed By:** StudySync Engineering Team (Lincoln Langat - API Lead, Bruce Kilonzi - Backend Dev, Brian Ndaba - QA Lead, Julie Kertich - DevOps Lead)
