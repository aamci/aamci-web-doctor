'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../_providers/AuthProvider';
import {
  FileQuestion, Plus, Trash2, Edit2, Check, X, ChevronDown, ChevronUp,
  Loader2, AlertTriangle, Link2, Unlink,
} from 'lucide-react';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

type QuestionType = 'TEXT' | 'TEXTAREA' | 'YES_NO' | 'SCALE' | 'MULTIPLE_CHOICE';

type Question = {
  id: string;
  text: string;
  type: QuestionType;
  options?: string | null;
  required: boolean;
  order: number;
};

type Questionnaire = {
  id: string;
  title: string;
  description?: string | null;
  isActive: boolean;
  questions: Question[];
};

type Kind = {
  id: string;
  name: string;
  durationMins: number;
  questionnaireId?: string | null;
};

const QUESTION_TYPES: { value: QuestionType; label: string }[] = [
  { value: 'TEXT', label: 'Texte court' },
  { value: 'TEXTAREA', label: 'Texte long' },
  { value: 'YES_NO', label: 'Oui / Non' },
  { value: 'SCALE', label: 'Échelle 1-10' },
  { value: 'MULTIPLE_CHOICE', label: 'Choix multiple' },
];

function authed(path: string, init?: RequestInit) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : '';
  return fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  });
}

