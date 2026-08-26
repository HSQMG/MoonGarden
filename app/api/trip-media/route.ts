import { env } from 'cloudflare:workers';

const bucket = () => (env as unknown as { MEDIA: R2Bucket }).MEDIA;
const validTrip = (value: string | null) => value !== null && /^[0-2]$/.test(value);

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

  const objects = await bucket().list({ prefix: 'friend-trips/', include: ['httpMetadata'] });
  const media = objects.objects.map((object) => {
    const tripIndex = Number(object.key.split('/')[1]);
    const contentType = object.httpMetadata?.contentType || '';
    return {
      key: object.key,
      tripIndex,
      type: contentType.startsWith('video/') ? 'video' : 'image',
      url: `/api/trip-media?key=${encodeURIComponent(object.key)}`,
    };
  });
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
  for (const [index, file] of files.entries()) {
    const safeName = file.name.normalize('NFKD').replace(/[^a-zA-Z0-9._-]+/g, '-');
    const key = `friend-trips/${tripIndex}/${Date.now()}-${index}-${safeName}`;
    await bucket().put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    uploaded.push({ key, tripIndex: Number(tripIndex), type: file.type.startsWith('video/') ? 'video' : 'image', url: `/api/trip-media?key=${encodeURIComponent(key)}` });
  }

  return Response.json({ media: uploaded });
}
