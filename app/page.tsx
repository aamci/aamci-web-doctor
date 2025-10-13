export default async function Home(){
  const api = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3001';
  const res = await fetch(`${api}/healthz`, { cache:'no-store' });
  const h = await res.json().catch(()=>({ok:false}));
  return (<div className='card'>API ok: {String(h.ok)} — {h.ts || 'n/a'}</div>);
}
