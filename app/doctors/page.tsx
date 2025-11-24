// apps/web-patient/app/doctors/page.tsx
import Link from 'next/link';
import styles from './DoctorsPage.module.css';

function getApiBase(): string | null {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : null;
  } catch {
    return null;
  }
}

export default async function DoctorsPage({
  // ✅ Next 15 : searchParams est une Promise
  searchParams,
}: {
  searchParams: Promise<{ q?: string; city?: string }>;
}) {
  const sp = await searchParams;
  const q = sp?.q ?? '';
  const city = sp?.city ?? '';

  const api = getApiBase();
  const url = api
    ? `${api}/search/doctors?q=${encodeURIComponent(q)}&city=${encodeURIComponent(
        city,
      )}`
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
    <div className={styles.wrapper}>
      <header className={styles.headerRow}>
        <h1 className={styles.title}>Médecins</h1>
        <p className={styles.subtitle}>
          Recherchez par nom, spécialité ou ville et prenez rendez-vous en quelques clics.
        </p>
      </header>

      {/* Formulaire de recherche */}
      <form className={styles.searchForm} action="/doctors">
        <input
          className={`input ${styles.searchInput}`}
          name="q"
          placeholder="Nom / spécialité"
          defaultValue={q}
        />
        <input
          className={`input ${styles.searchInput}`}
          name="city"
          placeholder="Ville"
          defaultValue={city}
        />
        <button className="btn primary" type="submit">
          Rechercher
        </button>
      </form>

      {/* Liste des médecins */}
      <div className={styles.cardsGrid}>
        {doctors.map((d: any) => (
          <div key={d.id} className={`card ${styles.cardDoctor}`}>
            <div>
              <div className={styles.doctorName}>{d.name}</div>
              <div className={styles.doctorMeta}>
                {d.specialty} • {d.city}
                {d.hospital ? ` • ${d.hospital}` : ''}
              </div>
            </div>
            <div className={styles.cardFooter}>
              <Link className="btn outline" href={`/doctors/${d.id}`}>
                Voir la fiche
              </Link>
              <Link className="btn primary" href={`/doctors/${d.id}#slots`}>
                Prendre RDV
              </Link>
            </div>
          </div>
        ))}

        {!doctors.length && (
          <div className={`card ${styles.emptyCard}`}>
            Aucun résultat pour cette recherche. Essayez avec un autre nom, une autre spécialité ou une ville
            différente.
          </div>
        )}
      </div>
    </div>
  );
}