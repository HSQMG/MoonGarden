const storageBucket = () => process.env.SUPABASE_STORAGE_BUCKET || 'journey-media';

const errorMessage = (body: unknown) => {
  if (!body || typeof body !== 'object') return null;
  const value = body as { message?: unknown; error?: unknown };
  return typeof value.message === 'string' ? value.message : typeof value.error === 'string' ? value.error : null;
};

function config(secret = false) {
  const url = process.env.SUPABASE_URL;
  const key = secret ? process.env.SUPABASE_SECRET_KEY : process.env.SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('Supabase chưa được cấu hình đầy đủ.');
  return { url: url.replace(/\/$/, ''), key };
}

export async function supabaseRest<T>(path: string, init: RequestInit = {}, secret = false) {
  const { url, key } = config(secret);
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json', Prefer: 'return=representation', ...(init.headers || {}) },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) throw new Error(errorMessage(body) || `Supabase trả về lỗi ${response.status}.`);
  return body as T;
}

export async function storageUpload(path: string, file: File) {
  const { url, key } = config(true);
  const response = await fetch(`${url}/storage/v1/object/${storageBucket()}/${path}`, {
    method: 'POST', body: file,
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': file.type || 'application/octet-stream', 'x-upsert': 'false' },
  });
  if (!response.ok) throw new Error(errorMessage(await response.json().catch(() => null)) || `Không thể tải tệp lên Supabase (${response.status}).`);
}

export async function storageGet(path: string) {
  const { url, key } = config(true);
  return fetch(`${url}/storage/v1/object/${storageBucket()}/${path}`, { headers: { apikey: key, Authorization: `Bearer ${key}` }, cache: 'no-store' });
}

export async function storageDelete(paths: string[]) {
  if (!paths.length) return;
  const { url, key } = config(true);
  const response = await fetch(`${url}/storage/v1/object/${storageBucket()}`, {
    method: 'DELETE',
    headers: { apikey: key, Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!response.ok) throw new Error(errorMessage(await response.json().catch(() => null)) || `Không thể xóa tệp (${response.status}).`);
}

export const mediaUrl = (kind: 'trip' | 'milestone', path: string) => `/api/${kind === 'trip' ? 'trip-media' : 'milestone-media'}?key=${encodeURIComponent(path)}`;
