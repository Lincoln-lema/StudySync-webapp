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

## Part D: Failure Handling Tests

We tested the following failure scenarios to ensure our integration handles errors gracefully:

1. **Partner API Down:**
   - **Action:** Stopped the local SettleIn stand-in (`mock-settlein.js`) and reloaded the frontend.
   - **Result:** The app did not crash or show a blank page. It correctly displayed the friendly fallback message: *"Partner data is unavailable right now."* Our own backend server remained running and responsive to other routes.
   - **Terminal Log:** The backend logged `SettleIn amenities call failed: ECONNREFUSED`, correctly identifying that the partner server was offline.

2. **Invalid Property ID:**
   - **Action:** Tested a request for a non-existent property (`/api/properties/nope/study-amenities`).
   - **Result:** The backend correctly intercepted SettleIn's `404 Not Found`, and returned a clean `404` to our frontend.

3. **Recovery:**
   - **Action:** Restarted the SettleIn stand-in.
   - **Result:** Without changing any code, the frontend successfully recovered and displayed the partner data upon the next page load.

## Part E: Downstream Consumer (Jua Kali)
- **Action:** Started a `cloudflared` tunnel to expose our StudySync API to our downstream partner.
- **Status:** Providing our live tunnel URL and our Week 9 API key to Jua Kali so they can consume our endpoints. Monitoring our terminal for any `401` (auth errors) or `404` (wrong paths) from their team.