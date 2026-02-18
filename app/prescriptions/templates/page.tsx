'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText,
  Plus,
  Search,
  MoreVertical,
  Edit3,
  Copy,
  Trash2,
  Star,
  StarOff,
  Tag,
  Clock,
  Pill,
  AlertCircle,
  X,
  Check,
  ChevronDown,
  Loader2,
  ArrowLeft,
  Sparkles,
  Save,
  Eye,
  Filter,
} from 'lucide-react';
import { toast } from '@/lib/toast';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

interface PrescriptionTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  medications: Medication[];
  notes?: string;
  isFavorite: boolean;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

const CATEGORIES = [
  { id: 'general', name: 'Médecine générale', color: 'bg-blue-100 text-blue-700' },
  { id: 'cardio', name: 'Cardiologie', color: 'bg-red-100 text-red-700' },
  { id: 'gastro', name: 'Gastro-entérologie', color: 'bg-yellow-100 text-yellow-700' },
  { id: 'neuro', name: 'Neurologie', color: 'bg-purple-100 text-purple-700' },
  { id: 'derma', name: 'Dermatologie', color: 'bg-pink-100 text-pink-700' },
  { id: 'pneumo', name: 'Pneumologie', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'rhuma', name: 'Rhumatologie', color: 'bg-orange-100 text-orange-700' },
  { id: 'other', name: 'Autre', color: 'bg-gray-100 text-gray-700' },
];

const FREQUENCY_OPTIONS = [
  '1 fois par jour',
  '2 fois par jour',
  '3 fois par jour',
  'Matin et soir',
  'Au coucher',
  'Si besoin',
  'Selon prescription',
];

