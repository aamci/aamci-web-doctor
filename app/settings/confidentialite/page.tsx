'use client';

import { useState } from 'react';
import { Check, HelpCircle } from 'lucide-react';
import { toast } from '@/lib/toast';

const TABS = ['Données', 'Droits et accès', 'Communications marketing'] as const;
type Tab = (typeof TABS)[number];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${
        checked ? 'bg-teal-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
          checked ? 'translate-x-4' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`px-3 py-0.5 rounded text-xs font-semibold ${
        active ? 'bg-teal-100 text-teal-700' : 'bg-gray-100 text-gray-500'
      }`}
    >
      {active ? 'Actif' : 'Inactif'}
    </span>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-block ml-1">
      <HelpCircle className="w-3.5 h-3.5 text-gray-400 inline cursor-help" />
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1 hidden group-hover:block w-56 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 z-50 pointer-events-none">
        {text}
      </span>
    </span>
  );
}

export default function ConfidentialitePage() {
  const [activeTab, setActiveTab] = useState<Tab>('Données');

  // Données tab state
  const [googleBusiness, setGoogleBusiness] = useState(true);
  const [thirdPartyAds, setThirdPartyAds] = useState(false);
  const [retentionPeriod, setRetentionPeriod] = useState('10 ans');
  const [patientDb, setPatientDb] = useState(true);
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [cookies, setCookies] = useState(false);

  // Droits et accès state
  const [dataExport, setDataExport] = useState(false);
  const [dataDelete, setDataDelete] = useState(false);
  const [accessLog, setAccessLog] = useState(true);
  const [twoFactor, setTwoFactor] = useState(false);

  // Communications marketing state
  const [newsEmail, setNewsEmail] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [surveys, setSurveys] = useState(false);
  const [partnerOffers, setPartnerOffers] = useState(false);

  const handleSave = () => {
    toast.success('Paramètres de confidentialité enregistrés');
  };

  return (
    <div className="p-8 max-w-3xl">
      <h1 className="text-xl font-bold text-gray-900 mb-6">Centre de confidentialité</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'Données' && (
        <div className="space-y-6">
          {/* Données personnelles */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Données personnelles</h2>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">
                  Activation de la prise de RDV via votre profil Google Business
                </span>
                <StatusBadge active={googleBusiness} />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">
                  Amélioration des publicités sur des sites tiers
                </span>
                <StatusBadge active={thirdPartyAds} />
              </div>
            </div>
          </section>

          {/* Données de l'établissement */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Données de l&apos;établissement</h2>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={true}
                    readOnly
                    className="w-4 h-4 rounded border-gray-300 text-teal-600"
                  />
                  <span className="text-sm text-gray-700">Politique de conservation des données</span>
                </div>
                <select
                  value={retentionPeriod}
                  onChange={(e) => setRetentionPeriod(e.target.value)}
                  className="text-sm border border-gray-300 rounded px-2 py-1 focus:ring-1 focus:ring-teal-500"
                >
                  <option>5 ans</option>
                  <option>10 ans</option>
                  <option>20 ans</option>
                </select>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-700">Gestion des données des bases patients</span>
                <StatusBadge active={patientDb} />
              </div>
            </div>
          </section>

          {/* Protection des données personnelles */}
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Protection des données personnelles</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rgpdConsent}
                  onChange={(e) => setRgpdConsent(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-teal-600"
                />
                <div>
                  <span className="text-sm text-gray-700">
                    Accord sur la Protection des Données à Caractère Personnel
                    <Tooltip text="Règlement Général sur la Protection des Données (RGPD)" />
                  </span>
                </div>
              </label>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={true}
                  readOnly
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-teal-600"
                />
                <span className="text-sm text-gray-700">
                  Confidentialité
                  <Tooltip text="Politique de confidentialité de la plateforme" />
                </span>
              </label>
            </div>
          </section>

          {/* Gestion des cookies */}
          <section>
            <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={cookies}
                  onChange={(e) => setCookies(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-gray-300 text-teal-600"
                />
                <div>
                  <p className="text-sm font-medium text-gray-700">Gestion des cookies</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Gestion des cookies et du consentement
                    <Tooltip text="Paramètres des cookies de la plateforme" />
                  </p>
                  <p className="text-xs text-teal-600 mt-0.5 hover:underline cursor-pointer">
                    Politique de cookies
                    <Tooltip text="Consulter notre politique de cookies" />
                  </p>
                </div>
              </label>
            </div>
          </section>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              className="px-6 py-2 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 transition-colors"
            >
              Valider
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Droits et accès' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Droits d&apos;accès aux données</h2>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Export de mes données</p>
                  <p className="text-xs text-gray-500 mt-0.5">Demander un export de toutes vos données personnelles</p>
                </div>
                <button
                  onClick={() => toast.info('Demande d\'export enregistrée. Vous recevrez un email sous 72h.')}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700"
                >
                  Demander
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Droit à l&apos;oubli</p>
                  <p className="text-xs text-gray-500 mt-0.5">Demander la suppression de votre compte et données</p>
                </div>
                <button
                  onClick={() => toast.warning('Cette action est irréversible. Contactez le support.')}
                  className="px-3 py-1.5 text-sm border border-red-200 rounded-lg hover:bg-red-50 text-red-600"
                >
                  Demander
                </button>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Journal d&apos;accès</p>
                  <p className="text-xs text-gray-500 mt-0.5">Enregistrer les accès à votre dossier</p>
                </div>
                <Toggle checked={accessLog} onChange={setAccessLog} />
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-700">Double authentification</p>
                  <p className="text-xs text-gray-500 mt-0.5">Sécuriser votre compte avec un code SMS</p>
                </div>
                <Toggle checked={twoFactor} onChange={setTwoFactor} />
              </div>
            </div>
          </section>
          <div className="flex justify-end">
            <button onClick={handleSave} className="px-6 py-2 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800">
              Valider
            </button>
          </div>
        </div>
      )}

      {activeTab === 'Communications marketing' && (
        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold text-gray-700 mb-3">Préférences de communication</h2>
            <div className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100">
              {[
                { label: 'Newsletters et actualités', desc: 'Actualités de la plateforme et du secteur de santé', state: newsEmail, set: setNewsEmail },
                { label: 'Mises à jour produit', desc: 'Nouvelles fonctionnalités et améliorations', state: productUpdates, set: setProductUpdates },
                { label: 'Sondages et études', desc: 'Participer à l\'amélioration de la plateforme', state: surveys, set: setSurveys },
                { label: 'Offres partenaires', desc: 'Offres de nos partenaires santé', state: partnerOffers, set: setPartnerOffers },
              ].map(({ label, desc, state, set }) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">{label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
                  </div>
                  <Toggle checked={state} onChange={set} />
                </div>
              ))}
            </div>
          </section>
          <div className="flex justify-end">
            <button onClick={handleSave} className="px-6 py-2 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800">
              Valider
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
