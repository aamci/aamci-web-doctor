'use client';

import { useState } from 'react';
import { X, Flag, ShieldOff, AlertTriangle, Loader2, Check } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

const REPORT_REASONS = [
  { value: 'INAPPROPRIATE_CONTENT',  label: 'Contenu inapproprié' },
  { value: 'HARASSMENT',             label: 'Harcèlement ou comportement abusif' },
  { value: 'SPAM',                   label: 'Spam ou publicité non sollicitée' },
  { value: 'FAKE_PROFILE',           label: 'Faux profil ou usurpation d\'identité' },
  { value: 'UNPROFESSIONAL_CONDUCT', label: 'Comportement non professionnel' },
  { value: 'OTHER',                  label: 'Autre' },
];

interface Props {
  targetId: string;
  targetName: string;
  conversationId?: string;
  token: string;
  isBlocked: boolean;
  onBlock: () => void;
  onUnblock: () => void;
  onClose: () => void;
}

export default function ReportBlockModal({
  targetId, targetName, conversationId, token,
  isBlocked, onBlock, onUnblock, onClose,
}: Props) {
  const [view, setView] = useState<'menu' | 'report' | 'confirm'>('menu');
  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  async function submitReport() {
    if (!reason) return;
    setLoading(true);
    try {
      await fetch(`${API}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          targetId,
          type: conversationId ? 'CONVERSATION' : 'USER',
          reason,
          details: details || undefined,
          conversationId,
        }),
      });
      setView('confirm');
      setDone('report');
    } finally {
      setLoading(false);
    }
  }

  async function toggleBlock() {
    setLoading(true);
    try {
      if (isBlocked) {
        await fetch(`${API}/blocks/${targetId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
        onUnblock();
      } else {
        await fetch(`${API}/blocks/${targetId}`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        });
        onBlock();
      }
      setDone('block');
      setView('confirm');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-sm shadow-xl">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">
            {view === 'menu'    && targetName}
            {view === 'report'  && 'Signaler'}
            {view === 'confirm' && 'Confirmation'}
          </span>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-4">
          {view === 'menu' && (
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setView('report')}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/20 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-orange-100 dark:bg-orange-900/40 flex items-center justify-center">
                  <Flag className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white text-sm">Signaler</p>
                  <p className="text-xs text-gray-500">Signaler un comportement inapproprié</p>
                </div>
              </button>

              <button
                onClick={toggleBlock}
                disabled={loading}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center">
                  {loading ? <Loader2 className="w-4 h-4 text-red-600 animate-spin" /> : <ShieldOff className="w-4 h-4 text-red-600" />}
                </div>
                <div>
                  <p className="font-medium text-red-600 text-sm">
                    {isBlocked ? 'Débloquer' : 'Bloquer'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {isBlocked
                      ? 'Rétablir la communication'
                      : 'Ne plus recevoir de messages de cette personne'}
                  </p>
                </div>
              </button>
            </div>
          )}

          {view === 'report' && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Votre signalement sera examiné par notre équipe.
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Motif *</label>
                <select
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Choisir un motif</option>
                  {REPORT_REASONS.map(r => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Détails (optionnel)</label>
                <textarea
                  value={details}
                  onChange={e => setDetails(e.target.value)}
                  rows={3}
                  placeholder="Décrivez le problème..."
                  className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={() => setView('menu')}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Annuler
                </button>
                <button
                  onClick={submitReport}
                  disabled={!reason || loading}
                  className="flex-1 py-2.5 rounded-xl bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                  Envoyer
                </button>
              </div>
            </div>
          )}

          {view === 'confirm' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center">
                <Check className="w-7 h-7 text-green-600" />
              </div>
              <p className="font-semibold text-gray-900 dark:text-white text-center">
                {done === 'report'
                  ? 'Signalement envoyé'
                  : isBlocked
                    ? 'Utilisateur bloqué'
                    : 'Utilisateur débloqué'}
              </p>
              <p className="text-sm text-gray-500 text-center">
                {done === 'report'
                  ? 'Notre équipe va examiner votre signalement dans les plus brefs délais.'
                  : isBlocked
                    ? 'Vous ne recevrez plus de messages de cette personne.'
                    : 'La communication est rétablie.'}
              </p>
              <button
                onClick={onClose}
                className="mt-1 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
