import { useState } from 'react';

function Flashcards({ data, setData, showToast }) {
  const { flashcards } = data;
  const [showForm, setShowForm] = useState(false);
  const [deckName, setDeckName] = useState('');
  const [notes, setNotes] = useState('');
  const [openDeck, setOpenDeck] = useState(null);

  function createDeck(e) {
    e.preventDefault();
    if (!deckName.trim() || !notes.trim()) return;

    // Turn each "Question : Answer" line into a card object.
    const lines = notes.split('\n').filter((line) => line.trim());
    const cards = lines.map((line) => {
      const parts = line.split(':');
      return { q: parts[0].trim(), a: parts.slice(1).join(':').trim() };
    }).filter((c) => c.q && c.a);

    if (cards.length === 0) {
      showToast('No valid "Question : Answer" lines found');
      return;
    }

    const newDeck = { id: 'd' + Date.now(), name: deckName.trim(), shared: false, cards };
    setData({ ...data, flashcards: [...flashcards, newDeck] });
    setDeckName('');
    setNotes('');
    setShowForm(false);
    showToast('Deck created with ' + cards.length + ' cards');
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">My Flashcards</h2>
          <p className="text-sm text-slate-500 mt-1">Personal study tools</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold"
        >
          + New Deck
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {flashcards.map((deck) => (
          <div key={deck.id} className="bg-white rounded-xl border border-slate-200 p-5">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-semibold text-slate-800">{deck.name}</span>
              <span className={'text-[10px] px-2 py-1 rounded-full uppercase ' + (deck.shared ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500')}>
                {deck.shared ? 'Shared' : 'Private'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mb-2">{deck.cards.length} cards</p>
            <button
              onClick={() => setOpenDeck(openDeck === deck.id ? null : deck.id)}
              className="text-xs text-primary font-semibold"
            >
              {openDeck === deck.id ? 'Hide cards' : 'Preview cards'}
            </button>
            {openDeck === deck.id && (
              <div className="mt-3 space-y-2">
                {deck.cards.map((c, i) => (
                  <div key={i} className="text-xs bg-slate-50 rounded p-2">
                    <div className="font-medium text-slate-800">{c.q}</div>
                    <div className="text-slate-500">{c.a}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="text-xs font-semibold text-slate-500 uppercase mb-4">Create Deck from Notes</div>
          <form onSubmit={createDeck}>
            <label className="block text-xs text-slate-500 mb-1">Deck Name</label>
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder="e.g., Lecture 6 - Algorithms"
              className="w-full px-3 py-2 rounded border border-slate-300 text-sm mb-4"
            />
            <label className="block text-xs text-slate-500 mb-1">Notes (one "Question : Answer" per line)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={5}
              placeholder="What is a hash table? : A data structure for O(1) lookup."
              className="w-full px-3 py-2 rounded border border-slate-300 text-sm mb-4"
            />
            <button type="submit" className="px-4 py-2 rounded-lg bg-primary text-white text-sm font-semibold">
              Generate Cards
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Flashcards;
