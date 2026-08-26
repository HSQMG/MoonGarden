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

export const createReflectionsTable = `
  CREATE TABLE IF NOT EXISTS reflections (
    id TEXT PRIMARY KEY,
    reflected_at TEXT NOT NULL,
    title TEXT NOT NULL,
    source_type TEXT NOT NULL DEFAULT 'photo',
    feeling TEXT NOT NULL,
    object_key TEXT,
    original_name TEXT,
    content_type TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )
`;

export const createReflectionsDateIndex = `
  CREATE INDEX IF NOT EXISTS idx_reflections_reflected_at
  ON reflections(reflected_at DESC, created_at DESC)
`;