export default function QuestionnairesPage() {
  const { user } = useAuth();
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [kinds, setKinds] = useState<Kind[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  // New questionnaire form
  const [showNew, setShowNew] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [creating, setCreating] = useState(false);

  // New question form (per questionnaire)
  const [addingQuestionTo, setAddingQuestionTo] = useState<string | null>(null);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<QuestionType>('TEXT');
  const [qRequired, setQRequired] = useState(false);
  const [qOptions, setQOptions] = useState('');
  const [qSaving, setQSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [qRes, kRes] = await Promise.all([
        authed('/questionnaires/mine'),
        authed('/appointment-kinds'),
      ]);
      const [qs, ks] = await Promise.all([qRes.json(), kRes.json()]);
      setQuestionnaires(Array.isArray(qs) ? qs : []);
      setKinds(Array.isArray(ks) ? ks : []);
    } catch { /* silent */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function createQuestionnaire() {
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const r = await authed('/questionnaires', {
        method: 'POST',
        body: JSON.stringify({ title: newTitle, description: newDesc || undefined }),
      });
      const q = await r.json();
      setQuestionnaires(prev => [q, ...prev]);
      setNewTitle(''); setNewDesc(''); setShowNew(false);
    } catch { /* silent */ } finally {
      setCreating(false);
    }
  }

  async function deleteQuestionnaire(id: string) {
    if (!confirm('Supprimer ce questionnaire ?')) return;
    await authed(`/questionnaires/${id}`, { method: 'DELETE' });
    setQuestionnaires(prev => prev.filter(q => q.id !== id));
  }

  async function toggleActive(q: Questionnaire) {
    const r = await authed(`/questionnaires/${q.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive: !q.isActive }),
    });
    const updated = await r.json();
    setQuestionnaires(prev => prev.map(x => x.id === q.id ? updated : x));
  }

  async function addQuestion(questionnaireId: string) {
    if (!qText.trim()) return;
    setQSaving(true);
    try {
      const options = qType === 'MULTIPLE_CHOICE'
        ? qOptions.split('\n').map(s => s.trim()).filter(Boolean)
        : undefined;
      const r = await authed(`/questionnaires/${questionnaireId}/questions`, {
        method: 'POST',
        body: JSON.stringify({ text: qText, type: qType, required: qRequired, options }),
      });
      const newQ = await r.json();
      setQuestionnaires(prev => prev.map(q =>
        q.id === questionnaireId ? { ...q, questions: [...q.questions, newQ] } : q
      ));
      setQText(''); setQType('TEXT'); setQRequired(false); setQOptions('');
      setAddingQuestionTo(null);
    } catch { /* silent */ } finally {
      setQSaving(false);
    }
  }

  async function deleteQuestion(questionnaireId: string, questionId: string) {
    await authed(`/questionnaires/questions/${questionId}`, { method: 'DELETE' });
    setQuestionnaires(prev => prev.map(q =>
      q.id === questionnaireId
        ? { ...q, questions: q.questions.filter(x => x.id !== questionId) }
        : q
    ));
  }

  async function linkKind(questionnaireId: string, kindId: string) {
    await authed(`/questionnaires/${questionnaireId}/link-kind/${kindId}`, { method: 'POST' });
    setKinds(prev => prev.map(k => k.id === kindId ? { ...k, questionnaireId } : k));
  }

  async function unlinkKind(kindId: string) {
    await authed(`/questionnaires/unlink-kind/${kindId}`, { method: 'POST' });
    setKinds(prev => prev.map(k => k.id === kindId ? { ...k, questionnaireId: null } : k));
  }

  if (!user || user.role !== 'DOCTOR') return null;

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="pl-20">
        <div className="max-w-4xl mx-auto px-6 py-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <FileQuestion className="w-6 h-6 text-teal-400" />
                Questionnaires pré-RDV
              </h1>
              <p className="text-slate-400 mt-1 text-sm">
                Les patients rempliront ces formulaires après la prise de rendez-vous.
              </p>
            </div>
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium text-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              Nouveau questionnaire
            </button>
          </div>

          {/* New questionnaire form */}
          {showNew && (
            <div className="bg-slate-800 rounded-2xl border border-slate-700 p-5 mb-6">
              <h3 className="text-white font-medium mb-4">Nouveau questionnaire</h3>
              <div className="space-y-3">
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Titre du questionnaire *"
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                />
                <textarea
                  value={newDesc}
                  onChange={e => setNewDesc(e.target.value)}
                  placeholder="Description (optionnelle)"
                  rows={2}
                  className="w-full px-4 py-2.5 bg-slate-700 border border-slate-600 rounded-xl text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                />
                <div className="flex gap-2 justify-end">
                  <button onClick={() => setShowNew(false)} className="px-4 py-2 text-slate-400 hover:text-white text-sm transition-colors">
                    Annuler
                  </button>
                  <button
                    onClick={createQuestionnaire}
                    disabled={creating || !newTitle.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-xl disabled:opacity-50 transition-colors"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                    Créer
                  </button>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-sm">Chargement…</span>
            </div>
          ) : questionnaires.length === 0 ? (
            <div className="text-center py-16">
              <FileQuestion className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 font-medium">Aucun questionnaire</p>
              <p className="text-sm text-slate-500 mt-1">Créez votre premier questionnaire pour vos patients.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {questionnaires.map(q => (
                <div key={q.id} className="bg-slate-800 rounded-2xl border border-slate-700">
                  {/* Questionnaire header */}
                  <div className="p-5 flex items-center gap-4">
                    <button
                      onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="text-white font-medium">{q.title}</p>
                          {q.description && <p className="text-slate-400 text-xs mt-0.5">{q.description}</p>}
                        </div>
                        <span className={`ml-auto px-2.5 py-0.5 text-xs rounded-full font-medium ${
                          q.isActive
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-slate-700 text-slate-500 border border-slate-600'
                        }`}>
                          {q.isActive ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="text-slate-500 text-xs">{q.questions.length} question{q.questions.length !== 1 ? 's' : ''}</span>
                      </div>
                    </button>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        onClick={() => toggleActive(q)}
                        title={q.isActive ? 'Désactiver' : 'Activer'}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        {q.isActive ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => deleteQuestionnaire(q.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setExpanded(expanded === q.id ? null : q.id)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                      >
                        {expanded === q.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded content */}
                  {expanded === q.id && (
                    <div className="border-t border-slate-700 p-5 space-y-4">

                      {/* Link to appointment kind */}
                      <div className="bg-slate-700/30 rounded-xl p-4">
                        <p className="text-sm text-slate-400 mb-3 font-medium">Lier à un type de consultation</p>
                        <div className="flex flex-wrap gap-2">
                          {kinds.filter(k => k.questionnaireId === q.id).map(k => (
                            <div key={k.id} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600/10 text-teal-400 border border-teal-500/20 rounded-lg text-sm">
                              {k.name}
                              <button onClick={() => unlinkKind(k.id)} className="hover:text-rose-400 ml-1">
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {kinds.filter(k => !k.questionnaireId).length > 0 && (
                            <select
                              onChange={e => { if (e.target.value) linkKind(q.id, e.target.value); e.target.value = ''; }}
                              className="px-3 py-1.5 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 text-sm focus:outline-none focus:border-teal-500"
                              defaultValue=""
                            >
                              <option value="">Ajouter un type…</option>
                              {kinds.filter(k => !k.questionnaireId).map(k => (
                                <option key={k.id} value={k.id}>{k.name}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </div>

                      {/* Questions list */}
                      <div>
                        <p className="text-sm text-slate-400 mb-3 font-medium">Questions</p>
                        <div className="space-y-2">
                          {q.questions.length === 0 ? (
                            <p className="text-slate-500 text-sm">Aucune question — ajoutez-en ci-dessous.</p>
                          ) : (
                            q.questions.map((question, idx) => (
                              <div key={question.id} className="flex items-start gap-3 p-3 bg-slate-700/40 rounded-xl">
                                <span className="text-slate-500 text-xs mt-0.5 w-5 text-center">{idx + 1}</span>
                                <div className="flex-1 min-w-0">
                                  <p className="text-white text-sm">{question.text}</p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-xs text-slate-500">
                                      {QUESTION_TYPES.find(t => t.value === question.type)?.label ?? question.type}
                                    </span>
                                    {question.required && (
                                      <span className="text-xs text-rose-400">obligatoire</span>
                                    )}
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteQuestion(q.id, question.id)}
                                  className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors flex-shrink-0"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add question form */}
                        {addingQuestionTo === q.id ? (
                          <div className="mt-3 bg-slate-700/30 rounded-xl p-4 space-y-3">
                            <input
                              value={qText}
                              onChange={e => setQText(e.target.value)}
                              placeholder="Texte de la question *"
                              className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
                            />
                            <div className="flex gap-3">
                              <select
                                value={qType}
                                onChange={e => setQType(e.target.value as QuestionType)}
                                className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm focus:outline-none"
                              >
                                {QUESTION_TYPES.map(t => (
                                  <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                              </select>
                              <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={qRequired}
                                  onChange={e => setQRequired(e.target.checked)}
                                  className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-600"
                                />
                                Obligatoire
                              </label>
                            </div>
                            {qType === 'MULTIPLE_CHOICE' && (
                              <textarea
                                value={qOptions}
                                onChange={e => setQOptions(e.target.value)}
                                placeholder="Une option par ligne"
                                rows={3}
                                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500 resize-none"
                              />
                            )}
                            <div className="flex gap-2 justify-end">
                              <button
                                onClick={() => { setAddingQuestionTo(null); setQText(''); setQType('TEXT'); setQRequired(false); setQOptions(''); }}
                                className="px-3 py-1.5 text-slate-400 hover:text-white text-sm transition-colors"
                              >
                                Annuler
                              </button>
                              <button
                                onClick={() => addQuestion(q.id)}
                                disabled={qSaving || !qText.trim()}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-sm rounded-lg disabled:opacity-50 transition-colors"
                              >
                                {qSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                                Ajouter
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => { setAddingQuestionTo(q.id); setQText(''); setQType('TEXT'); setQRequired(false); setQOptions(''); }}
                            className="mt-2 flex items-center gap-1.5 text-sm text-teal-400 hover:text-teal-300 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Ajouter une question
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
