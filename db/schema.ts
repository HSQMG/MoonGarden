export const createTripMediaTable = `
  CREATE TABLE IF NOT EXISTS trip_media (
    id TEXT PRIMARY KEY,
    trip_index INTEGER NOT NULL CHECK (trip_index BETWEEN 0 AND 2),
    object_key TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )
`;

export const createTripMediaIndex = `
  CREATE INDEX IF NOT EXISTS idx_trip_media_trip_created
  ON trip_media(trip_index, created_at)
`;
