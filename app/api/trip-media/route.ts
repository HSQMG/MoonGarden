import { isAdminRequest } from '../../../lib/admin-auth';
import { mediaUrl, storageDelete, storageGet, storageUpload, supabaseRest } from '../../../lib/supabase';

type MediaRow = { id: string; friend_trip_id: string; storage_path: string; original_name: string; media_type: 'image' | 'video'; mime_type: string; size_bytes: number; created_at: string };
const validTripId = (value: string) => /^[0-9a-f-]{36}$/i.test(value);

function uniqueKey(tripId: string, file: File) {
  const extension = file.name.match(/\.([a-zA-Z0-9]{1,10})$/)?.[1].toLowerCase();
  return `friend-trips/${tripId}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`;
}

export async function GET(request: Request) {
  try {
    const key = new URL(request.url).searchParams.get('key');
    if (key) {
      if (!key.startsWith('friend-trips/')) return new Response('Không hợp lệ', { status: 400 });
      const object = await storageGet(key);
      if (!object.ok) return new Response('Không tìm thấy tệp', { status: object.status });
      return new Response(object.body, { headers: { 'content-type': object.headers.get('content-type') || 'application/octet-stream', 'cache-control': 'private, max-age=3600' } });
    }
    const rows = await supabaseRest<MediaRow[]>('trip_media?select=*&order=friend_trip_id.asc,sort_order.asc,created_at.asc');
    return Response.json({ media: rows.map((row) => ({ id: row.id, key: row.storage_path, tripId: row.friend_trip_id, type: row.media_type, name: row.storage_path.split('/').at(-1), originalName: row.original_name, size: row.size_bytes, createdAt: row.created_at, url: mediaUrl('trip', row.storage_path) })) });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể đọc thư viện.' }, { status: 502 });
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: 'Bạn không có quyền quản lý thư viện.' }, { status: 403 });
  const uploadedPaths: string[] = [];
  try {
    const form = await request.formData();
    const tripId = String(form.get('tripId') || '');
    const files = form.getAll('files').filter((item): item is File => item instanceof File && item.size > 0);
    if (!validTripId(tripId)) return Response.json({ error: 'Chuyến đi không hợp lệ.' }, { status: 400 });
    if (!files.length) return Response.json({ error: 'Chưa chọn tệp.' }, { status: 400 });
    if (files.length > 30) return Response.json({ error: 'Mỗi lần chỉ tải tối đa 30 tệp.' }, { status: 400 });
    const uploaded = [];
    for (const file of files) {
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) throw new Error(`${file.name} không phải ảnh hoặc video.`);
      if (file.size > 50 * 1024 * 1024) throw new Error(`${file.name} vượt quá 50 MB.`);
      const path = uniqueKey(tripId, file);
      await storageUpload(path, file);
      uploadedPaths.push(path);
      const rows = await supabaseRest<MediaRow[]>('trip_media', { method: 'POST', body: JSON.stringify({ friend_trip_id: tripId, storage_bucket: process.env.SUPABASE_STORAGE_BUCKET || 'journey-media', storage_path: path, original_name: file.name, media_type: file.type.startsWith('video/') ? 'video' : 'image', mime_type: file.type, size_bytes: file.size, sort_order: 0 }) }, true);
      const row = rows[0];
      uploaded.push({ id: row.id, key: path, tripId, type: row.media_type, name: path.split('/').at(-1), originalName: file.name, size: file.size, createdAt: row.created_at, url: mediaUrl('trip', path) });
    }
    return Response.json({ media: uploaded });
  } catch (error) {
    await storageDelete(uploadedPaths).catch(() => undefined);
    if (uploadedPaths.length) await supabaseRest(`trip_media?storage_path=in.(${uploadedPaths.map(encodeURIComponent).join(',')})`, { method: 'DELETE' }, true).catch(() => undefined);
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể tải tệp lên.' }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: 'Bạn không có quyền quản lý thư viện.' }, { status: 403 });
  try {
    const { key } = await request.json() as { key?: string };
    if (!key?.startsWith('friend-trips/')) return Response.json({ error: 'Tệp không hợp lệ.' }, { status: 400 });
    await supabaseRest(`trip_media?storage_path=eq.${encodeURIComponent(key)}`, { method: 'DELETE' }, true);
    await storageDelete([key]);
    return Response.json({ deleted: true, key });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể xóa tệp.' }, { status: 502 });
  }
}
