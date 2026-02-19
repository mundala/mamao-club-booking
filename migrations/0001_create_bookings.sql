CREATE TABLE IF NOT EXISTS bookings (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  ref        TEXT NOT NULL UNIQUE,
  name       TEXT NOT NULL DEFAULT '',
  phone      TEXT NOT NULL DEFAULT '',
  email      TEXT NOT NULL DEFAULT '',
  guests     INTEGER NOT NULL DEFAULT 1,
  date       TEXT NOT NULL,
  time       TEXT NOT NULL,
  notes      TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
