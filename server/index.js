require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { requireApiKey, keyCount } = require('./middleware/auth');
const { rateLimit } = require('./middleware/rateLimit');
const { monitor, statsHandler } = require('./monitoring');

const membersRouter = require('./routes/members');
const usersRouter = require('./routes/Users');
const tasksRouter = require('./routes/tasks');
const deadlinesRouter = require('./routes/deadlines');
const activityRouter = require('./routes/activity');
const flashcardsRouter = require('./routes/flashcards');
const propertiesRouter = require('./routes/properties');
const bookingsRouter = require('./routes/bookings');

// Week 13: versioning.
const { deprecated } = require('./deprecate');
const v2Router = require('./v2');

const app = express();
// Week 12: logs every request first, so rejected requests (401, 429) are logged too.
app.use(monitor);
app.use(cors());
app.use(express.json());

// Week 9: every route requires a valid X-API-Key.
app.use(requireApiKey);

// Week 9: Rate Limiter.
app.use(rateLimit({ windowMs: 60 * 1000, max: 100 }));

// Week 12: in-memory request totals, behind the key check like every other route.
app.get('/stats', statsHandler);
// Week 13: tasks v1 is deprecated. v2 runs beside it. Every v1 response carries
// Deprecation, Sunset and Link headers. Mounted after the key check and rate
// limit, so v2 needs a key like everything else.
const tasksV1Notice = deprecated({ sunset: '2026-12-16', successor: '/v2/tasks' });
app.use('/v2', v2Router);                          // the new version
app.use('/v1/tasks', tasksV1Notice, tasksRouter);  // v1, explicit URL

// Internal /api/* paths
app.use('/api/members', membersRouter);
app.use('/api/tasks', tasksV1Notice, tasksRouter); // v1 (unversioned URL keeps working)
app.use('/api/deadlines', deadlinesRouter);
app.use('/api/activity', activityRouter);
app.use('/api/flashcards', flashcardsRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/bookings', bookingsRouter);

// Contract paths for downstream partners per openapi.yaml
app.use('/users', usersRouter);
app.use('/tasks', tasksV1Notice, tasksRouter); // v1 (unversioned URL keeps working)
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
