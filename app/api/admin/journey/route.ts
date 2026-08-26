import { env } from 'cloudflare:workers';
import { ensureMediaSchema } from '../../../../db/media';

type Entity = 'milestone' | 'friendTrip';
type Payload = { entity?: Entity; id?: string; tripIndex?: number; data?: Record<string, unknown> };

const tableFor = (entity: Entity) => entity === 'milestone' ? 'milestones' : 'friend_trips';

function isAdmin(request: Request) {
  if (process.env.NODE_ENV === 'development') return true;
  const expected = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const current = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase();
  return Boolean(expected && current && expected === current);
}

function adminKey() {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) throw new Error('Supabase Secret Key chưa được cấu hình.');
  return key;
}

async function supabase(path: string, init: RequestInit) {
  const baseUrl = process.env.SUPABASE_URL;
  if (!baseUrl) throw new Error('Supabase URL chưa được cấu hình.');
  const key = adminKey();
  const response = await fetch(`${baseUrl}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'content-type': 'application/json',
      Prefer: 'return=representation',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(body?.message || `Supabase trả về lỗi ${response.status}.`);
  return body;
}

function cleanData(entity: Entity, input: Record<string, unknown>, creating = false) {
  const milestoneFields = ['event_year', 'title', 'description', 'icon', 'image_path', 'image_alt', 'sort_order'];
  const tripFields = ['trip_date', 'title', 'friends', 'description', 'tone', 'sort_order'];
  const allowed = entity === 'milestone' ? milestoneFields : tripFields;
  const data = Object.fromEntries(Object.entries(input).filter(([key]) => allowed.includes(key)));
  if (creating) data.slug = `${entity === 'milestone' ? 'cot-moc' : 'chuyen-di'}-${crypto.randomUUID()}`;
  data.updated_at = new Date().toISOString();
  return data;
}

async function deleteTripMedia(tripIndex: number) {
  const db = await ensureMediaSchema();
  const rows = await db.prepare('SELECT object_key FROM trip_media WHERE trip_index = ?').bind(tripIndex).all<{ object_key: string }>();
  const mediaBucket = (env as unknown as { MEDIA: R2Bucket }).MEDIA;
  if (rows.results.length) await mediaBucket.delete(rows.results.map((row) => row.object_key));
  await db.prepare('DELETE FROM trip_media WHERE trip_index = ?').bind(tripIndex).run();
}

async function orderedTrips() {
  return await supabase('friend_trips?select=id&order=trip_date.asc,created_at.asc', { method: 'GET' }) as Array<{ id: string }>;
}

async function syncTripMediaIndices(before: Array<{ id: string }>, after: Array<{ id: string }>) {
  const oldIndex = new Map(before.map((trip, index) => [trip.id, index]));
  const db = await ensureMediaSchema();
  const statements = [db.prepare('UPDATE trip_media SET trip_index = trip_index + 10000')];
  after.forEach((trip, newIndex) => {
    const previous = oldIndex.get(trip.id);
    if (previous !== undefined) statements.push(db.prepare('UPDATE trip_media SET trip_index = ? WHERE trip_index = ?').bind(newIndex, previous + 10000));
  });
  await db.batch(statements);
}

async function milestoneMediaKey(id: string) {
  const rows = await supabase(`milestones?id=eq.${encodeURIComponent(id)}&select=image_path`, { method: 'GET' });
  const path = rows?.[0]?.image_path;
  if (typeof path !== 'string' || !path.startsWith('/api/milestone-media?')) return null;
  return new URL(path, 'https://local.invalid').searchParams.get('key');
}

export async function POST(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const body = await request.json() as Payload;
    if (!body.entity || !body.data) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    const before = body.entity === 'friendTrip' ? await orderedTrips() : [];
    const rows = await supabase(tableFor(body.entity), { method: 'POST', body: JSON.stringify(cleanData(body.entity, body.data, true)) });
    if (body.entity === 'friendTrip') await syncTripMediaIndices(before, await orderedTrips());
    return Response.json({ item: rows?.[0] });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể thêm dữ liệu.' }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const body = await request.json() as Payload;
    if (!body.entity || !body.id || !body.data) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    const before = body.entity === 'friendTrip' ? await orderedTrips() : [];
    const rows = await supabase(`${tableFor(body.entity)}?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify(cleanData(body.entity, body.data)) });
    if (body.entity === 'friendTrip') await syncTripMediaIndices(before, await orderedTrips());
    return Response.json({ item: rows?.[0] });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật dữ liệu.' }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!isAdmin(request)) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const body = await request.json() as Payload;
    if (!body.entity || !body.id) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    const milestoneKey = body.entity === 'milestone' ? await milestoneMediaKey(body.id) : null;
    const before = body.entity === 'friendTrip' ? await orderedTrips() : [];
    const actualTripIndex = before.findIndex((trip) => trip.id === body.id);
    if (body.entity === 'friendTrip' && actualTripIndex >= 0) await deleteTripMedia(actualTripIndex);
    await supabase(`${tableFor(body.entity)}?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
    if (body.entity === 'friendTrip') await syncTripMediaIndices(before, await orderedTrips());
    if (milestoneKey?.startsWith('milestones/')) await (env as unknown as { MEDIA: R2Bucket }).MEDIA.delete(milestoneKey);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể xóa dữ liệu.' }, { status: 502 });
  }
}
