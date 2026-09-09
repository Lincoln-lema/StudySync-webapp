const request = require('supertest');
const app = require('../index');

describe('GET /api/flashcards', () => {
  it('returns 200 and an array of decks', async () => {
    const res = await request(app).get('/api/flashcards');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('each deck has a title and a cards array', async () => {
    const res = await request(app).get('/api/flashcards');
    res.body.forEach((deck) => {
      expect(deck).toHaveProperty('title');
      expect(Array.isArray(deck.cards)).toBe(true);
    });
  });

  it('each card has a question and an answer', async () => {
    const res = await request(app).get('/api/flashcards');
    res.body.forEach((deck) => {
      deck.cards.forEach((card) => {
        expect(card).toHaveProperty('question');
        expect(card).toHaveProperty('answer');
      });
    });
  });
});