const DURATION_OPTIONS = [
  '3 jours',
  '5 jours',
  '7 jours',
  '10 jours',
  '14 jours',
  '1 mois',
  '3 mois',
  '6 mois',
  'Jusqu\'à amélioration',
  'Traitement continu',
];

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export default function PrescriptionTemplatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<PrescriptionTemplate[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PrescriptionTemplate | null>(null);
  const [showMenuId, setShowMenuId] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState<PrescriptionTemplate | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'general',
    medications: [] as Medication[],
    notes: '',
  });
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: FREQUENCY_OPTIONS[0],
    duration: DURATION_OPTIONS[2],
    instructions: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.replace('/auth/login');
      return;
    }
    loadTemplates();
  }, [router]);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/prescription-templates`, {
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        const mapped = (Array.isArray(data) ? data : []).map((t: any) => ({
          id: t.id,
          name: t.name || '',
          description: t.description || '',
          category: t.category || 'general',
          medications: Array.isArray(t.medications) ? t.medications : [],
          notes: t.notes || '',
          isFavorite: t.isFavorite ?? false,
          usageCount: t.usageCount ?? 0,
          createdAt: t.createdAt || new Date().toISOString(),
          updatedAt: t.updatedAt || new Date().toISOString(),
        }));
        setTemplates(mapped);
      } else {
        setTemplates([]);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMedication = () => {
    if (!newMedication.name || !newMedication.dosage) return;

    const medication: Medication = {
      id: Date.now().toString(),
      ...newMedication,
    };

    setFormData(prev => ({
      ...prev,
      medications: [...prev.medications, medication],
    }));

    setNewMedication({
      name: '',
      dosage: '',
      frequency: FREQUENCY_OPTIONS[0],
      duration: DURATION_OPTIONS[2],
      instructions: '',
    });
  };

  const handleRemoveMedication = (id: string) => {
    setFormData(prev => ({
      ...prev,
      medications: prev.medications.filter(m => m.id !== id),
    }));
  };

  const handleSaveTemplate = async () => {
    if (!formData.name || formData.medications.length === 0) return;

    setSaving(true);
    try {
      const url = editingTemplate
        ? `${API_BASE_URL}/prescription-templates/${editingTemplate.id}`
        : `${API_BASE_URL}/prescription-templates`;
      const method = editingTemplate ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: getAuthHeaders(),
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const saved = await res.json();
        if (editingTemplate) {
          setTemplates(prev => prev.map(t =>
            t.id === editingTemplate.id
              ? { ...t, ...formData, ...saved, updatedAt: saved.updatedAt || new Date().toISOString() }
              : t
          ));
        } else {
          const newTemplate: PrescriptionTemplate = {
            id: saved.id || Date.now().toString(),
            ...formData,
            isFavorite: saved.isFavorite ?? false,
            usageCount: saved.usageCount ?? 0,
            createdAt: saved.createdAt || new Date().toISOString(),
            updatedAt: saved.updatedAt || new Date().toISOString(),
          };
          setTemplates(prev => [newTemplate, ...prev]);
        }
        setShowModal(false);
        setEditingTemplate(null);
        setFormData({ name: '', description: '', category: 'general', medications: [], notes: '' });
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Erreur réseau. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  const handleEditTemplate = (template: PrescriptionTemplate) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      description: template.description || '',
      category: template.category,
      medications: template.medications,
      notes: template.notes || '',
    });
    setShowModal(true);
    setShowMenuId(null);
  };

  const handleDuplicateTemplate = async (template: PrescriptionTemplate) => {
    try {
      const res = await fetch(`${API_BASE_URL}/prescription-templates`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          name: `${template.name} (copie)`,
          description: template.description,
          category: template.category,
          medications: template.medications,
          notes: template.notes,
        }),
      });
      if (res.ok) {
        const saved = await res.json();
        const duplicate: PrescriptionTemplate = {
          ...template,
          id: saved.id || Date.now().toString(),
          name: saved.name || `${template.name} (copie)`,
          usageCount: 0,
          createdAt: saved.createdAt || new Date().toISOString(),
          updatedAt: saved.updatedAt || new Date().toISOString(),
        };
        setTemplates(prev => [duplicate, ...prev]);
      }
    } catch (error) {
      console.error('Error duplicating template:', error);
    }
    setShowMenuId(null);
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) return;

    try {
      await fetch(`${API_BASE_URL}/prescription-templates/${id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
    } catch (error) {
      console.error('Error deleting template:', error);
    }
    setTemplates(prev => prev.filter(t => t.id !== id));
    setShowMenuId(null);
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/prescription-templates/${id}/toggle-favorite`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(prev => prev.map(t =>
          t.id === id ? { ...t, isFavorite: data.isFavorite ?? !t.isFavorite } : t
        ));
        return;
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
    // Optimistic fallback
    setTemplates(prev => prev.map(t =>
      t.id === id ? { ...t, isFavorite: !t.isFavorite } : t
    ));
  };

  const getCategoryInfo = (categoryId: string) => {
    return CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[CATEGORIES.length - 1];
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.medications.some(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = categoryFilter === 'all' || template.category === categoryFilter;
    const matchesFavorite = !showFavoritesOnly || template.isFavorite;
    return matchesSearch && matchesCategory && matchesFavorite;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mx-auto" />
          <p className="mt-3 text-gray-600">Chargement des modèles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.push('/prescriptions')}
            className="p-2 hover:bg-white rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex-1 flex items-center gap-3">
            <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center">
              <FileText className="w-6 h-6 text-teal-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modèles d'ordonnances</h1>
              <p className="text-sm text-gray-500">{templates.length} modèle{templates.length > 1 ? 's' : ''}</p>
            </div>
          </div>

          <button
            onClick={() => {
              setEditingTemplate(null);
              setFormData({
                name: '',
                description: '',
                category: 'general',
                medications: [],
                notes: '',
              });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Nouveau modèle
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un modèle ou médicament..."
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
          >
            <option value="all">Toutes les catégories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>

          <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex items-center gap-2 px-4 py-2.5 border rounded-lg text-sm transition-colors ${
              showFavoritesOnly
                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Star className={`w-4 h-4 ${showFavoritesOnly ? 'fill-current' : ''}`} />
            Favoris
          </button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredTemplates.map((template) => {
            const category = getCategoryInfo(template.category);
            return (
              <div
                key={template.id}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900">{template.name}</h3>
                        {template.isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                      {template.description && (
                        <p className="text-sm text-gray-500 line-clamp-1">{template.description}</p>
                      )}
                    </div>
                    <div className="relative">
                      <button
                        onClick={() => setShowMenuId(showMenuId === template.id ? null : template.id)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      >
                        <MoreVertical className="w-4 h-4 text-gray-500" />
                      </button>

                      {showMenuId === template.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg z-10">
                          <button
                            onClick={() => setShowPreview(template)}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            Aperçu
                          </button>
                          <button
                            onClick={() => handleEditTemplate(template)}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Edit3 className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDuplicateTemplate(template)}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            <Copy className="w-4 h-4" />
                            Dupliquer
                          </button>
                          <button
                            onClick={() => handleToggleFavorite(template.id)}
                            className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                          >
                            {template.isFavorite ? (
                              <>
                                <StarOff className="w-4 h-4" />
                                Retirer des favoris
                              </>
                            ) : (
                              <>
                                <Star className="w-4 h-4" />
                                Ajouter aux favoris
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleDeleteTemplate(template.id)}
                            className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${category.color}`}>
                      {category.name}
                    </span>
                    <span className="text-xs text-gray-500 flex items-center gap-1">
                      <Pill className="w-3 h-3" />
                      {template.medications.length} médicament{template.medications.length > 1 ? 's' : ''}
                    </span>
                  </div>

                  <div className="space-y-2">
                    {template.medications.slice(0, 2).map((med) => (
                      <div key={med.id} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 bg-teal-500 rounded-full" />
                        <span className="font-medium text-gray-900">{med.name}</span>
                        <span className="text-gray-500">{med.dosage}</span>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-500">{med.frequency}</span>
                      </div>
                    ))}
                    {template.medications.length > 2 && (
                      <p className="text-xs text-gray-400 pl-3">
                        +{template.medications.length - 2} autre{template.medications.length - 2 > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Utilisé {template.usageCount} fois
                  </span>
                  <button
                    onClick={() => router.push(`/prescriptions/new?templateId=${template.id}` as any)}
                    className="text-teal-600 font-medium hover:text-teal-700 transition-colors"
                  >
                    Utiliser ce modèle →
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTemplates.length === 0 && (
            <div className="col-span-full py-16 text-center">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Aucun modèle trouvé</h3>
              <p className="text-gray-500 mb-4">
                {searchQuery || categoryFilter !== 'all'
                  ? 'Essayez de modifier vos filtres'
                  : 'Créez votre premier modèle d\'ordonnance'}
              </p>
              {!searchQuery && categoryFilter === 'all' && (
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Créer un modèle
                </button>
              )}
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white p-6 border-b border-gray-100 z-10">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {editingTemplate ? 'Modifier le modèle' : 'Nouveau modèle'}
                  </h2>
                  <button
                    onClick={() => {
                      setShowModal(false);
                      setEditingTemplate(null);
                    }}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Nom du modèle *
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Ex: Infection respiratoire standard"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description
                    </label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Brève description du cas d'usage"
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Catégorie
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Medications */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Médicaments *
                  </label>

                  {/* Existing medications */}
                  {formData.medications.length > 0 && (
                    <div className="space-y-2 mb-4">
                      {formData.medications.map((med) => (
                        <div
                          key={med.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                        >
                          <Pill className="w-4 h-4 text-teal-600" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {med.name} - {med.dosage}
                            </p>
                            <p className="text-xs text-gray-500">
                              {med.frequency} • {med.duration}
                              {med.instructions && ` • ${med.instructions}`}
                            </p>
                          </div>
                          <button
                            onClick={() => handleRemoveMedication(med.id)}
                            className="p-1.5 hover:bg-red-100 rounded transition-colors"
                          >
                            <X className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add new medication */}
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        type="text"
                        value={newMedication.name}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Nom du médicament"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                      <input
                        type="text"
                        value={newMedication.dosage}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, dosage: e.target.value }))}
                        placeholder="Dosage (ex: 500mg)"
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <select
                        value={newMedication.frequency}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, frequency: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      >
                        {FREQUENCY_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                      <select
                        value={newMedication.duration}
                        onChange={(e) => setNewMedication(prev => ({ ...prev, duration: e.target.value }))}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 bg-white"
                      >
                        {DURATION_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    </div>
                    <input
                      type="text"
                      value={newMedication.instructions}
                      onChange={(e) => setNewMedication(prev => ({ ...prev, instructions: e.target.value }))}
                      placeholder="Instructions supplémentaires (optionnel)"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                    />
                    <button
                      onClick={handleAddMedication}
                      disabled={!newMedication.name || !newMedication.dosage}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-teal-500 hover:text-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter ce médicament
                    </button>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Notes / Instructions
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notes complémentaires, conseils, suivi..."
                    rows={3}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 resize-none"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => {
                    setShowModal(false);
                    setEditingTemplate(null);
                  }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSaveTemplate}
                  disabled={!formData.name || formData.medications.length === 0 || saving}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Enregistrement...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingTemplate ? 'Mettre à jour' : 'Créer le modèle'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {showPreview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Aperçu du modèle</h2>
                  <button
                    onClick={() => setShowPreview(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                <div className="mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{showPreview.name}</h3>
                  {showPreview.description && (
                    <p className="text-sm text-gray-500 mt-1">{showPreview.description}</p>
                  )}
                </div>

                <div className="mb-4">
                  <span className={`text-xs px-2 py-1 rounded-full ${getCategoryInfo(showPreview.category).color}`}>
                    {getCategoryInfo(showPreview.category).name}
                  </span>
                </div>

                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="font-medium text-gray-900 mb-3">Prescription</h4>
                  <div className="space-y-3">
                    {showPreview.medications.map((med, idx) => (
                      <div key={med.id} className="text-sm">
                        <p className="font-medium text-gray-900">
                          {idx + 1}. {med.name} {med.dosage}
                        </p>
                        <p className="text-gray-600 ml-4">
                          {med.frequency}, pendant {med.duration}
                        </p>
                        {med.instructions && (
                          <p className="text-gray-500 ml-4 italic">→ {med.instructions}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {showPreview.notes && (
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Notes</h4>
                    <p className="text-sm text-blue-800">{showPreview.notes}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-100 flex gap-3">
                <button
                  onClick={() => setShowPreview(null)}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Fermer
                </button>
                <button
                  onClick={() => {
                    router.push(`/prescriptions/new?templateId=${showPreview.id}` as any);
                  }}
                  className="flex-1 px-4 py-2.5 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-700 transition-colors"
                >
                  Utiliser ce modèle
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
