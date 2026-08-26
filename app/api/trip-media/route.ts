import { env } from 'cloudflare:workers';
import { ensureMediaSchema } from '../../../db/media';

const bucket = () => (env as unknown as { MEDIA: R2Bucket }).MEDIA;
const validTrip = (value: string | null) => value !== null && /^[0-2]$/.test(value);
type MediaRow = { id: string; trip_index: number; object_key: string; original_name: string; content_type: string; size_bytes: number; created_at: string };

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
  const objects = await bucket().list({ prefix: 'friend-trips/', include: ['httpMetadata'] });
  if (objects.objects.length) {
    await db.batch(objects.objects.map((object) => {
      const tripIndex = Number(object.key.split('/')[1]);
      const contentType = object.httpMetadata?.contentType || 'application/octet-stream';
      const originalName = object.key.split('/').at(-1)?.replace(/^\d+-\d+-/, '') || 'media';
      return db.prepare(`
        INSERT INTO trip_media (id, trip_index, object_key, original_name, content_type, size_bytes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(object_key) DO NOTHING
      `).bind(crypto.randomUUID(), tripIndex, object.key, originalName, contentType, object.size, object.uploaded.toISOString());
    }));
  }
  const result = await db.prepare(`
    SELECT id, trip_index, object_key, original_name, content_type, size_bytes, created_at
    FROM trip_media
    ORDER BY trip_index ASC, created_at ASC
  `).all<MediaRow>();
  const media = result.results.map((row) => ({
    id: row.id,
    key: row.object_key,
    tripIndex: row.trip_index,
    type: row.content_type.startsWith('video/') ? 'video' : 'image',
    name: row.original_name,
    size: row.size_bytes,
    createdAt: row.created_at,
    url: `/api/trip-media?key=${encodeURIComponent(row.object_key)}`,
  }));
  return Response.json({ media });
}

export async function POST(request: Request) {
  const form = await request.formData();
  const tripIndex = String(form.get('tripIndex') ?? '');
  if (!validTrip(tripIndex)) return Response.json({ error: 'Chuyến đi không hợp lệ.' }, { status: 400 });

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
  for (const [index, file] of files.entries()) {
    const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const key = `friend-trips/${tripIndex}/${Date.now()}-${index}-${safeName}`;
    await bucket().put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    const id = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    try {
      await db.prepare(`
        INSERT INTO trip_media (id, trip_index, object_key, original_name, content_type, size_bytes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(id, Number(tripIndex), key, file.name, file.type, file.size, createdAt).run();
    } catch (error) {
      await bucket().delete(key);
      throw error;
    }
    uploaded.push({ id, key, tripIndex: Number(tripIndex), type: file.type.startsWith('video/') ? 'video' : 'image', name: file.name, size: file.size, createdAt, url: `/api/trip-media?key=${encodeURIComponent(key)}` });
  }

  return Response.json({ media: uploaded });
}
