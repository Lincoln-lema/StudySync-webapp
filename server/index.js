require('dotenv').config();
const express = require('express');
const cors = require('cors');

const membersRouter = require('./routes/members');
const usersRouter = require('./routes/Users');
const tasksRouter = require('./routes/tasks');
const deadlinesRouter = require('./routes/deadlines');
const activityRouter = require('./routes/activity');
const flashcardsRouter = require('./routes/flashcards');

const app = express();
app.use(cors());
app.use(express.json());

// Mount at /api/* paths (internal use)
app.use('/api/members', membersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/deadlines', deadlinesRouter);
app.use('/api/activity', activityRouter);
app.use('/api/flashcards', flashcardsRouter);

// Mount at contract paths (external partner API per openapi.yaml)
app.use('/users', usersRouter);
app.use('/tasks', tasksRouter);
app.use('/deadlines', deadlinesRouter);
app.use('/calendar-events', deadlinesRouter);
app.use('/activity', activityRouter);
app.use('/flashcard-decks', flashcardsRouter);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;