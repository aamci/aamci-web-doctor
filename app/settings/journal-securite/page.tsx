'use client';

import { useState } from 'react';
import { Search, Shield, Monitor } from 'lucide-react';

interface LogEntry {
  id: number;
  action: string;
  details: string;
  user: string;
  date: string;
  ip: string;
  icon: 'shield' | 'monitor';
  color: 'green' | 'red' | 'blue' | 'orange';
}

const MOCK_LOGS: LogEntry[] = [
  { id: 1, action: 'Connexion', details: 'Connexion réussie', user: 'Dr Sophie Ma...', date: '18 févr. 2026 08:30', ip: '192.168.1.42', icon: 'shield', color: 'green' },
  { id: 2, action: 'Modification profil', details: 'Mise à jour des informations personnelles', user: 'Dr Sophie Ma...', date: '17 févr. 2026 14:15', ip: '192.168.1.42', icon: 'shield', color: 'blue' },
  { id: 3, action: 'Connexion', details: 'Échec de connexion — mot de passe incorrect', user: 'Dr Sophie Ma...', date: '16 févr. 2026 09:45', ip: '88.123.45.67', icon: 'shield', color: 'red' },
  { id: 4, action: 'Changement mot de passe', details: 'Mot de passe modifié avec succès', user: 'Dr Sophie Ma...', date: '15 févr. 2026 11:00', ip: '192.168.1.42', icon: 'shield', color: 'green' },
  { id: 5, action: 'Export de données', details: 'Export des données patients demandé', user: 'Dr Sophie Ma...', date: '14 févr. 2026 16:30', ip: '192.168.1.42', icon: 'monitor', color: 'orange' },
  { id: 6, action: 'Connexion', details: 'Connexion réussie', user: 'Secrétaire M...', date: '14 févr. 2026 08:00', ip: '192.168.1.55', icon: 'shield', color: 'green' },
  { id: 7, action: 'Double authentification', details: 'Activation de la double authentification', user: 'Dr Sophie Ma...', date: '13 févr. 2026 10:20', ip: '192.168.1.42', icon: 'shield', color: 'green' },
  { id: 8, action: 'Accès dossier patient', details: 'Consultation du dossier #PAT-00123', user: 'Dr Sophie Ma...', date: '12 févr. 2026 15:45', ip: '192.168.1.42', icon: 'monitor', color: 'blue' },
  { id: 9, action: 'Déconnexion', details: 'Déconnexion manuelle', user: 'Dr Sophie Ma...', date: '11 févr. 2026 18:05', ip: '192.168.1.42', icon: 'shield', color: 'green' },
  { id: 10, action: 'Connexion', details: 'Connexion depuis un nouvel appareil', user: 'Dr Sophie Ma...', date: '10 févr. 2026 07:55', ip: '10.0.0.12', icon: 'monitor', color: 'orange' },
];

const COLOR_CLASSES = {
  green: 'bg-green-100 text-green-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
  orange: 'bg-orange-100 text-orange-700',
};

export default function JournalSecuritePage() {
  const [search, setSearch] = useState('');

  const filtered = MOCK_LOGS.filter(
    (log) =>
      log.action.toLowerCase().includes(search.toLowerCase()) ||
      log.details.toLowerCase().includes(search.toLowerCase()) ||
      log.user.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Journal de sécurité</h1>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 mb-6 text-sm text-blue-800">
        <Shield className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
        <p>
          Ce journal enregistre toutes les actions de sécurité effectuées sur votre compte et ceux
          de votre établissement.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher dans le journal..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="text-left px-4 py-3 font-medium text-gray-600">Action</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Détails</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Utilisateur</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">Date</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">IP</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-400">
                  Aucun résultat
                </td>
              </tr>
            ) : (
              filtered.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${COLOR_CLASSES[log.color]}`}
                    >
                      {log.icon === 'shield' ? (
                        <Shield className="w-3 h-3" />
                      ) : (
                        <Monitor className="w-3 h-3" />
                      )}
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{log.details}</td>
                  <td className="px-4 py-3 text-gray-600">{log.user}</td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{log.date}</td>
                  <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.ip}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-400 mt-3">
        Les journaux sont conservés pendant 12 mois.
      </p>
    </div>
  );
}
