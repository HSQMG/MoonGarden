import { env } from 'cloudflare:workers';
import { createTripMediaIndex, createTripMediaTable } from './schema';

export const mediaDb = () => (env as unknown as { DB: D1Database }).DB;

export async function ensureMediaSchema() {
  const db = mediaDb();
  await db.batch([
    db.prepare(createTripMediaTable),
    db.prepare(createTripMediaIndex),
  ]);
  await db.prepare('PRAGMA optimize').run();
  return db;
}
