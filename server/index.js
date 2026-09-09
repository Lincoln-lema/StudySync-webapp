require('dotenv').config();
const express = require('express');
const cors = require('cors');

const membersRouter = require('./routes/members');
const tasksRouter = require('./routes/tasks');
const deadlinesRouter = require('./routes/deadlines');
const activityRouter = require('./routes/activity');
const flashcardsRouter = require('./routes/flashcards');
const studentsRouter = require('./routes/students');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/members', membersRouter);
app.use('/api/tasks', tasksRouter);
app.use('/api/deadlines', deadlinesRouter);
app.use('/api/activity', activityRouter);
app.use('/api/flashcards', flashcardsRouter);
app.use('/api/students', studentsRouter);

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

module.exports = app;