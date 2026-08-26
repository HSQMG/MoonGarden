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
);

CREATE INDEX IF NOT EXISTS idx_reflections_reflected_at
ON reflections(reflected_at DESC, created_at DESC);

PRAGMA optimize;
