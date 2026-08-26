type SupabaseMilestone = {
  id: string;
  event_year: number;
  title: string;
  description: string;
  icon: string;
  image_path: string | null;
  image_alt: string | null;
  sort_order: number;
};

type SupabaseTrip = {
  id: string;
  trip_date: string;
  title: string;
  friends: string;
  description: string;
  tone: string;
  sort_order: number;
};

async function supabaseGet<T>(table: string, query: string) {
  const baseUrl = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!baseUrl || !key) throw new Error('Supabase chưa được cấu hình.');
  const response = await fetch(`${baseUrl}/rest/v1/${table}?${query}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Supabase trả về lỗi ${response.status}.`);
  return response.json() as Promise<T>;
}

export async function GET() {
  try {
    const [milestones, friendTrips] = await Promise.all([
      supabaseGet<SupabaseMilestone[]>('milestones', 'select=*&order=sort_order.asc'),
      supabaseGet<SupabaseTrip[]>('friend_trips', 'select=*&order=sort_order.asc'),
    ]);
    return Response.json({ milestones, friendTrips });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : 'Không thể đọc dữ liệu.' }, { status: 502 });
  }
}
