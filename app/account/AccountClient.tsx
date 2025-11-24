'use client';
import { useEffect, useMemo, useState } from 'react';
import ProfileCard from './_components/ProfileCard';
import PersonalInfoForm from './_components/PersonalInfoForm';
import ContactInfoForm from './_components/ContactInfoForm';
import ProfessionalInfoForm from './_components/ProfessionalInfoForm';
import AvatarUploader from './_components/AvatarUploader';
import PasswordSection from './_components/PasswordSection';
import { api } from './_lib/api';
import { useToast } from './_lib/useToast';

type User = {
  id: string; email: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  gender?: 'M'|'F'|'O'|null;
  birthDate?: string | null;
};

type DoctorProfile = {
  id: string; userId: string;
  specialty?: string | null;
  hospitalType?: string | null;
  address?: string | null;
  city?: string | null;
  presentation?: string | null;
  formations?: string | null;
  experiences?: string | null;
};

const EMPTY_PROFILE: DoctorProfile = {
  id: 'temp', userId: 'temp',
  specialty: '', hospitalType: '', address: '', city: '',
  presentation: '', formations: '', experiences: '',
};

export default function AccountClient() {
  const [user, setUser] = useState<User|null>(null);
  const [profile, setProfile] = useState<DoctorProfile|null>(null);
  const [tab, setTab] = useState<'profil'|'contact'|'professionnel'|'sécurité'>('profil');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  async function ensureProfile(): Promise<DoctorProfile> {
    try {
      return await api.get('/doctor-profiles/me');
    } catch (e: any) {
      if (e?.status === 404) {
        const created = await api.post('/doctor-profiles', {}); // doit renvoyer le profil
        // si ton POST ne renvoie rien, re-fetch :
        return created?.id ? created : await api.get('/doctor-profiles/me');
      }
      throw e;
    }
  }

  useEffect(() => {
    (async () => {
      try {
        const me = await api.get('/me');
        setUser(me);
        const prof = await ensureProfile();
        setProfile(prof);
      } catch (e:any) {
        if (e?.status === 401) {
          window.location.href = '/auth/login';
        } else {
          toast('Impossible de charger votre compte', 'error');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [toast]);

  if (loading || !user) {
    return <div className="card" style={{marginTop:24}}>Chargement…</div>;
  }

  // ✅ Toujours passer un objet sûr aux sous-composants
  const safeProfile = profile ?? EMPTY_PROFILE;

  return (
    <div style={{display:'grid', gap:16, padding:'24px 0'}}>
      <h1>Mon compte</h1>

      <ProfileCard
        fullName={user.fullName || user.email}
        email={user.email}
        city={safeProfile.city || '—'}
        avatarUrl={user.avatarUrl}
      >
        <div className="row" style={{gap:8, flexWrap:'wrap'}}>
          <button className={`btn ${tab==='profil'?'primary':''}`} onClick={()=>setTab('profil')}>Profil</button>
          <button className={`btn ${tab==='contact'?'primary':''}`} onClick={()=>setTab('contact')}>Contact</button>
          <button className={`btn ${tab==='professionnel'?'primary':''}`} onClick={()=>setTab('professionnel')}>Professionnel</button>
          <button className={`btn ${tab==='sécurité'?'primary':''}`} onClick={()=>setTab('sécurité')}>Sécurité</button>
        </div>
      </ProfileCard>

      <div className="grid" style={{gridTemplateColumns:'1.2fr 1fr', gap:16}}>
        <div className="grid" style={{gap:16}}>
          {tab==='profil' && (
            <>
              <AvatarUploader
                avatarUrl={user.avatarUrl || null}
                onUploaded={async (url) => {
                  const updated = await api.put('/me', { avatarUrl: url });
                  setUser(updated);
                  toast('Photo mise à jour','success');
                }}
              />
              <PersonalInfoForm
                profile={safeProfile}
                onSave={async (data) => {
                  const updated = await api.put('/me', data);
                  setUser(updated);
                  toast('Profil mis à jour','success');
                }}
              />
            </>
          )}

          {tab==='contact' && (
            <ContactInfoForm
              user={user}
              profile={safeProfile}
              onSave={async (data) => {
                const up1 = await api.put('/me', { phone: data.phone });
                const up2 = await api.put('/doctor-profiles/me', {
                  address: data.address, city: data.city
                });
                setUser(up1); setProfile(up2);
                toast('Coordonnées mises à jour','success');
              }}
            />
          )}

          {tab==='professionnel' && (
            <ProfessionalInfoForm
              profile={safeProfile}
              onSave={async (data) => {
                const up = await api.put('/doctor-profiles/me', data);
                setProfile(up);
                toast('Informations professionnelles enregistrées','success');
              }}
            />
          )}

          {tab==='sécurité' && (
            <PasswordSection
              onSave={async (data) => {
                await api.post('/auth/change-password', data);
                toast('Mot de passe mis à jour','success');
              }}
            />
          )}
        </div>

        {/* ======== Bloc qualité du profil ======== */}
        <aside className="card" style={{ alignSelf: 'start' }}>
          <h3>Qualité du profil</h3>

          {(() => {
            // ✅ calcul dynamique du score
            const checks = [
              { ok: !!user.avatarUrl, label: 'Photo de profil' },
              { ok: !!user.fullName, label: 'Nom complet' },
              { ok: !!user.phone, label: 'Téléphone' },
              { ok: !!safeProfile.specialty, label: 'Spécialité' },
              { ok: !!safeProfile.city, label: 'Ville' },
              { ok: !!safeProfile.presentation, label: 'Présentation' },
            ];
            const done = checks.filter(c => c.ok).length;
            const percent = Math.round((done / checks.length) * 100);

            return (
              <>
                {/* Barre de progression */}
                <div style={{
                  width: '100%',
                  background: '#f3f4f6',
                  borderRadius: 999,
                  height: 8,
                  marginTop: 8,
                  overflow: 'hidden',
                }}>
                  <div style={{
                    width: `${percent}%`,
                    height: '100%',
                    background: percent >= 80 ? '#10b981' : '#f59e0b',
                    transition: 'width 0.3s',
                  }} />
                </div>
                <div className="small" style={{ marginTop: 6 }}>
                  Profil complété à <strong>{percent}%</strong>
                </div>

                {/* Liste détaillée */}
                <ul className="small" style={{ marginTop: 10, lineHeight: 1.6 }}>
                  {checks.map((c, i) => (
                    <li key={i}>
                      {c.ok ? '✅' : '⬜️'} {c.label}
                    </li>
                  ))}
                </ul>

                <p className="small" style={{ color: 'var(--muted)', marginTop: 8 }}>
                  Les fiches complètes apparaissent plus haut dans les recherches.  
                  Ajoutez une photo, vos coordonnées et une courte présentation pour atteindre 100 %.
                </p>
              </>
            );
          })()}
        </aside>
      </div>
    </div>
  );
}