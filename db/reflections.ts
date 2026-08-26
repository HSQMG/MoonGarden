import { env } from 'cloudflare:workers';
import { createReflectionsDateIndex, createReflectionsTable } from './schema';

export async function ensureReflectionsSchema() {
  const db = (env as unknown as { DB: D1Database }).DB;
  await db.prepare(createReflectionsTable).run();
  await db.prepare(createReflectionsDateIndex).run();
  await db.prepare('PRAGMA optimize').run();
  return db;
}
