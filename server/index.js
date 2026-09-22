require('dotenv').config();
const express = require('express');
const cors = require('cors');

const membersRouter = require('./routes/members');
const tasksRouter = require('./routes/tasks');
const deadlinesRouter = require('./routes/deadlines');
const activityRouter = require('./routes/activity');
const flashcardsRouter = require('./routes/flashcards');
const usersRouter = require('./routes/Users');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/members', membersRouter);
app.use('/tasks', tasksRouter);
app.use('/calendar-events', deadlinesRouter);
app.use('/deadlines', deadlinesRouter);
app.use('/activity', activityRouter);
app.use('/flashcard-decks', flashcardsRouter);
app.use('/users', usersRouter);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;