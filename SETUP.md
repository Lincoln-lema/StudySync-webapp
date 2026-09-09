# Backend Setup (Local Development)

Cloning the repo gets you the code, but a few things are gitignored or
machine-specific and need to be set up manually on every teammate's machine.

## 1. Install dependencies

```
cd server
npm install
```

## 2. Set up MySQL locally

You need MySQL running (via XAMPP, a standalone install, or otherwise).
If using XAMPP, start MySQL from the XAMPP Control Panel, then use
phpMyAdmin (`http://localhost/phpmyadmin`) or a terminal.

Create the database and the base `members` table:

```sql
CREATE DATABASE studysync;
USE studysync;

CREATE TABLE members (
    id VARCHAR(10) PRIMARY KEY,
    name VARCHAR(100),
    initials VARCHAR(5),
    reliability INT DEFAULT 100
);

INSERT INTO members (id, name, initials, reliability) VALUES
    ('anna', 'Anna', 'A', 95),
    ('ben', 'Ben', 'B', 80),
    ('clara', 'Clara', 'C', 90);
```

Then, from inside the `server` folder, import the rest of the schema
(tasks, deadlines, activity, flashcards tables):

```
mysql -u root -p studysync < schema_additions.sql
```

(If using XAMPP with default settings, the root password is blank —
just press Enter at the password prompt.)

## 3. Create your own `.env` file

Create `server/.env` (this file is gitignored — every teammate needs
their own copy) with:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=studysync
DB_PORT=3306
PORT=5000
```

Adjust `DB_USER`/`DB_PASSWORD` if your local MySQL setup differs.

## 4. Run and test

```
npm run dev
```

Confirm each endpoint works by visiting these in a browser:

- `localhost:5000/api/members`
- `localhost:5000/api/tasks`
- `localhost:5000/api/deadlines`
- `localhost:5000/api/activity`
- `localhost:5000/api/flashcards`
- `localhost:5000/api/students`

Run the automated test suite:

```
npm test
```

All 16 tests should pass.

## Common gotchas

- **PowerShell doesn't support `<` for file redirection.** Use
  `Get-Content schema_additions.sql | mysql -u root -p studysync` instead,
  or run the import from XAMPP's bundled shell, Git Bash, or `cmd.exe`.
- **"Cannot find module" errors** usually mean a route file exists but
  isn't required/mounted in `index.js`, or is sitting in the wrong folder
  (it should be inside `server/routes/`, not `server/` directly).
- **XAMPP's `mysql` command not found in PowerShell** means it's not on
  your PATH — use the full path instead:
  `& "C:\xampp\mysql\bin\mysql.exe" -u root -p`
