// app/account/_lib/api.ts
function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try { return base ? new URL(base).toString().replace(/\/$/,'') : null; } catch { return null; }
}

async function _request(path: string, init: RequestInit = {}) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : path;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string,string> = { ...(init.headers as any) };
  if (!headers['Content-Type'] && !(init.body instanceof FormData)) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(url, { ...init, headers, cache: 'no-store' });

  if (res.status === 401) {
    // ne touche pas au token ici; laisse le caller décider
    const msg = await res.text().catch(()=> 'Unauthorized');
    const err: any = new Error(msg || 'Unauthorized');
    err.status = 401;
    throw err;
  }

  if (!res.ok) {
    const t = await res.text().catch(()=> '');
    throw new Error(t || `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

export const api = {
  get: (p: string) => _request(p, { method: 'GET' }),
  post: (p: string, body?: any) => _request(p, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) }),
  put: (p: string, body?: any) => _request(p, { method: 'PUT', body: JSON.stringify(body) }),
  upload: (p: string, form: FormData) => _request(p, { method: 'POST', body: form }),
};