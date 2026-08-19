// The starting data StudySync loads with, and what "Reset Data" restores.

const mockData = {
  group: {
    name: 'CS301 Final Project',
    dueDate: '2026-05-25',
    members: [
      { id: 'anna', name: 'Anna', initials: 'AN', reliability: 85 },
      { id: 'ben', name: 'Ben', initials: 'BE', reliability: 45 },
      { id: 'clara', name: 'Clara', initials: 'CL', reliability: 92 },
    ],
  },

  tasks: [
    { id: 't1', title: 'Literature review', owner: 'Anna', status: 'done', due: '2026-05-10' },
    { id: 't2', title: 'Code prototype', owner: 'Ben', status: 'late', due: '2026-05-12' },
    { id: 't3', title: 'Report', owner: 'Clara', status: 'pending', due: '2026-05-20' },
    { id: 't4', title: 'Slides', owner: 'Anna', status: 'pending', due: '2026-05-22' },
  ],

  flashcards: [
    {
      id: 'd1',
      name: 'Data Structures Basics',
      shared: true,
      cards: [
        { q: 'What is a hash table?', a: 'A data structure that maps keys to values for O(1) average lookup.' },
        { q: 'What is Big-O notation?', a: 'A way of describing an algorithm\u2019s worst-case complexity.' },
      ],
    },
    {
      id: 'd2',
      name: 'Personal - Ethics Terms',
      shared: false,
      cards: [
        { q: 'What is the Principle of Double Effect?', a: 'A framework for judging when a harmful side effect of a good act is permissible.' },
      ],
    },
  ],

  nudges: [
    { id: 'n1', message: 'Any updates on your part?', target: 'Ben', sentAt: '2026-05-11T09:15:00' },
    { id: 'n2', message: 'Deadline is coming up soon', target: 'Clara', sentAt: '2026-05-13T18:40:00' },
  ],

  // 15 days of activity (May 1-15, 2026), values 0-4.
  heatmap: {
    days: Array.from({ length: 15 }, (_, i) => i + 1),
    Anna:  [0, 1, 2, 3, 2, 1, 0, 2, 3, 3, 2, 1, 0, 1, 2],
    Ben:   [0, 0, 0, 1, 0, 0, 1, 0, 0, 2, 0, 1, 4, 4, 3],
    Clara: [1, 2, 2, 3, 3, 4, 3, 2, 3, 3, 2, 2, 3, 2, 1],
  },
};

export default mockData;
