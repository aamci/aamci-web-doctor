// apps/web-patient/app/doctors/page.tsx
import Link from 'next/link';


function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
    console.log('API BASE ENV:',base);
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try { return base ? new URL(base).toString().replace(/\/$/,'') : null; } catch { return null; }
}
async function callApi(path: string, init?: RequestInit) {
  const base = getApiBase();

  const url = base ? `${base}${path}` : path;
  return fetch(url, init);
}

export default async function DoctorsPage(
  { searchParams }: { searchParams: Promise<{ q?: string; city?: string }> } // 👈 Promise ici
) {
  const sp = await searchParams;                       // 👈 on attend la Promise
  const q = sp?.q ?? '';
  const city = sp?.city ?? '';

  const api = getApiBase();
  console.log('API BASE:',api);
  const url = api
    ? `${api}/search/doctors?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`
    : `/search/doctors?q=${encodeURIComponent(q)}&city=${encodeURIComponent(city)}`;

  let doctors: any[] = [];
  try {
    const res = await fetch(url, { cache: 'no-store' });
    const data = await res.json();
    doctors = Array.isArray(data) ? data : data?.data || [];
  } catch {
    doctors = [];
  }

  return (
    <div style={{ display:'grid', gap:16, padding:'24px 0' }}>
      <h1>Médecins</h1>

      <form style={{ display:'grid', gridTemplateColumns:'1fr 200px 120px', gap:10 }} action="/doctors">
        <input className="input" name="q" placeholder="Nom / spécialité" defaultValue={q} />
        <input className="input" name="city" placeholder="Ville" defaultValue={city} />
        <button className="btn primary">Rechercher</button>
      </form>

      <div className="grid" style={{ gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
        {doctors.map((d: any) => (
          <div key={d.id} className="card">
            <strong>{d.name}</strong>
            <div className="small" style={{ marginTop:4, color:'var(--muted)' }}>
              {d.specialty} • {d.city} • {d.hospital}
            </div>
            <div className="row" style={{ marginTop:10 }}>
              <Link className="btn outline" href={`/doctors/${d.id}`}>Voir la fiche</Link>
              <Link className="btn primary" href={`/doctors/${d.id}#slots`}>Prendre RDV</Link>
            </div>
          </div>
        ))}
        {!doctors.length && <div className="card">Aucun résultat.</div>}
      </div>
    </div>
  );
}