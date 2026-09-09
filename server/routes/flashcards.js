const express = require('express');
const router = express.Router();
const pool = require('../db');


router.get('/', async (req, res) => {
  try {
    const [decks] = await pool.query(
      'SELECT id, title, owner_id, shared_with_group FROM flashcard_decks'
    );
    const [cards] = await pool.query(
      'SELECT id, deck_id, question, answer FROM flashcards'
    );

    const result = decks.map((deck) => ({
      ...deck,
      cards: cards.filter((c) => c.deck_id === deck.id),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

module.exports = router;
