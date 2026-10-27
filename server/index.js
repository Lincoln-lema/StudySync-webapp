require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { requireApiKey, keyCount } = require('./middleware/auth');
const { rateLimit } = require('./middleware/rateLimit');

const membersRouter = require('./routes/members');
const usersRouter = require('./routes/Users');
const tasksRouter = require('./routes/tasks');
const deadlinesRouter = require('./routes/deadlines');
const activityRouter = require('./routes/activity');
const flashcardsRouter = require('./routes/flashcards');
const propertiesRouter = require('./routes/properties');

const app = express();
app.use(cors());
app.use(express.json());

// Week 9: every route requires a valid X-API-Key.
app.use(requireApiKey);

// Week 9: Rate Limiter.
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));
// Internal /api/* paths
app.use('/api/members', membersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/deadlines', deadlinesRouter);
app.use('/api/activity', activityRouter);
app.use('/api/flashcards', flashcardsRouter);
app.use('/api/properties', propertiesRouter);

// Contract paths for downstream partners per openapi.yaml
app.use('/users', usersRouter);
app.use('/tasks', tasksRouter);
app.use('/deadlines', deadlinesRouter);
app.use('/calendar-events', deadlinesRouter);
app.use('/activity', activityRouter);
app.use('/flashcard-decks', flashcardsRouter);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API keys loaded: ${keyCount()}`);
  });
}

module.exports = app;