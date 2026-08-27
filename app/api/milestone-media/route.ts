import { isAdminRequest } from '../../../lib/admin-auth';
import { mediaUrl, storageDelete, storageGet, storageUpload, supabaseRest } from '../../../lib/supabase';

function storageKeyFromPath(path: string | null) {
  if (!path?.startsWith('/api/milestone-media?')) return null;
  return new URL(path, 'https://local.invalid').searchParams.get('key');
}

function uniqueKey(milestoneId: string, file: File) {
  const extension = file.name.match(/\.([a-zA-Z0-9]{1,10})$/)?.[1].toLowerCase();
  return `milestones/${milestoneId}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;
}

export async function GET(request: Request) {
  const key = new URL(request.url).searchParams.get('key');
  if (!key?.startsWith('milestones/')) return new Response('Không hợp lệ', { status: 400 });
  const object = await storageGet(key);
  if (!object.ok) return new Response('Không tìm thấy ảnh', { status: object.status });
  return new Response(object.body, { headers: { 'content-type': object.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'private, max-age=3600' } });
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: 'Bạn không có quyền quản lý ảnh.' }, { status: 403 });
  let key: string | null = null;
  try {
    const form = await request.formData();
    const milestoneId = String(form.get('milestoneId') || '');
    const file = form.get('file');
    if (!milestoneId || !(file instanceof File)) return Response.json({ error: 'Chưa chọn ảnh.' }, { status: 400 });
    if (!file.type.startsWith('image/')) return Response.json({ error: 'Phần 02 chỉ chấp nhận tệp ảnh.' }, { status: 400 });
    if (file.size > 15 * 1024 * 1024) return Response.json({ error: 'Ảnh vượt quá 15 MB.' }, { status: 400 });
    const rows = await supabaseRest<Array<{ image_path: string | null }>>(`milestones?id=eq.${encodeURIComponent(milestoneId)}&select=image_path`, {}, true);
    if (!rows.length) return Response.json({ error: 'Không tìm thấy cột mốc.' }, { status: 404 });
    const oldKey = storageKeyFromPath(rows[0].image_path);
    key = uniqueKey(milestoneId, file);
    await storageUpload(key, file);
    const imagePath = mediaUrl('milestone', key);
    await supabaseRest(`milestones?id=eq.${encodeURIComponent(milestoneId)}`, { method: 'PATCH', body: JSON.stringify({ image_path: imagePath, image_alt: file.name, updated_at: new Date().toISOString() }) }, true);
    if (oldKey) await storageDelete([oldKey]);
    return Response.json({ imagePath, imageAlt: file.name });
  } catch (error) {
    if (key) await storageDelete([key]).catch(() => undefined);
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể tải ảnh lên.' }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: 'Bạn không có quyền quản lý ảnh.' }, { status: 403 });
  try {
    const { milestoneId } = await request.json() as { milestoneId?: string };
    if (!milestoneId) return Response.json({ error: 'Cột mốc không hợp lệ.' }, { status: 400 });
    const rows = await supabaseRest<Array<{ image_path: string | null }>>(`milestones?id=eq.${encodeURIComponent(milestoneId)}&select=image_path`, {}, true);
    if (!rows.length) return Response.json({ error: 'Không tìm thấy cột mốc.' }, { status: 404 });
    const oldKey = storageKeyFromPath(rows[0].image_path);
    await supabaseRest(`milestones?id=eq.${encodeURIComponent(milestoneId)}`, { method: 'PATCH', body: JSON.stringify({ image_path: null, image_alt: null, updated_at: new Date().toISOString() }) }, true);
    if (oldKey) await storageDelete([oldKey]);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể xóa ảnh.' }, { status: 502 });
  }
}
