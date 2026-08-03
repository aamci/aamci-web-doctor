'use client';

import { useState, useEffect } from 'react';
import { required, minLen, maxLen, positiveNumber, hasErrors, type FormErrors } from '@/lib/validation';
import { Plus, Edit, Trash2, Video, Clock, Check, X, Stethoscope, Loader2 } from 'lucide-react';
import { useAuth } from '../../_providers/AuthProvider';

interface AppointmentKind {
  id: string;
  name: string;
  description: string | null;
  isTelemedicine: boolean;
  durationMins: number;
  color: string | null;
  doctorId: string | null;
  requiresPrePayment: boolean;
  price: number | null;
}

const PRESET_COLORS = [
  '#3b82f6', '#8b5cf6', '#ec4899', '#f97316',
  '#10b981', '#06b6d4', '#f59e0b', '#ef4444',
];

const INPUT = 'w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors';
const INPUT_ERR = 'border-red-400 focus:ring-red-400';

function getApiBase(): string {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return 'http://localhost:3000';
  try { new URL(b); return b; } catch { return 'http://localhost:3000'; }
}

export default function ConsultationTypesPage() {
  const { user } = useAuth();
  const [kinds, setKinds] = useState<AppointmentKind[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKind, setEditingKind] = useState<AppointmentKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FormErrors<'name' | 'description' | 'durationMins'>>({});
  const apiBase = getApiBase();

  const [formData, setFormData] = useState({
    name: '', description: '', isTelemedicine: false, durationMins: 30, color: PRESET_COLORS[0],
    requiresPrePayment: false, price: '' as string,
  });

  const authedFetch = (path: string, init?: RequestInit) => {
    const token = localStorage.getItem('token');
    return fetch(`${apiBase}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...init?.headers },
    });
  };

  const fetchKinds = async () => {
    try {
      const res = await authedFetch('/appointment-kinds');
      if (res.ok) setKinds(await res.json());
    } catch { /* ignore */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchKinds(); }, []);

  const openCreate = () => {
    setEditingKind(null);
    setFieldErrors({});
    setFormData({ name: '', description: '', isTelemedicine: false, durationMins: 30, color: PRESET_COLORS[0], requiresPrePayment: false, price: '' });
    setIsModalOpen(true);
  };

  const openEdit = (kind: AppointmentKind) => {
    setEditingKind(kind);
    setFieldErrors({});
    setFormData({
      name: kind.name, description: kind.description || '', isTelemedicine: kind.isTelemedicine,
      durationMins: kind.durationMins, color: kind.color || PRESET_COLORS[0],
      requiresPrePayment: kind.requiresPrePayment ?? false,
      price: kind.price != null ? String(kind.price) : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof fieldErrors = {
      name: required(formData.name, 'Nom') ?? minLen(formData.name, 2, 'Nom') ?? maxLen(formData.name, 100, 'Nom'),
      description: formData.description ? maxLen(formData.description, 300, 'Description') : null,
      durationMins: positiveNumber(formData.durationMins, 'Durée'),
    };
    setFieldErrors(errors);
    if (hasErrors(errors)) return;
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        price: formData.price !== '' ? Number(formData.price) : null,
      };
      if (editingKind) {
        await authedFetch(`/appointment-kinds/${editingKind.id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      } else {
        await authedFetch('/appointment-kinds', { method: 'POST', body: JSON.stringify(payload) });
      }
      setIsModalOpen(false);
      fetchKinds();
    } catch { /* ignore */ } finally { setSubmitting(false); }
  };

  const handleDelete = async (kindId: string) => {
    if (!confirm('Supprimer ce type de consultation ?')) return;
    await authedFetch(`/appointment-kinds/${kindId}`, { method: 'DELETE' });
    fetchKinds();
  };

  const globalKinds = kinds.filter((k) => !k.doctorId);
  const personalKinds = kinds.filter((k) => k.doctorId);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-6 h-6 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <>
      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Types de consultation</h1>
          <p className="text-sm text-slate-500 mt-0.5">Gérez vos types de rendez-vous et téléconsultations</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nouveau type
        </button>
      </div>

      {/* Personal types */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
        <div className="px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-800">Mes types</h2>
          <p className="text-xs text-slate-400 mt-0.5">Personnalisés pour votre pratique</p>
        </div>

        {personalKinds.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <Stethoscope className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-500">Aucun type personnalisé</p>
            <button onClick={openCreate} className="mt-2 text-sm text-teal-600 hover:text-teal-700 font-medium">
              + Créer votre premier type
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {personalKinds.map((kind) => (
              <div key={kind.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors group">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: kind.color || '#3b82f6' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-800">{kind.name}</span>
                    {kind.isTelemedicine && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                        <Video className="w-3 h-3" /> Visio
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{kind.durationMins} min</span>
                    {kind.price != null && (
                      <span className="text-amber-600 font-medium">{Number(kind.price).toLocaleString('fr-FR')} FCFA</span>
                    )}
                    {kind.description && <span className="truncate">{kind.description}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(kind)} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                    <Edit className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(kind.id)} className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Global types */}
      {globalKinds.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Types standards</h2>
            <p className="text-xs text-slate-400 mt-0.5">Disponibles pour tous les praticiens</p>
          </div>
          <div className="divide-y divide-slate-100">
            {globalKinds.map((kind) => (
              <div key={kind.id} className="flex items-center gap-4 px-5 py-3.5">
                <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: kind.color || '#94a3b8' }} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-slate-700">{kind.name}</span>
                    {kind.isTelemedicine && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 text-violet-700 rounded-full text-xs font-medium">
                        <Video className="w-3 h-3" /> Visio
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                    <Clock className="w-3 h-3" />{kind.durationMins} min
                  </span>
                </div>
                <span className="text-xs text-slate-300 font-medium">Standard</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="text-base font-semibold text-slate-900">
                {editingKind ? 'Modifier le type' : 'Nouveau type de consultation'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Nom *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => { setFormData({ ...formData, name: e.target.value }); setFieldErrors(fe => ({ ...fe, name: null })); }}
                  className={`${INPUT} ${fieldErrors.name ? INPUT_ERR : ''}`}
                  placeholder="Ex: Consultation de suivi"
                />
                {fieldErrors.name && <p className="text-xs text-red-500 mt-1">{fieldErrors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => { setFormData({ ...formData, description: e.target.value }); setFieldErrors(fe => ({ ...fe, description: null })); }}
                  rows={2}
                  maxLength={300}
                  className={`${INPUT} resize-none ${fieldErrors.description ? INPUT_ERR : ''}`}
                  placeholder="Description optionnelle..."
                />
                {fieldErrors.description && <p className="text-xs text-red-500 mt-1">{fieldErrors.description}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Durée</label>
                <select
                  value={formData.durationMins}
                  onChange={(e) => setFormData({ ...formData, durationMins: parseInt(e.target.value) })}
                  className={INPUT}
                >
                  {[15, 20, 30, 45, 60, 90].map(m => (
                    <option key={m} value={m}>{m < 60 ? `${m} min` : m === 60 ? '1 heure' : '1h30'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Couleur</label>
                <div className="flex gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
                        formData.color === color ? 'ring-2 ring-offset-2 ring-slate-400 scale-110' : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                    >
                      {formData.color === color && <Check className="w-3.5 h-3.5 text-white" />}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center gap-3 p-3.5 bg-violet-50 border border-violet-100 rounded-xl cursor-pointer hover:bg-violet-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isTelemedicine}
                  onChange={(e) => setFormData({ ...formData, isTelemedicine: e.target.checked })}
                  className="w-4 h-4 text-violet-600 border-slate-300 rounded focus:ring-violet-500"
                />
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-medium text-violet-900">
                    <Video className="w-4 h-4" /> Téléconsultation
                  </div>
                  <p className="text-xs text-violet-600 mt-0.5">Permet de démarrer une visioconférence</p>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 bg-amber-50 border border-amber-100 rounded-xl cursor-pointer hover:bg-amber-100/60 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.requiresPrePayment}
                  onChange={(e) => setFormData({ ...formData, requiresPrePayment: e.target.checked })}
                  className="w-4 h-4 text-amber-600 border-slate-300 rounded focus:ring-amber-500"
                />
                <div>
                  <div className="text-sm font-medium text-amber-900">Pré-paiement obligatoire</div>
                  <p className="text-xs text-amber-600 mt-0.5">Le patient paye en ligne lors de la réservation</p>
                </div>
              </label>

              {formData.requiresPrePayment && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">Prix (FCFA) *</label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className={INPUT}
                    placeholder="Ex: 15000"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors font-medium">
                  Annuler
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 text-sm bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-60">
                  {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingKind ? 'Enregistrer' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
