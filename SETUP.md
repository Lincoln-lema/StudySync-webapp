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
    ('anna', 'Anna', 'AN', 85),
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

Then create the study-spot bookings table (Week 10). Run this once after
pulling, from inside the `server` folder:

```
node scripts/migrate-bookings.js
```

It runs `bookings_schema.sql` (`CREATE TABLE IF NOT EXISTS study_bookings`),
so it is safe to run more than once. Without it, `/api/bookings` returns 500.

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
API_KEYS=key-for-the-web-app,key-for-each-other-consumer
SETTLEIN_URL=http://localhost:4000
SETTLEIN_API_KEY=your-settlein-key-if-you-have-one
```

Adjust `DB_USER`/`DB_PASSWORD` if your local MySQL setup differs.

- `API_KEYS` is a comma-separated list, one key per consumer. Every request
  needs one in an `X-API-Key` header. Generate a key with:
  `node -e "console.log(require('crypto').randomBytes(24).toString('hex'))"`
- `SETTLEIN_URL` is where the upstream SettleIn API lives. For local work and
  demos it points at the stand-in (see step 5). Swap it for SettleIn's live
  tunnel URL when integrating. `server/.env.example` also lists
  `JUAKALI_API_URL` (the downstream partner's tunnel) for reference.
- Never commit `.env`. Real keys must not appear in source files.

## 4. Run and test

```
npm start
```

For the frontend, create a **root-level** `.env` (next to `package.json`,
not inside `server`; also gitignored) from `.env.example`:

```
VITE_API_URL=http://localhost:5000
VITE_API_KEY=the-web-app-key
```

`VITE_API_KEY` must also be listed in the server's `API_KEYS`. Anything
prefixed `VITE_` is bundled into the browser code, so treat it as public and
use a key that is separate from the ones given to partners. Then run
`npm install` and `npm run dev` in the repo root (the app opens on
`localhost:5173`). Restart Vite after editing `.env`.

To restart automatically on file changes, use `npm run dev` instead.

Confirm each endpoint works by visiting these in a browser:

- `localhost:5000/api/members`
- `localhost:5000/api/tasks`
- `localhost:5000/api/deadlines` (optionally `?from=2026-09-01&to=2026-12-31`; `from` and `to` must be given together)
- `localhost:5000/api/activity`
- `localhost:5000/api/flashcards`
- `localhost:5000/api/bookings`
- `localhost:5000/api/properties` (needs the stand-in or SettleIn running, see below)

Browser visits need an `X-API-Key` header, so use `curl` or the frontend
for these (a plain browser address bar gets a 401).

Run the automated test suite:

```
npm test
```

All suites should pass. The partner contract suites (`juakali.test.js`,
`settlein.test.js`) are marked `describe.skip`, and the live SettleIn
integration suite only runs with `SETTLEIN_LIVE_TESTS=1`, so some tests
always show as skipped.

## 5. SettleIn stand-in (for the Study Spots page)

The Study Spots page and bookings read property amenities from SettleIn. When
their tunnel is down, run the local stand-in in a second terminal:

```
cd server
node mock-settlein.js
```

It serves `prop-003` ("Sunrise Court (mock)") on port 4000, in SettleIn's
contract shape. With `SETTLEIN_URL=http://localhost:4000`, responses carry
`"source": "stand-in"` and the UI labels the data as a stand-in. Restart the
backend after changing `SETTLEIN_URL`.

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
