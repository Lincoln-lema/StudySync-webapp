// Client for the SettleIn (Team 1) accommodation API.
// Contract: https://github.com/Gift10477/settlein-student-housing/blob/main/openapi.yaml
// Override the base URL with VITE_SETTLEIN_API_URL, defaulting to the local SettleIn dev server.

const API_BASE =
  (import.meta.env && import.meta.env.VITE_SETTLEIN_API_URL) ||
  'http://localhost:5000/api/v1';

function authHeaders() {
  const token = localStorage.getItem('settlein_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path, options = {}) {
  const res = await fetch(API_BASE + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(
      body && body.message
        ? `SettleIn ${res.status}: ${body.message}`
        : `SettleIn request failed: ${res.status}`
    );
  }
  return res.json();
}

function normalizeResidenceArea(r) {
  return {
    estateName: r.estate_name,
    distanceToCampusKm: r.distance_to_campus_km,
    nearestCampus: r.nearest_campus,
    coordinates: r.coordinates,
    cachedAt: r.cached_at,
  };
}

function normalizeStudyAmenities(a) {
  return {
    accommodationName: a.accommodation_name,
    wifiRating: a.wifi_rating,
    wifiSpeedMbps: a.wifi_speed_mbps,
    hasDedicatedDesk: a.has_dedicated_desk,
    hasBackupGenerator: a.has_backup_generator,
    quietHours: a.quiet_hours,
    maxStudyGuests: a.max_study_guests,
    lastInspectedAt: a.last_inspected_at,
  };
}

function normalizeLeaseTimeline(l) {
  return {
    bookingId: l.booking_id,
    leaseStatus: l.lease_status,
    moveInDate: l.move_in_date,
    leaseStartDate: l.lease_start_date,
    leaseEndDate: l.lease_end_date,
    relocationWindowStart: l.relocation_window_start,
    relocationWindowEnd: l.relocation_window_end,
    isRelocating: l.is_relocating,
  };
}

function normalizePublicProfile(p) {
  return {
    displayName: p.display_name,
    universityAffiliation: p.university_affiliation,
    campusBranch: p.campus_branch,
    courseOfStudy: p.course_of_study,
    yearOfStudy: p.year_of_study,
    isVerifiedStudent: p.is_verified_student,
    avatarUrl: p.avatar_url,
  };
}

// Student residential estate + campus proximity, for computing meetup midpoints.
export async function fetchResidenceArea(studentId) {
  return request(`/users/${studentId}/residence-area`).then(normalizeResidenceArea);
}

// Study-friendliness of an accommodation, for venue selection.
export async function fetchStudyAmenities(accommodationId) {
  return request(`/accommodations/${accommodationId}/study-amenities`).then(
    normalizeStudyAmenities
  );
}

// Lease timeline + relocation window, for marking busy blocks on the calendar.
export async function fetchLeaseTimeline(studentId) {
  return request(`/students/${studentId}/lease-timeline`).then(normalizeLeaseTimeline);
}

// Verified student identity, to confirm peers.
export async function fetchPublicProfile(userId) {
  return request(`/users/${userId}/public-profile`).then(normalizePublicProfile);
}

// Create a co-living inquiry for the whole group.
export async function submitGroupInquiry(inquiry) {
  return request('/accommodations/group-inquiries', {
    method: 'POST',
    body: JSON.stringify(inquiry),
  });
}