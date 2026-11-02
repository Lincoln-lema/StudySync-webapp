# Integration Log — Week 10

**Upstream Partner:** SettleIn (Team 1) - Student Housing API  
**Downstream Partner:** Jua Kali (Team 3) - Artisan Services API  

## Part B: First Call (Outside App)
- **Time:** 27 Oct 2026, 20:16 GMT
- **Endpoint:** `GET /api/v1/properties/prop-003/study-amenities`
- **Result:** `200 OK`
- **Contract Check:** The initial live call went smoothly. The payload matched SettleIn's `openapi.yaml` perfectly. The response included a nested `quiet_hours` object (with `starts_at` and `ends_at`), a numeric `wifi_rating`, and boolean flags for `has_dedicated_desk` and `has_backup_generator`. No field mismatches were found on the happy path.

## Bugs and Surprises

| # | What broke (symptom) | Root cause | Fix | Whose code, and who fixed it |
|---|---|---|---|---|
| 1 | `401 Unauthorized` when frontend tried to fetch partner data from our own backend | Week 9 security implementation now requires an `X-API-Key` header on all routes, but the frontend fetch request wasn't sending it. | Updated the frontend `StudySpot.jsx` component to include our own `X-API-Key` in the fetch headers. | Mine, fixed by me |
| 2 | `502 Bad Gateway` on our backend, and frontend displayed "Partner data is unavailable". Terminal logged `SettleIn amenities call failed: ENOTFOUND` | SettleIn's Cloudflare tunnel went offline mid-lab (Cloudflare Error 1033). | Pivoted to a local stand-in (`mock-settlein.js`) on port 4000 using the exact JSON shape from their contract. Updated `SETTLEIN_URL` in `.env` to point to the mock. | Neither—infra outage; worked around by me |
| 3 | Anticipated bug: Contract field mismatch. | SettleIn's earlier undocumented list route returned flat `quiet_hours_start` fields, but their official contract specified a nested `quiet_hours` object. | Built defensive normalization in `server/routes/properties.js` to gracefully handle both the nested object and the flat fallback. | Mine, fixed by me |
| 4 | A real API key was committed in source. `StudySpot.jsx` had our key hard-coded as a fix for bug #1, so it was in git history (commit `861c329`) and in the bundled frontend. | Fixing the 401 by pasting a key into the component put a secret in version control. | Removed the hard-coded key. The frontend now reads `VITE_API_KEY` from a gitignored root `.env`, using a separate web-client key. The old key was removed from `API_KEYS` in `server/.env`, so it now returns 401. It stays visible in git history, so it must be treated as burned. | Mine, fixed by me |
| 5 | Our OpenAPI contract disagreed with the code. The spec listed `groupId` filters on tasks and flashcards and a tasks 400 that the code never had, and treated `from`/`to` on `/calendar-events` as required when the code accepts both-or-neither. | Contract was written before the routes and never reconciled. | Corrected `openapi.yaml` to describe the real behaviour (see `CONTRACT_DEVIATIONS.md`, Week 10) and bumped it to 1.2.0. Regenerated `docs/index.html`. | Mine, fixed by me |
| 6 | The frontend looked finished but showed mock data: members, tasks, dashboard, calendar and heatmap were hard-coded, and Study Spots was view-only. | The prototype predated the backend. | Wired those pages to our own API (`src/api.js`) and added study-spot booking (`/api/bookings`) with partner-aware validation. | Mine, fixed by me |

## Part D: Failure Handling Tests

We tested the following failure scenarios to ensure our integration handles errors gracefully:

1. **Partner API Down:**
   - **Action:** Stopped the local SettleIn stand-in (`mock-settlein.js`) and reloaded the frontend.
   - **Result:** The app did not crash or show a blank page. It correctly displayed the friendly fallback message: *"Partner data is unavailable right now."* Our own backend server remained running and responsive to other routes.
   - **Terminal Log:** The backend logged `SettleIn amenities call failed: ECONNREFUSED`, correctly identifying that the partner server was offline.

2. **Invalid Property ID:**
   - **Action:** Tested a request for a non-existent property (`/api/properties/nope/study-amenities`).
   - **Result:** The backend correctly intercepted SettleIn's `404 Not Found`, and returned a clean `404` to our frontend.

3. **Partner failure while booking (Week 10):**
   - **Action:** Tried to create a booking with the stand-in stopped.
   - **Result:** `POST /api/bookings` returned `502` ("Partner data unavailable, cannot confirm this property right now") and wrote nothing, because we validate guests and quiet hours against SettleIn's data before accepting a booking.

4. **Recovery:**
   - **Action:** Restarted the SettleIn stand-in.
   - **Result:** Without changing any code, the frontend successfully recovered and displayed the partner data upon the next page load.

## Part E: Downstream Consumer (Jua Kali)
- **Action:** Started a `cloudflared` tunnel to expose our StudySync API to our downstream partner.
- **Status:** Providing our live tunnel URL and our Week 9 API key to Jua Kali so they can consume our endpoints. Monitoring our terminal for any `401` (auth errors) or `404` (wrong paths) from their team.

### Update (Week 10, after the first Jua Kali hand-off)
- **Key rotation:** the key committed in bug #4 is retired. Jua Kali's key is a separate entry in `API_KEYS` and was not changed by the rotation. Confirmed on 2 Nov 2026: Jua Kali called our API through the tunnel with their own key after the rotation and got `200 OK`.
- **Contract changes for Jua Kali:** none of the existing paths, fields, status codes or the key header changed. `openapi.yaml` 1.2.0 corrects three documentation errors (see `CONTRACT_DEVIATIONS.md`) and adds `/api/properties`, `/api/properties/{id}/study-amenities` and `/api/bookings` as new, additive endpoints. Jua Kali does not need to call any of them.
- **Tunnel URL** changes every time `cloudflared` restarts. Any restart before the demo means sending Jua Kali the new URL.
- **Test data:** bookings created while testing were cancelled before the demo.
