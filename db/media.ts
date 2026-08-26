import { env } from 'cloudflare:workers';
import { createTripMediaIndex, createTripMediaTable } from './schema';

export const mediaDb = () => (env as unknown as { DB: D1Database }).DB;

export async function ensureMediaSchema() {
  const db = mediaDb();
  await db.prepare(createTripMediaTable).run();
  const columns = await db.prepare('PRAGMA table_info(trip_media)').all<{ name: string }>();
  if (!columns.results.some((column) => column.name === 'trip_id')) {
    await db.prepare('ALTER TABLE trip_media ADD COLUMN trip_id TEXT').run();
  }
  await db.prepare(createTripMediaIndex).run();
  await db.prepare('PRAGMA optimize').run();
  return db;
}
