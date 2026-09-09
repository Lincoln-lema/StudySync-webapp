
USE studysync;

CREATE TABLE IF NOT EXISTS groups_table (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100)
);

ALTER TABLE members
    ADD COLUMN IF NOT EXISTS group_id VARCHAR(10),
    ADD CONSTRAINT fk_members_group FOREIGN KEY (group_id) REFERENCES groups_table(id);

INSERT INTO groups_table (id, name) VALUES
    ('g1', 'Study Group Alpha');

UPDATE members SET group_id = 'g1' WHERE id IN ('anna', 'ben', 'clara');


CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(10) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    assigned_to VARCHAR(10),
    status ENUM('pending', 'done', 'late') DEFAULT 'pending',
    deadline DATETIME,
    FOREIGN KEY (assigned_to) REFERENCES members(id)
);

INSERT INTO tasks (id, title, assigned_to, status, deadline) VALUES
    ('t1', 'Finish calculus problem set', 'anna', 'pending', '2026-09-12 23:59:00'),
    ('t2', 'Read chapter 6 notes', 'ben', 'late', '2026-09-05 23:59:00'),
    ('t3', 'Prepare flashcards for quiz', 'clara', 'done', '2026-09-08 18:00:00');


CREATE TABLE IF NOT EXISTS activity_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    member_id VARCHAR(10) NOT NULL,
    activity_date DATE NOT NULL,
    minutes_studied INT DEFAULT 0,
    FOREIGN KEY (member_id) REFERENCES members(id)
);

INSERT INTO activity_log (member_id, activity_date, minutes_studied) VALUES
    ('anna', '2026-09-06', 45),
    ('anna', '2026-09-07', 30),
    ('ben', '2026-09-06', 10),
    ('clara', '2026-09-07', 60);

CREATE TABLE IF NOT EXISTS flashcard_decks (
    id VARCHAR(10) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    owner_id VARCHAR(10),
    shared_with_group TINYINT(1) DEFAULT 0,
    FOREIGN KEY (owner_id) REFERENCES members(id)
);

CREATE TABLE IF NOT EXISTS flashcards (
    id VARCHAR(10) PRIMARY KEY,
    deck_id VARCHAR(10) NOT NULL,
    question VARCHAR(255) NOT NULL,
    answer VARCHAR(255) NOT NULL,
    FOREIGN KEY (deck_id) REFERENCES flashcard_decks(id)
);

INSERT INTO flashcard_decks (id, title, owner_id, shared_with_group) VALUES
    ('d1', 'Organic Chemistry Basics', 'anna', 1);

INSERT INTO flashcards (id, deck_id, question, answer) VALUES
    ('f1', 'd1', 'What is a functional group?', 'A specific group of atoms within a molecule responsible for its reactions'),
    ('f2', 'd1', 'What is an alkane?', 'A saturated hydrocarbon with only single bonds');
