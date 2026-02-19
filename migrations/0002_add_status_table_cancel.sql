ALTER TABLE bookings ADD COLUMN status TEXT NOT NULL DEFAULT 'confirmed';
ALTER TABLE bookings ADD COLUMN table_number TEXT NOT NULL DEFAULT '';
ALTER TABLE bookings ADD COLUMN cancel_token TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_bookings_cancel_token
  ON bookings(cancel_token) WHERE cancel_token != '';
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_table
  ON bookings(table_number) WHERE table_number != '';
