'use client';

import { useState } from 'react';
import { Search, Shield, Lock, LogIn, Settings, Trash2, Key } from 'lucide-react';

const EVENT_ICONS: Record<string, React.ReactNode> = {
  LOGIN: <LogIn className="w-3.5 h-3.5" />,
  LOGOUT: <LogIn className="w-3.5 h-3.5 rotate-180" />,
  PASSWORD_CHANGE: <Key className="w-3.5 h-3.5" />,
  '2FA_ENABLE': <Shield className="w-3.5 h-3.5" />,
  '2FA_DISABLE': <Shield className="w-3.5 h-3.5" />,
  SETTINGS_CHANGE: <Settings className="w-3.5 h-3.5" />,
  ACCOUNT_DELETE: <Trash2 className="w-3.5 h-3.5" />,
};

export default function JournalSecuritePage() {
  const [search, setSearch] = useState('');

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Journal de sécurité</h1>
        <p className="text-sm text-slate-500 mt-0.5">Historique des connexions et actions sensibles de votre compte</p>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2.5 p-4 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-800 mb-5">
        <Shield className="w-4 h-4 mt-0.5 shrink-0 text-blue-400" />
        Ce journal enregistre toutes les actions de sécurité effectuées sur votre compte. Les entrées sont conservées 12 mois.
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Rechercher dans le journal…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[1fr_1.5fr_1fr_100px_90px] text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3 bg-slate-50 border-b border-slate-100">
          <span>Action</span>
          <span>Détails</span>
          <span>Date</span>
          <span>IP</span>
          <span>Appareil</span>
        </div>
        <div className="divide-y divide-slate-100">
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Lock className="w-8 h-8 text-slate-200 mb-3" />
            <p className="text-sm text-slate-500 font-medium">Aucune entrée disponible</p>
            <p className="text-xs text-slate-400 mt-1">Le journal se remplira au fil de l'utilisation de votre compte</p>
          </div>
        </div>
      </div>
    </>
  );
}
