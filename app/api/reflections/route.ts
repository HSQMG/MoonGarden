import { env } from 'cloudflare:workers';
import { ensureReflectionsSchema } from '../../../db/reflections';

type ReflectionRow = {
  id: string;
  reflected_at: string;
  title: string;
  source_type: 'photo' | 'post';
  feeling: string;
  object_key: string | null;
};

function isAdmin(request: Request) {
  if (process.env.NODE_ENV === 'development') return true;
  const expected = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const current = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  return Boolean(expected && current && expected === current);
}

const publicItem = (row: ReflectionRow) => ({
  id: row.id,
  reflected_at: row.reflected_at,
  title: row.title,
  source_type: row.source_type,
  feeling: row.feeling,
  image_url: row.object_key ? `/api/reflections?key=${encodeURIComponent(row.object_key)}` : null,
});

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get('key');
    if (key) {
      if (!key.startsWith('reflections/')) return new Response('Tệp không hợp lệ.', { status: 400 });
      const object = await (env as unknown as { MEDIA: R2Bucket }).MEDIA.get(key);
      if (!object) return new Response('Không tìm thấy ảnh.', { status: 404 });
      return new Response(object.body, { headers: { 'content-type': object.httpMetadata?.contentType || 'application/octet-stream', 'cache-control': 'public, max-age=31536000, immutable' } });
    }
    const db = await ensureReflectionsSchema();
    const rows = await db.prepare('SELECT id, reflected_at, title, source_type, feeling, object_key FROM reflections ORDER BY reflected_at DESC, created_at DESC').all<ReflectionRow>();
    return Response.json({ reflections: rows.results.map(publicItem) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể tải cảm nhận.' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const form = await request.formData();
    const file = form.get('file');
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const reflectedAt = String(form.get('reflected_at') || '');
    const title = String(form.get('title') || '').trim();
    const feeling = String(form.get('feeling') || '').trim();
    const sourceType = form.get('source_type') === 'post' ? 'post' : 'photo';
    if (!reflectedAt || !title || !feeling) return Response.json({ error: 'Vui lòng nhập đủ ngày, tiêu đề và cảm nhận.' }, { status: 400 });

    let objectKey: string | null = null;
    let originalName: string | null = null;
    let contentType: string | null = null;
    if (file instanceof File && file.size) {
      if (!file.type.startsWith('image/')) return Response.json({ error: 'Phần 04 chỉ nhận tệp ảnh.' }, { status: 400 });
      const extension = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
      objectKey = `reflections/${id}/${crypto.randomUUID()}${extension}`;
      originalName = file.name;
      contentType = file.type;
      await (env as unknown as { MEDIA: R2Bucket }).MEDIA.put(objectKey, file.stream(), { httpMetadata: { contentType } });
    }

    const db = await ensureReflectionsSchema();
    await db.prepare('INSERT INTO reflections (id, reflected_at, title, source_type, feeling, object_key, original_name, content_type, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)')
      .bind(id, reflectedAt, title, sourceType, feeling, objectKey, originalName, contentType, now, now).run();
    return Response.json({ created: true, id });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể thêm cảm nhận.' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const body = await request.json() as { id?: string; reflected_at?: string; title?: string; source_type?: string; feeling?: string };
    if (!body.id || !body.reflected_at || !body.title || !body.feeling) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    const db = await ensureReflectionsSchema();
    await db.prepare('UPDATE reflections SET reflected_at = ?, title = ?, source_type = ?, feeling = ?, updated_at = ? WHERE id = ?')
      .bind(body.reflected_at, body.title.trim(), body.source_type === 'post' ? 'post' : 'photo', body.feeling.trim(), new Date().toISOString(), body.id).run();
    return Response.json({ updated: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật cảm nhận.' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const { id } = await request.json() as { id?: string };
    if (!id) return Response.json({ error: 'Thiếu mã cảm nhận.' }, { status: 400 });
    const db = await ensureReflectionsSchema();
    const row = await db.prepare('SELECT object_key FROM reflections WHERE id = ?').bind(id).first<{ object_key: string | null }>();
    if (row?.object_key) await (env as unknown as { MEDIA: R2Bucket }).MEDIA.delete(row.object_key);
    await db.prepare('DELETE FROM reflections WHERE id = ?').bind(id).run();
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể xóa cảm nhận.' }, { status: 500 });
  }
}
