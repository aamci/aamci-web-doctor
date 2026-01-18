'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MedicalNote {
  id: string;
  type: string;
  title: string | null;
  content: string;
  isPrivate: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
    email: string;
  };
  appointment: {
    id: string;
    slot: {
      start: string;
    };
  } | null;
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  OBSERVATION: 'Observation',
  FOLLOW_UP: 'Suivi',
  PRESCRIPTION: 'Prescription',
  DIAGNOSIS: 'Diagnostic',
  TREATMENT_PLAN: 'Plan de traitement',
  OTHER: 'Autre',
};

const NOTE_TYPE_COLORS: Record<string, string> = {
  OBSERVATION: '#3b82f6',
  FOLLOW_UP: '#10b981',
  PRESCRIPTION: '#8b5cf6',
  DIAGNOSIS: '#f59e0b',
  TREATMENT_PLAN: '#ec4899',
  OTHER: '#6b7280',
};

function getApiBase(): string {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : '';
  } catch {
    return '';
  }
}

export default function MedicalNotesPage() {
  const router = useRouter();
  const [notes, setNotes] = useState<MedicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const apiBase = getApiBase();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    async function fetchData() {
      try {
        const [notesRes, tagsRes] = await Promise.all([
          fetch(`${apiBase}/medical-notes`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiBase}/medical-notes/tags`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (notesRes.ok) {
          const notesData = await notesRes.json();
          setNotes(notesData);
        }

        if (tagsRes.ok) {
          const tagsData = await tagsRes.json();
          setTags(tagsData);
        }
      } catch (error) {
        console.error('Error fetching notes:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [apiBase, router]);

  const filteredNotes = notes.filter((note) => {
    const matchesType = !selectedType || note.type === selectedType;
    const matchesSearch =
      !searchQuery ||
      note.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.patient.fullName?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const deleteNote = async (noteId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette note ?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/medical-notes/${noteId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n.id !== noteId));
      }
    } catch (error) {
      console.error('Error deleting note:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '24px 0' }}>
        <h1>Notes Médicales</h1>
        <div className="card" style={{ marginTop: 16 }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0', display: 'grid', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Notes Médicales</h1>
        <button className="btn primary" onClick={() => setShowCreateModal(true)}>
          + Nouvelle note
        </button>
      </div>

      {/* Statistiques */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        {Object.entries(NOTE_TYPE_LABELS).map(([type, label]) => {
          const count = notes.filter((n) => n.type === type).length;
          return (
            <div
              key={type}
              className="card"
              style={{
                textAlign: 'center',
                padding: 12,
                cursor: 'pointer',
                border: selectedType === type ? `2px solid ${NOTE_TYPE_COLORS[type]}` : undefined,
              }}
              onClick={() => setSelectedType(selectedType === type ? null : type)}
            >
              <div style={{ fontSize: 24, fontWeight: 700, color: NOTE_TYPE_COLORS[type] }}>
                {count}
              </div>
              <div style={{ fontSize: 12, color: '#6b7280' }}>{label}</div>
            </div>
          );
        })}
      </div>

      {/* Recherche */}
      <div style={{ display: 'flex', gap: 12 }}>
        <input
          type="text"
          className="input"
          placeholder="Rechercher dans les notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1 }}
        />
        {tags.length > 0 && (
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
            {tags.slice(0, 5).map((tag) => (
              <span
                key={tag}
                style={{
                  fontSize: 12,
                  padding: '4px 8px',
                  background: '#f3f4f6',
                  borderRadius: 12,
                  cursor: 'pointer',
                }}
                onClick={() => setSearchQuery(tag)}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Liste des notes */}
      {filteredNotes.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📝</div>
          <h3 style={{ margin: 0, marginBottom: 8 }}>Aucune note</h3>
          <p style={{ color: '#6b7280', margin: 0, marginBottom: 16 }}>
            Commencez à créer des notes pour vos patients
          </p>
          <button className="btn primary" onClick={() => setShowCreateModal(true)}>
            Créer ma première note
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="card"
              style={{ display: 'grid', gap: 12, padding: '16px 20px' }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  {/* Avatar patient */}
                  {note.patient.avatarUrl ? (
                    <img
                      src={note.patient.avatarUrl}
                      alt={note.patient.fullName}
                      style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: '#dbeafe',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        color: '#3b82f6',
                      }}
                    >
                      {note.patient.fullName?.[0]?.toUpperCase() || 'P'}
                    </div>
                  )}
                  <div>
                    <Link
                      href={`/patients/${note.patient.id}`}
                      style={{ fontWeight: 600, color: '#111', textDecoration: 'none' }}
                    >
                      {note.patient.fullName || note.patient.email}
                    </Link>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>
                      {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: 11,
                      padding: '4px 8px',
                      borderRadius: 12,
                      background: `${NOTE_TYPE_COLORS[note.type]}15`,
                      color: NOTE_TYPE_COLORS[note.type],
                      fontWeight: 500,
                    }}
                  >
                    {NOTE_TYPE_LABELS[note.type]}
                  </span>
                  {note.isPrivate && (
                    <span style={{ fontSize: 14 }} title="Note privée">
                      🔒
                    </span>
                  )}
                </div>
              </div>

              {/* Titre et contenu */}
              {note.title && (
                <div style={{ fontWeight: 600, fontSize: 15 }}>{note.title}</div>
              )}
              <div
                style={{
                  fontSize: 14,
                  color: '#374151',
                  lineHeight: 1.6,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {note.content.length > 300
                  ? note.content.slice(0, 300) + '...'
                  : note.content}
              </div>

              {/* Tags */}
              {note.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {note.tags.map((tag) => (
                    <span
                      key={tag}
                      style={{
                        fontSize: 11,
                        padding: '2px 6px',
                        background: '#e5e7eb',
                        borderRadius: 4,
                        color: '#6b7280',
                      }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Lien RDV si applicable */}
              {note.appointment && (
                <div style={{ fontSize: 12, color: '#6b7280' }}>
                  📅 Lié au RDV du{' '}
                  {new Date(note.appointment.slot.start).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button
                  className="btn outline"
                  style={{ fontSize: 12, padding: '6px 12px', color: '#ef4444' }}
                  onClick={() => deleteNote(note.id)}
                >
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de création */}
      {showCreateModal && (
        <CreateNoteModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={(newNote) => {
            setNotes((prev) => [newNote, ...prev]);
            setShowCreateModal(false);
          }}
          apiBase={apiBase}
        />
      )}
    </div>
  );
}

function CreateNoteModal({
  onClose,
  onSuccess,
  apiBase,
}: {
  onClose: () => void;
  onSuccess: (note: MedicalNote) => void;
  apiBase: string;
}) {
  const [patientId, setPatientId] = useState('');
  const [type, setType] = useState('OBSERVATION');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [searchPatient, setSearchPatient] = useState('');
  const [loading, setLoading] = useState(false);

  // Rechercher des patients
  useEffect(() => {
    if (!searchPatient || searchPatient.length < 2) {
      setPatients([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${apiBase}/users/patients/search?q=${encodeURIComponent(searchPatient)}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setPatients(data);
        }
      } catch (error) {
        console.error('Error searching patients:', error);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchPatient, apiBase]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId || !content) {
      alert('Veuillez sélectionner un patient et rédiger la note');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/medical-notes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          patientId,
          type,
          title: title || null,
          content,
          isPrivate,
          tags: tagsInput ? tagsInput.split(',').map((t) => t.trim()).filter(Boolean) : [],
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        onSuccess(newNote);
      } else {
        alert('Erreur lors de la création de la note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      alert('Erreur lors de la création de la note');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 600,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, marginBottom: 20 }}>Nouvelle note médicale</h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          {/* Sélection patient */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Patient *
            </label>
            {selectedPatient ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: 8,
                  background: '#f3f4f6',
                  borderRadius: 8,
                }}
              >
                <span>{selectedPatient.fullName || selectedPatient.email}</span>
                <button
                  type="button"
                  onClick={() => setPatientId('')}
                  style={{
                    marginLeft: 'auto',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  ✕
                </button>
              </div>
            ) : (
              <>
                <input
                  type="text"
                  className="input"
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  placeholder="Rechercher un patient..."
                />
                {patients.length > 0 && (
                  <div
                    style={{
                      marginTop: 4,
                      border: '1px solid #e5e7eb',
                      borderRadius: 8,
                      maxHeight: 150,
                      overflow: 'auto',
                    }}
                  >
                    {patients.map((p) => (
                      <div
                        key={p.id}
                        style={{
                          padding: '8px 12px',
                          cursor: 'pointer',
                          borderBottom: '1px solid #f3f4f6',
                        }}
                        onClick={() => {
                          setPatientId(p.id);
                          setSearchPatient('');
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = '#f3f4f6';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        {p.fullName || p.email}
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Type de note */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Type de note
            </label>
            <select
              className="input"
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {Object.entries(NOTE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Titre */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Titre (optionnel)
            </label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Consultation de suivi"
            />
          </div>

          {/* Contenu */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Contenu *
            </label>
            <textarea
              className="input"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Rédigez votre note..."
              rows={6}
              required
            />
          </div>

          {/* Tags */}
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              className="input"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="diabète, suivi, contrôle"
            />
          </div>

          {/* Privé */}
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <span>Note privée (visible uniquement par moi)</span>
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn outline" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Création...' : 'Créer la note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
