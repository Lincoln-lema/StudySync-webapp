// Local stand-in for SettleIn (Team 1) used when their tunnel is down.
// Serves the shape from SettleIn's contract. Port 4000.
const express = require('express');
const app = express();

const prop003 = {
  accommodation_id: 'prop-003',
  accommodation_name: 'Sunrise Court (mock)',
  wifi_rating: 4.5,
  wifi_speed_mbps: 50,
  has_dedicated_desk: true,
  has_backup_generator: true,
  quiet_hours: { starts_at: '22:00', ends_at: '06:00', policy_enforced: true },
  max_study_guests: 4,
  last_inspected_at: '2026-10-20T09:00:00Z',
};

app.get('/api/v1/properties', (req, res) => {
  res.json([{ id: 'prop-003', title: 'Sunrise Court (mock)', type: 'apartment', price: 25000, location: 'Madaraka', campus: 'Main', verified: true, vacant_units: 2, image: null }]);
});

app.get('/api/v1/properties/:id/study-amenities', (req, res) => {
  if (req.params.id !== 'prop-003') return res.status(404).json({ error: 'Property not found' });
  res.json(prop003);
});

app.listen(4000, () => console.log('SettleIn stand-in running on port 4000'));