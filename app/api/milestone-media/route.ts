import { env } from 'cloudflare:workers';

const bucket = () => (env as unknown as { MEDIA: R2Bucket }).MEDIA;

function isAdmin(request: Request) {
  if (process.env.NODE_ENV === 'development') return true;
  const expected = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const current = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  return Boolean(expected && current && expected === current);
}

function supabaseConfig() {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!baseUrl || !key) throw new Error('Supabase quản trị chưa được cấu hình.');
  return { baseUrl, key };
}

async function supabase(path: string, init: RequestInit = {}) {
  const { baseUrl, key } = supabaseConfig();
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json', Prefer: 'return=representation' },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || `Supabase trả về lỗi ${response.status}.`);
  return body;
}

function storageKeyFromPath(path: string | null) {
  if (!path?.startsWith('/api/milestone-media?')) return null;
  return new URL(path, 'https://local.invalid').searchParams.get('key');
}

async function uniqueKey(milestoneId: string, file: File) {
  const extension = file.name.match(/\.([a-zA-Z0-9]{1,10})$/)?.[1].toLowerCase();
  while (true) {
    const key = `milestones/${milestoneId}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;
    if (!(await bucket().head(key))) return key;
  }
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key');
  if (!key?.startsWith('milestones/')) return new Response('Không hợp lệ', { status: 400 });
  const object = await bucket().get(key);
  if (!object) return new Response('Không tìm thấy ảnh', { status: 404 });
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  headers.set('cache-control', 'private, max-age=3600');
  return new Response(object.body, { headers });
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý ảnh.' }, { status: 403 });
  try {
    const form = await request.formData();
    const milestoneId = String(form.get('milestoneId') || '');
    const file = form.get('file');
    if (!milestoneId || !(file instanceof File)) return Response.json({ error: 'Chưa chọn ảnh.' }, { status: 400 });
    if (!file.type.startsWith('image/')) return Response.json({ error: 'Phần 02 chỉ chấp nhận tệp ảnh.' }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return Response.json({ error: 'Ảnh vượt quá 15 MB.' }, { status: 400 });

    const rows = await supabase(`milestones?id=eq.${encodeURIComponent(milestoneId)}&select=image_path`);
    if (!rows?.length) return Response.json({ error: 'Không tìm thấy cột mốc.' }, { status: 404 });
    const oldKey = storageKeyFromPath(rows[0].image_path);
    const key = await uniqueKey(milestoneId, file);
    await bucket().put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    const imagePath = `/api/milestone-media?key=${encodeURIComponent(key)}`;

    try {
      await supabase(`milestones?id=eq.${encodeURIComponent(milestoneId)}`, {
        method: 'PATCH',
        body: JSON.stringify({ image_path: imagePath, image_alt: file.name, updated_at: new Date().toISOString() }),
      });
    } catch (error) {
      await bucket().delete(key);
      throw error;
    }
    if (oldKey) await bucket().delete(oldKey);
    return Response.json({ imagePath, imageAlt: file.name });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể tải ảnh lên.' }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý ảnh.' }, { status: 403 });
  try {
    const { milestoneId } = await request.json() as { milestoneId?: string };
    if (!milestoneId) return Response.json({ error: 'Cột mốc không hợp lệ.' }, { status: 400 });
    const rows = await supabase(`milestones?id=eq.${encodeURIComponent(milestoneId)}&select=image_path`);
    if (!rows?.length) return Response.json({ error: 'Không tìm thấy cột mốc.' }, { status: 404 });
    const oldKey = storageKeyFromPath(rows[0].image_path);
    await supabase(`milestones?id=eq.${encodeURIComponent(milestoneId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ image_path: null, image_alt: null, updated_at: new Date().toISOString() }),
    });
    if (oldKey) await bucket().delete(oldKey);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể xóa ảnh.' }, { status: 502 });
  }
}
