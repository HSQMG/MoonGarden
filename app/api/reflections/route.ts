import { env } from 'cloudflare:workers';

type ReflectionRow = { id: string; reflected_at: string; title: string; source_type: 'photo' | 'post'; feeling: string; image_path: string | null };

function isAdmin(request: Request) {
  if (process.env.NODE_ENV === 'development') return true;
  const expected = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const current = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  return Boolean(expected && current && expected === current);
}

function supabaseConfig(admin = false) {
  const url = process.env.SUPABASE_URL;
  const key = admin ? process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase chưa được cấu hình đầy đủ.');
  return { url, key };
}

async function supabase(path: string, init: RequestInit = {}, admin = false) {
  const { url, key } = supabaseConfig(admin);
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || `Supabase trả về lỗi ${response.status}.`);
  return body;
}

const publicItem = (row: ReflectionRow) => ({
  id: row.id, reflected_at: row.reflected_at, title: row.title, source_type: row.source_type, feeling: row.feeling,
  image_url: row.image_path ? `/api/reflections?key=${encodeURIComponent(row.image_path)}` : null,
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
    const rows = await supabase('reflections?select=id,reflected_at,title,source_type,feeling,image_path&order=reflected_at.desc,created_at.desc') as ReflectionRow[];
    return Response.json({ reflections: rows.map(publicItem) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể tải cảm nhận.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  let imagePath: string | null = null;
  try {
    const form = await request.formData();
    const file = form.get('file');
    const id = crypto.randomUUID();
    const reflectedAt = String(form.get('reflected_at') || '');
    const title = String(form.get('title') || '').trim();
    const feeling = String(form.get('feeling') || '').trim();
    const sourceType = form.get('source_type') === 'post' ? 'post' : 'photo';
    if (!reflectedAt || !title || !feeling) return Response.json({ error: 'Vui lòng nhập đủ ngày, tiêu đề và cảm nhận.' }, { status: 400 });
    if (file instanceof File && file.size) {
      if (!file.type.startsWith('image/')) return Response.json({ error: 'Phần 04 chỉ nhận tệp ảnh.' }, { status: 400 });
      const extension = file.name.includes('.') ? `.${file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '')}` : '';
      imagePath = `reflections/${id}/${crypto.randomUUID()}${extension}`;
      await (env as unknown as { MEDIA: R2Bucket }).MEDIA.put(imagePath, file.stream(), { httpMetadata: { contentType: file.type } });
    }
    await supabase('reflections', { method: 'POST', body: JSON.stringify({ id, reflected_at: reflectedAt, title, source_type: sourceType, feeling, image_path: imagePath }) }, true);
    return Response.json({ created: true, id });
  } catch (error) {
    if (imagePath) await (env as unknown as { MEDIA: R2Bucket }).MEDIA.delete(imagePath).catch(() => undefined);
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể thêm cảm nhận.' }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const body = await request.json() as { id?: string; reflected_at?: string; title?: string; source_type?: string; feeling?: string };
    if (!body.id || !body.reflected_at || !body.title || !body.feeling) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    await supabase(`reflections?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify({ reflected_at: body.reflected_at, title: body.title.trim(), source_type: body.source_type === 'post' ? 'post' : 'photo', feeling: body.feeling.trim(), updated_at: new Date().toISOString() }) }, true);
    return Response.json({ updated: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật cảm nhận.' }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const { id } = await request.json() as { id?: string };
    if (!id) return Response.json({ error: 'Thiếu mã cảm nhận.' }, { status: 400 });
    const rows = await supabase(`reflections?id=eq.${encodeURIComponent(id)}&select=image_path`, { method: 'GET' }, true) as Array<{ image_path: string | null }>;
    await supabase(`reflections?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' }, true);
    if (rows[0]?.image_path?.startsWith('reflections/')) await (env as unknown as { MEDIA: R2Bucket }).MEDIA.delete(rows[0].image_path);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể xóa cảm nhận.' }, { status: 502 });
  }
}
