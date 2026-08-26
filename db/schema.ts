export const createTripMediaTable = `
  CREATE TABLE IF NOT EXISTS trip_media (
    id TEXT PRIMARY KEY,
    trip_index INTEGER NOT NULL DEFAULT 0,
    trip_id TEXT,
    object_key TEXT NOT NULL UNIQUE,
    original_name TEXT NOT NULL,
    content_type TEXT NOT NULL,
    size_bytes INTEGER NOT NULL,
    created_at TEXT NOT NULL
  )
`;

export const createTripMediaIndex = `
  CREATE INDEX IF NOT EXISTS idx_trip_media_trip_id_created
  ON trip_media(trip_id, created_at)
`;
