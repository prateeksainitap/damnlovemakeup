-- DamnLove Makeup · bookings database (Cloudflare D1)
CREATE TABLE IF NOT EXISTS bookings (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_date  TEXT NOT NULL,          -- YYYY-MM-DD
  time_slot   TEXT NOT NULL,          -- e.g. "Early Morning (4-8 AM)"
  occasion    TEXT NOT NULL,          -- Bridal / Engagement / Party / Other
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  city        TEXT,
  notes       TEXT,
  status      TEXT DEFAULT 'new',     -- new / confirmed / done / cancelled
  created_at  TEXT
);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings (event_date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings (status);

-- Availability: dates Laveena has blocked off (Cloudflare D1)
CREATE TABLE IF NOT EXISTS blocked_dates (
  date       TEXT PRIMARY KEY,   -- YYYY-MM-DD
  reason     TEXT,
  created_at TEXT
);
