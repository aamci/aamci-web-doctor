// app/doctors/[id]/success/page.tsx

export default async function Success({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  // ✅ on attend la Promise fournie par Next 15
  const sp = await searchParams;
  const aid = Array.isArray(sp.aid) ? sp.aid[0] : sp.aid;

  return (
    <div style={{ display: 'grid', gap: 16, padding: '24px 0' }}>
      <div className="card">
        <h2>Rendez-vous confirmé 🎉</h2>

        <p>
          ID de la réservation :
          <br />
          <code>{aid ?? 'n/a'}</code>
        </p>

        <div className="row" style={{ marginTop: 12, flexWrap: 'wrap' }}>
          <a className="btn primary" href="/doctors">
            Retour à la liste
          </a>
          <a className="btn ghost" href="/protected">
            Voir mon profil
          </a>
        </div>
      </div>
    </div>
  );
}