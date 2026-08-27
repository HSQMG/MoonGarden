import { isAdminRequest } from '../../../../lib/admin-auth';
import { storageDelete, supabaseRest } from '../../../../lib/supabase';

type Entity = 'milestone' | 'friendTrip';
type Payload = { entity?: Entity; id?: string; tripIndex?: number; data?: Record<string, unknown> };

const tableFor = (entity: Entity) => entity === 'milestone' ? 'milestones' : 'friend_trips';

async function supabase(path: string, init: RequestInit) {
  return supabaseRest<any>(path, init, true);
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

async function deleteTripMedia(tripId: string, legacyTripIndex?: number) {
  void legacyTripIndex;
  const rows = await supabaseRest<Array<{ storage_path: string }>>(`trip_media?friend_trip_id=eq.${encodeURIComponent(tripId)}&select=storage_path`, {}, true);
  await storageDelete(rows.map((row) => row.storage_path));
}

async function milestoneMediaKey(id: string) {
  const rows = await supabase(`milestones?id=eq.${encodeURIComponent(id)}&select=image_path`, { method: 'GET' });
  const path = rows?.[0]?.image_path;
  if (typeof path !== 'string' || !path.startsWith('/api/milestone-media?')) return null;
  return new URL(path, 'https://local.invalid').searchParams.get('key');
}

type MilestoneOrderRow = { id: string; event_year: number; sort_order: number; created_at?: string };

async function reorderMilestones(targetId?: string, requestedPosition?: number) {
  const milestones = await supabase('milestones?select=id,event_year,sort_order,created_at', { method: 'GET' }) as MilestoneOrderRow[];
  const years = new Map<number, MilestoneOrderRow[]>();
  for (const milestone of milestones) {
    const group = years.get(milestone.event_year) || [];
    group.push(milestone);
    years.set(milestone.event_year, group);
  }

  for (const group of years.values()) {
    group.sort((a, b) => a.sort_order - b.sort_order || String(a.created_at || '').localeCompare(String(b.created_at || '')) || a.id.localeCompare(b.id));
    const targetIndex = targetId ? group.findIndex((item) => item.id === targetId) : -1;
    if (targetIndex >= 0) {
      const [target] = group.splice(targetIndex, 1);
      const position = Math.max(1, Math.min(Number(requestedPosition) || group.length + 1, group.length + 1));
      group.splice(position - 1, 0, target);
    }
    await Promise.all(group.map((item, index) => item.sort_order === index + 1 ? Promise.resolve() : supabase(
      `milestones?id=eq.${encodeURIComponent(item.id)}`,
      { method: 'PATCH', body: JSON.stringify({ sort_order: index + 1, updated_at: new Date().toISOString() }) },
    )));
  }
}

export async function POST(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const body = await request.json() as Payload;
    if (!body.entity || !body.data) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    const rows = await supabase(tableFor(body.entity), { method: 'POST', body: JSON.stringify(cleanData(body.entity, body.data, true)) });
    if (body.entity === 'milestone' && rows?.[0]?.id) await reorderMilestones(rows[0].id, Number(body.data.sort_order));
    return Response.json({ item: rows?.[0] });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể thêm dữ liệu.' }, { status: 502 });
  }
}

export async function PATCH(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const body = await request.json() as Payload;
    if (!body.entity || !body.id || !body.data) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    const rows = await supabase(`${tableFor(body.entity)}?id=eq.${encodeURIComponent(body.id)}`, { method: 'PATCH', body: JSON.stringify(cleanData(body.entity, body.data)) });
    if (body.entity === 'milestone') await reorderMilestones(body.id, Number(body.data.sort_order));
    return Response.json({ item: rows?.[0] });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể cập nhật dữ liệu.' }, { status: 502 });
  }
}

export async function DELETE(request: Request) {
  if (!(await isAdminRequest(request))) return Response.json({ error: 'Bạn không có quyền quản lý dữ liệu.' }, { status: 403 });
  try {
    const body = await request.json() as Payload;
    if (!body.entity || !body.id) return Response.json({ error: 'Dữ liệu không hợp lệ.' }, { status: 400 });
    const milestoneKey = body.entity === 'milestone' ? await milestoneMediaKey(body.id) : null;
    if (body.entity === 'friendTrip') await deleteTripMedia(body.id, body.tripIndex);
    await supabase(`${tableFor(body.entity)}?id=eq.${encodeURIComponent(body.id)}`, { method: 'DELETE' });
    if (body.entity === 'milestone') await reorderMilestones();
    if (milestoneKey?.startsWith('milestones/')) await storageDelete([milestoneKey]);
    return Response.json({ deleted: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể xóa dữ liệu.' }, { status: 502 });
  }
}
