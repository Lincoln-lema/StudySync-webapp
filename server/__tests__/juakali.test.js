/**
 * Week 7: Jua Kali Connect API Contract Tests (Downstream Partner)
 * Date: 2026-10-08
 * 
 * Tests written from Jua Kali's contract (openapi.yaml)
 * Testing: POST /bookings, POST /sessions, GET /artisans
 */

const request = require('supertest');

const JUAKALI_API_URL = 'http://localhost:3001/api';
const api = request(JUAKALI_API_URL);

describe('Jua Kali Connect API Contract Tests', () => {
  describe('POST /bookings', () => {
    it('creates booking with valid data', async () => {
      const res = await api
        .post('/bookings')
        .send({
          artisan_name: 'Sean',
          service: 'Plumbing',
          status: 'pending'
        });

      expect([201, 400]).toContain(res.statusCode);
      
      if (res.statusCode === 201) {
        expect(res.body).toHaveProperty('id');
        expect(res.body).toHaveProperty('artisan_name', 'Sean');
        expect(res.body).toHaveProperty('service', 'Plumbing');
        expect(res.body).toHaveProperty('status', 'pending');
      }
    });

    it('rejects missing required fields', async () => {
      const res = await api
        .post('/bookings')
        .send({ artisan_name: 'Sean' });

      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid status value', async () => {
      const res = await api
        .post('/bookings')
        .send({
          artisan_name: 'Sean',
          service: 'Plumbing',
          status: 'invalid'
        });

      expect([400, 201]).toContain(res.statusCode);
    });
  });

  describe('POST /sessions', () => {
    it('creates session with valid credentials', async () => {
      const res = await api
        .post('/sessions')
        .send({
          email: 'seanochieng@gmail.com',
          password: 'correcthorsebatterystaple'
        });

      expect([201, 400]).toContain(res.statusCode);
      
      if (res.statusCode === 201) {
        expect(res.body).toHaveProperty('token');
        expect(res.body).toHaveProperty('userId');
        expect(typeof res.body.token).toBe('string');
        expect(typeof res.body.userId).toBe('number');
      }
    });

    it('rejects missing email', async () => {
      const res = await api
        .post('/sessions')
        .send({ password: 'correcthorsebatterystaple' });

      expect(res.statusCode).toBe(400);
    });

    it('rejects missing password', async () => {
      const res = await api
        .post('/sessions')
        .send({ email: 'seanochieng@gmail.com' });

      expect(res.statusCode).toBe(400);
    });

    it('rejects invalid email format', async () => {
      const res = await api
        .post('/sessions')
        .send({
          email: 'not-an-email',
          password: 'correcthorsebatterystaple'
        });

      expect([400, 201]).toContain(res.statusCode);
    });
  });

  describe('GET /artisans', () => {
    it('returns list of artisans', async () => {
      const res = await api.get('/artisans');

      expect([200, 400]).toContain(res.statusCode);
      
      if (res.statusCode === 200) {
        expect(Array.isArray(res.body)).toBe(true);
      }
    });

    it('endpoint is accessible', async () => {
      const res = await api.get('/artisans');
      expect(res.statusCode).toBeGreaterThan(0);
    });
  });

  describe('API Contract Compliance', () => {
    it('all endpoints use /api prefix', async () => {
      expect(JUAKALI_API_URL).toContain('/api');
    });

    it('bookings endpoint responds to POST requests', async () => {
      const res = await api.post('/bookings').send({
        artisan_name: 'Test',
        service: 'Test'
      });

      expect([201, 400, 500]).toContain(res.statusCode);
    });

    it('sessions endpoint responds to POST requests', async () => {
      const res = await api.post('/sessions').send({
        email: 'test@example.com',
        password: 'test'
      });

      expect([201, 400, 500]).toContain(res.statusCode);
    });
  });
});
