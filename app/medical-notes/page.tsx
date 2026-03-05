'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import { required, minLen, maxLen, hasErrors, type FormErrors } from '@/lib/validation';
import Link from 'next/link';
import {
  ArrowLeft,
  Plus,
  Search,
  FileText,
  Eye,
  EyeOff,
  Trash2,
  User,
  Calendar,
  Tag,
  X,
  Filter,
  Stethoscope,
  ClipboardList,
  Pill,
  Activity,
  MoreHorizontal,
} from 'lucide-react';

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

const NOTE_TYPES = {
  OBSERVATION: {
    label: 'Observation',
    color: 'bg-blue-100 text-blue-700',
    icon: Eye,
    bgColor: 'bg-blue-500',
  },
  FOLLOW_UP: {
    label: 'Suivi',
    color: 'bg-green-100 text-green-700',
    icon: Activity,
    bgColor: 'bg-green-500',
  },
  PRESCRIPTION: {
    label: 'Prescription',
    color: 'bg-purple-100 text-purple-700',
    icon: Pill,
    bgColor: 'bg-purple-500',
  },
  DIAGNOSIS: {
    label: 'Diagnostic',
    color: 'bg-amber-100 text-amber-700',
    icon: Stethoscope,
    bgColor: 'bg-amber-500',
  },
  TREATMENT_PLAN: {
    label: 'Plan de traitement',
    color: 'bg-pink-100 text-pink-700',
    icon: ClipboardList,
    bgColor: 'bg-pink-500',
  },
  OTHER: {
    label: 'Autre',
    color: 'bg-gray-100 text-gray-700',
    icon: FileText,
    bgColor: 'bg-gray-500',
  },
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
  const [selectedNote, setSelectedNote] = useState<MedicalNote | null>(null);
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

  const getInitials = (name?: string) => {
    if (!name) return 'P';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-6 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">Notes Médicales</h1>
            <p className="text-gray-600 text-sm">
              {notes.length} note{notes.length > 1 ? 's' : ''} au total
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 flex items-center gap-2 text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            Nouvelle note
          </button>
        </div>

        {/* Stats par type */}
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          {Object.entries(NOTE_TYPES).map(([type, config]) => {
            const count = notes.filter((n) => n.type === type).length;
            const Icon = config.icon;
            const isSelected = selectedType === type;

            return (
              <button
                key={type}
                onClick={() => setSelectedType(isSelected ? null : type)}
                className={`p-3 rounded-xl text-center transition-all ${
                  isSelected
                    ? 'ring-2 ring-teal-500 bg-white shadow-md'
                    : 'bg-white hover:shadow-md'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg mx-auto mb-2 flex items-center justify-center ${config.bgColor}`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-xl font-bold text-gray-900">{count}</p>
                <p className="text-xs text-gray-500 truncate">{config.label}</p>
              </button>
            );
          })}
        </div>

        {/* Recherche et filtres */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher dans les notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Tags populaires */}
          {tags.length > 0 && (
            <div className="flex gap-2 items-center overflow-x-auto pb-1">
              {tags.slice(0, 5).map((tag) => (
                <button
                  key={tag}
                  onClick={() => setSearchQuery(tag)}
                  className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-full text-xs text-gray-600 whitespace-nowrap transition-colors"
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Filtre actif */}
        {selectedType && (
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm text-gray-500">Filtré par:</span>
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${NOTE_TYPES[selectedType as keyof typeof NOTE_TYPES].color}`}
            >
              {NOTE_TYPES[selectedType as keyof typeof NOTE_TYPES].label}
              <button onClick={() => setSelectedType(null)} className="ml-1">
                <X className="w-3 h-3" />
              </button>
            </span>
          </div>
        )}

        {/* Liste des notes */}
        {filteredNotes.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune note</h3>
            <p className="text-gray-500 mb-4">
              Commencez à créer des notes pour vos patients
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium"
            >
              Créer ma première note
            </button>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredNotes.map((note) => {
              const typeConfig = NOTE_TYPES[note.type as keyof typeof NOTE_TYPES] || NOTE_TYPES.OTHER;
              const TypeIcon = typeConfig.icon;

              return (
                <div
                  key={note.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar patient */}
                      <Link href={`/patients/${note.patient.id}`}>
                        {note.patient.avatarUrl ? (
                          <img
                            src={note.patient.avatarUrl}
                            alt={note.patient.fullName}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold">
                            {getInitials(note.patient.fullName)}
                          </div>
                        )}
                      </Link>
                      <div>
                        <Link
                          href={`/patients/${note.patient.id}`}
                          className="font-medium text-gray-900 hover:text-teal-600"
                        >
                          {note.patient.fullName || note.patient.email}
                        </Link>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Calendar className="w-3 h-3" />
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

                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}
                      >
                        <TypeIcon className="w-3 h-3" />
                        {typeConfig.label}
                      </span>
                      {note.isPrivate && (
                        <span
                          className="p-1 bg-gray-100 rounded-full"
                          title="Note privée"
                        >
                          <EyeOff className="w-3 h-3 text-gray-500" />
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Titre et contenu */}
                  {note.title && (
                    <h3 className="font-semibold text-gray-900 mb-2">{note.title}</h3>
                  )}
                  <p className="text-gray-600 text-sm whitespace-pre-wrap line-clamp-3 mb-3">
                    {note.content}
                  </p>

                  {/* Tags */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {note.tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 rounded text-xs text-gray-600"
                        >
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    {note.appointment && (
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar className="w-3 h-3" />
                        Lié au RDV du{' '}
                        {new Date(note.appointment.slot.start).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                        })}
                      </div>
                    )}
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => setSelectedNote(note)}
                        className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
                        title="Voir"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => deleteNote(note.id)}
                        className="p-2 hover:bg-red-50 rounded-lg text-red-500 transition-colors"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

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

      {/* Modal de détail */}
      {selectedNote && (
        <NoteDetailModal
          note={selectedNote}
          onClose={() => setSelectedNote(null)}
          onDelete={() => {
            deleteNote(selectedNote.id);
            setSelectedNote(null);
          }}
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
  const [fieldErrors, setFieldErrors] = useState<FormErrors<'patientId' | 'content' | 'title'>>({});

  useEffect(() => {
    if (!searchPatient || searchPatient.length < 2) {
      setPatients([]);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${apiBase}/users/patients/search?q=${encodeURIComponent(searchPatient)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
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
    const errors: typeof fieldErrors = {
      patientId: required(patientId, 'Patient'),
      content: required(content, 'Contenu') ?? minLen(content, 10, 'Contenu') ?? maxLen(content, 5000, 'Contenu'),
      title: title ? maxLen(title, 120, 'Titre') : null,
    };
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

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
          tags: tagsInput
            ? tagsInput
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        }),
      });

      if (res.ok) {
        const newNote = await res.json();
        onSuccess(newNote);
      } else {
        toast.error('Erreur lors de la création de la note');
      }
    } catch (error) {
      console.error('Error creating note:', error);
      toast.error('Erreur lors de la création de la note');
    } finally {
      setLoading(false);
    }
  };

  const selectedPatient = patients.find((p) => p.id === patientId);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <h2 className="text-lg font-semibold">Nouvelle note médicale</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Sélection patient */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Patient *
            </label>
            {selectedPatient ? (
              <div className="flex items-center gap-2 p-3 bg-teal-50 border border-teal-200 rounded-lg">
                <User className="w-4 h-4 text-teal-600" />
                <span className="font-medium text-teal-900">
                  {selectedPatient.fullName || selectedPatient.email}
                </span>
                <button
                  type="button"
                  onClick={() => { setPatientId(''); setFieldErrors(fe => ({ ...fe, patientId: null })); }}
                  className="ml-auto p-1 hover:bg-teal-100 rounded"
                >
                  <X className="w-4 h-4 text-teal-600" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchPatient}
                  onChange={(e) => setSearchPatient(e.target.value)}
                  placeholder="Rechercher un patient..."
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${fieldErrors.patientId ? 'border-red-400' : ''}`}
                />
                {patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg max-h-40 overflow-y-auto z-10">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setPatientId(p.id);
                          setSearchPatient('');
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 text-sm"
                      >
                        {p.fullName || p.email}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            {fieldErrors.patientId && <p className="text-xs text-red-500 mt-1">{fieldErrors.patientId}</p>}
          </div>

          {/* Type de note */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type de note
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(NOTE_TYPES).map(([key, config]) => {
                const Icon = config.icon;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setType(key)}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      type === key
                        ? 'border-teal-500 bg-teal-50 ring-1 ring-teal-500'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 mx-auto mb-1 ${type === key ? 'text-teal-600' : 'text-gray-400'}`}
                    />
                    <span className="text-xs">{config.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Titre */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => { setTitle(e.target.value); setFieldErrors(fe => ({ ...fe, title: null })); }}
              placeholder="Ex: Consultation de suivi"
              maxLength={120}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 ${fieldErrors.title ? 'border-red-400' : ''}`}
            />
            {fieldErrors.title && <p className="text-xs text-red-500 mt-1">{fieldErrors.title}</p>}
          </div>

          {/* Contenu */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contenu * <span className="text-gray-400 font-normal">(min. 10 caractères)</span>
            </label>
            <textarea
              value={content}
              onChange={(e) => { setContent(e.target.value); setFieldErrors(fe => ({ ...fe, content: null })); }}
              placeholder="Rédigez votre note..."
              rows={5}
              required
              minLength={10}
              maxLength={5000}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500 resize-none ${fieldErrors.content ? 'border-red-400' : ''}`}
            />
            <div className="flex justify-between items-center mt-1">
              {fieldErrors.content ? <p className="text-xs text-red-500">{fieldErrors.content}</p> : <span />}
              <span className="text-xs text-gray-400">{content.length}/5000</span>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tags (séparés par des virgules)
            </label>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="diabète, suivi, contrôle"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            />
          </div>

          {/* Privé */}
          <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
            />
            <div>
              <div className="flex items-center gap-1 font-medium text-gray-900">
                <EyeOff className="w-4 h-4" />
                Note privée
              </div>
              <p className="text-xs text-gray-500">Visible uniquement par vous</p>
            </div>
          </label>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer la note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function NoteDetailModal({
  note,
  onClose,
  onDelete,
}: {
  note: MedicalNote;
  onClose: () => void;
  onDelete: () => void;
}) {
  const typeConfig = NOTE_TYPES[note.type as keyof typeof NOTE_TYPES] || NOTE_TYPES.OTHER;
  const TypeIcon = typeConfig.icon;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${typeConfig.color}`}
            >
              <TypeIcon className="w-3 h-3" />
              {typeConfig.label}
            </span>
            {note.isPrivate && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                <EyeOff className="w-3 h-3" />
                Privée
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Patient */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-semibold">
              {note.patient.fullName?.[0]?.toUpperCase() || 'P'}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{note.patient.fullName}</p>
              <p className="text-sm text-gray-500">{note.patient.email}</p>
            </div>
          </div>

          {/* Titre */}
          {note.title && (
            <h2 className="text-xl font-semibold text-gray-900">{note.title}</h2>
          )}

          {/* Contenu */}
          <div className="prose prose-sm max-w-none">
            <p className="whitespace-pre-wrap text-gray-700">{note.content}</p>
          </div>

          {/* Tags */}
          {note.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {note.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-600"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Métadonnées */}
          <div className="flex items-center gap-4 text-sm text-gray-500 pt-4 border-t">
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              Créée le{' '}
              {new Date(note.createdAt).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button
              onClick={onDelete}
              className="flex-1 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Supprimer
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Fermer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
