const express = require('express');
const router = express.Router();
const pool = require('../db');

// GET /api/flashcards
router.get('/', async (req, res) => {
  try {
    // Join to members so we can derive the owner's group_id when a deck is shared.
    // Per Week 5 CONTRACT_DEVIATIONS.md: shared_with_group is a boolean flag in the
    // database, but the contract exposes it as the owner's group_id (or null).
    const [decks] = await pool.query(
      `SELECT d.id, d.title, d.owner_id, d.shared_with_group AS shared_flag, m.group_id AS owner_group_id
       FROM flashcard_decks d
       LEFT JOIN members m ON d.owner_id = m.id`
    );
    const [cards] = await pool.query(
      'SELECT id, deck_id, question, answer FROM flashcards'
    );

    const result = decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      owner_id: deck.owner_id,
      shared_with_group: deck.shared_flag ? deck.owner_group_id : null,
      cards: cards.filter((c) => c.deck_id === deck.id),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

module.exports = router;