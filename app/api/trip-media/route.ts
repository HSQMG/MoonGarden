import { env } from 'cloudflare:workers';
import { ensureMediaSchema } from '../../../db/media';

const bucket = () => (env as unknown as { MEDIA: R2Bucket }).MEDIA;
const validTripId = (value: string | null) => value !== null && /^[0-9a-f-]{36}$/i.test(value);
type MediaRow = { id: string; trip_index: number; trip_id: string | null; object_key: string; original_name: string; content_type: string; size_bytes: number; created_at: string };
type SupabaseTrip = { id: string; sort_order: number; created_at: string };

function isAdmin(request: Request) {
  if (process.env.NODE_ENV === 'development') return true;
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const currentEmail = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  return Boolean(adminEmail && currentEmail && adminEmail === currentEmail);
}

async function createUniqueObjectKey(tripId: string, file: File) {
  const extension = file.name.match(/\.([a-zA-Z0-9]{1,10})$/)?.[1].toLowerCase();

  while (true) {
    const randomName = crypto.randomUUID();
    const key = `friend-trips/${tripId}/${randomName}${extension ? `.${extension}` : ''}`;
    if (!(await bucket().head(key))) return key;
  }
}

async function migrateLegacyMedia(db: D1Database) {
  const legacy = await db.prepare('SELECT id, trip_index, created_at FROM trip_media WHERE trip_id IS NULL').all<{ id: string; trip_index: number; created_at: string }>();
  if (!legacy.results.length) return;
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !key) return;
  const response = await fetch(`${baseUrl}/rest/v1/friend_trips?select=id,sort_order,created_at&order=sort_order.asc,created_at.asc`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' });
  if (!response.ok) return;
  const trips = await response.json() as SupabaseTrip[];
  const updates = legacy.results.flatMap((row) => {
    const availableAtUpload = trips.filter((trip) => new Date(trip.created_at).getTime() <= new Date(row.created_at).getTime());
    const trip = availableAtUpload[row.trip_index] || trips[row.trip_index];
    return trip ? [db.prepare('UPDATE trip_media SET trip_id = ? WHERE id = ?').bind(trip.id, row.id)] : [];
  });
  if (updates.length) await db.batch(updates);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');

  if (key) {
    if (!key.startsWith('friend-trips/')) return new Response('Không hợp lệ', { status: 400 });
    const object = await bucket().get(key);
    if (!object) return new Response('Không tìm thấy tệp', { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'private, max-age=3600');
    return new Response(object.body, { headers });
  }

  const db = await ensureMediaSchema();
  await migrateLegacyMedia(db);
  const objects = await bucket().list({ prefix: 'friend-trips/', include: ['httpMetadata'] });
  if (objects.objects.length) {
    await db.batch(objects.objects.map((object) => {
      const folder = object.key.split('/')[1];
      const tripId = validTripId(folder) ? folder : null;
      const tripIndex = /^\d+$/.test(folder) ? Number(folder) : 0;
      const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
      const originalName = object.key.split('/').at(-1)?.replace(/^\d+-\d+-/, '') || 'media';
      return db.prepare(`
        INSERT INTO trip_media (id, trip_index, trip_id, object_key, original_name, content_type, size_bytes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(object_key) DO NOTHING
      `).bind(crypto.randomUUID(), tripIndex, tripId, object.key, originalName, contentType, object.size, object.uploaded.toISOString());
    }));
  }
  const result = await db.prepare(`
    SELECT id, trip_index, trip_id, object_key, original_name, content_type, size_bytes, created_at
    FROM trip_media
    ORDER BY trip_id ASC, created_at ASC
  `).all<MediaRow>();
  const media = result.results.map((row) => ({
    id: row.id,
    key: row.object_key,
    tripId: row.trip_id,
    type: row.content_type.startsWith('video/') ? 'video' : 'image',
    name: row.object_key.split('/').at(-1) || row.original_name,
    originalName: row.original_name,
    size: row.size_bytes,
    createdAt: row.created_at,
    url: `/api/trip-media?key=${encodeURIComponent(row.object_key)}`,
  }));
  return Response.json({ media });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý thư viện.' }, { status: 403 });
  const form = await request.formData();
  const tripId = String(form.get('tripId') ?? '');
  if (!validTripId(tripId)) return Response.json({ error: 'Chuyến đi không hợp lệ.' }, { status: 400 });

  const files = form.getAll('files').filter((item): item is File => item instanceof File);
  if (!files.length) return Response.json({ error: 'Chưa chọn tệp.' }, { status: 400 });
  if (files.length > 30) return Response.json({ error: 'Mỗi lần chỉ tải tối đa 30 tệp.' }, { status: 400 });

  for (const file of files) {
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      return Response.json({ error: `${file.name} không phải ảnh hoặc video.` }, { status: 400 });
    }
    if (file.size > 50 * 1024 * 1024) {
      return Response.json({ error: `${file.name} vượt quá 50 MB.` }, { status: 400 });
    }
  }

  const uploaded = [];
  const db = await ensureMediaSchema();
  for (const file of files) {
    const key = await createUniqueObjectKey(tripId, file);
    await bucket().put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    try {
      await db.prepare(`
        INSERT INTO trip_media (id, trip_index, trip_id, object_key, original_name, content_type, size_bytes, created_at)
        VALUES (?, 0, ?, ?, ?, ?, ?, ?)
      `).bind(id, tripId, key, file.name, file.type, file.size, createdAt).run();
    } catch (error) {
      await bucket().delete(key);
      throw error;
    }
    uploaded.push({ id, key, tripId, type: file.type.startsWith('video/') ? 'video' : 'image', name: key.split('/').at(-1), originalName: file.name, size: file.size, createdAt, url: `/api/trip-media?key=${encodeURIComponent(key)}` });
  }

  return Response.json({ media: uploaded });
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý thư viện.' }, { status: 403 });

  const body = await request.json() as { key?: string };
  const key = body.key;
  if (!key?.startsWith('friend-trips/')) return Response.json({ error: 'Tệp không hợp lệ.' }, { status: 400 });

  const db = await ensureMediaSchema();
  const row = await db.prepare('SELECT id FROM trip_media WHERE object_key = ?').bind(key).first<{ id: string }>();
  if (!row) return Response.json({ error: 'Không tìm thấy tệp.' }, { status: 404 });

  await bucket().delete(key);
  await db.prepare('DELETE FROM trip_media WHERE object_key = ?').bind(key).run();
  return Response.json({ deleted: true, key });
}
