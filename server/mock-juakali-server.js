/**
 * Mock Jua Kali Connect API Server (ESM)
 * Matches their openapi.yaml contract for testing purposes
 * 
 * Run: node mock-juakali-server.js
 * Listens on: http://localhost:3001/api
 */

import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json());

// Mock data
let bookings = [
  { id: 1, artisan_name: 'Sean', service: 'Plumbing', status: 'pending' },
  { id: 2, artisan_name: 'John', service: 'Electrical', status: 'confirmed' }
];

let bookingIdCounter = 3;

const artisans = [
  { id: 1, name: 'Sean', service: 'Plumbing', rating: 4.5 },
  { id: 2, name: 'John', service: 'Electrical', rating: 4.8 },
  { id: 3, name: 'Mary', service: 'Carpentry', rating: 4.3 }
];

const users = [
  { id: 12, email: 'seanochieng@gmail.com', password: 'correcthorsebatterystaple', name: 'Sean' }
];

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Mock Jua Kali API running' });
});

// POST /api/bookings - Create booking
app.post('/api/bookings', (req, res) => {
  const { artisan_name, service, status } = req.body;

  // Validation
  if (!artisan_name || !service) {
    return res.status(400).json({ error: 'Missing required fields: artisan_name, service' });
  }

  if (status && !['pending', 'confirmed', 'completed'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  // Create booking
  const newBooking = {
    id: bookingIdCounter++,
    artisan_name,
    service,
    status: status || 'pending'
  };

  bookings.push(newBooking);
  res.status(201).json(newBooking);
});

// POST /api/sessions - Create session
app.post('/api/sessions', (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return res.status(400).json({ error: 'Missing required fields: email, password' });
  }

  // Email format validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: 'Invalid email format' });
  }

  // Check credentials
  const user = users.find(u => u.email === email && u.password === password);
  if (!user) {
    return res.status(400).json({ error: 'Invalid credentials' });
  }

  // Create token (mock JWT)
  const token = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Buffer.from(JSON.stringify({ userId: user.id })).toString('base64')}.mock`;

  res.status(201).json({
    token,
    userId: user.id
  });
});

// GET /api/artisans - List artisans
app.get('/api/artisans', (req, res) => {
  res.status(200).json(artisans);
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Mock Jua Kali API running on http://localhost:${PORT}/api`);
});
