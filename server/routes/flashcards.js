const express = require('express');
const router = express.Router();
const pool = require('../db');

router.get('/', async (req, res) => {
  try {
    const { groupId } = req.query;

    let deckQuery = `SELECT d.id, d.title, d.owner_id, d.shared_with_group, m.group_id AS owner_group_id
                      FROM flashcard_decks d JOIN members m ON d.owner_id = m.id WHERE 1=1`;
    const params = [];
    if (groupId) {
      deckQuery += ' AND d.shared_with_group = 1 AND m.group_id = ?';
      params.push(groupId);
    }

    const [decks] = await pool.query(deckQuery, params);
    const [cards] = await pool.query('SELECT id, deck_id, question, answer FROM flashcards');

    const result = decks.map((deck) => ({
      id: deck.id,
      title: deck.title,
      owner_id: deck.owner_id,
      // deviation: DB stores a boolean flag, not a group id — map to owner's group when shared
      shared_with_group: deck.shared_with_group ? deck.owner_group_id : null,
      cards: cards.filter((c) => c.deck_id === deck.id),
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch flashcards' });
  }
});

module.exports = router;