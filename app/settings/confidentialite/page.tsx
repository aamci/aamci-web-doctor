'use client';

import { useState, useEffect } from 'react';
import { HelpCircle, Shield, Database, Mail, Download, Trash2, Lock, Check, Loader2 } from 'lucide-react';
import { toast } from '@/lib/toast';

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try { new URL(b); return b; } catch { return null; }
}

async function authedFetch(path: string, init?: RequestInit) {
  const base = getApiBase();
  const url = base ? `${base}${path}` : `/api${path}`;
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const r = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}), ...init?.headers },
  });
  if (!r.ok) { const t = await r.text().catch(() => ''); throw new Error(`HTTP ${r.status}${t ? ` — ${t}` : ''}`); }
  return r;
}

const TABS = ['Données & RGPD', 'Droits et accès', 'Communications'] as const;
type Tab = (typeof TABS)[number];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none ${checked ? 'bg-teal-600' : 'bg-slate-200'}`}>
      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
    </button>
  );
}

function Tooltip({ text }: { text: string }) {
  return (
    <span className="relative group inline-block ml-1 align-middle">
      <HelpCircle className="w-3.5 h-3.5 text-slate-400 inline cursor-help" />
      <span className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 hidden group-hover:block w-56 bg-slate-900 text-white text-xs rounded-lg px-3 py-2 z-50 pointer-events-none shadow-lg">
        {text}
      </span>
    </span>
  );
}

export default function ConfidentialitePage() {
  const [activeTab, setActiveTab] = useState<Tab>('Données & RGPD');
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Données tab
  const [retentionPeriod, setRetentionPeriod] = useState('10 ans');
  const [rgpdConsent, setRgpdConsent] = useState(false);
  const [cookies, setCookies] = useState(false);

  // 2FA state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<'idle' | 'setup' | 'disable'>('idle');
  const [otpauthUrl, setOtpauthUrl] = useState('');
  const [twoFactorSecret, setTwoFactorSecret] = useState('');
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [twoFactorBackupCodes, setTwoFactorBackupCodes] = useState<string[]>([]);
  const [twoFactorLoading, setTwoFactorLoading] = useState(false);
  const [accessLog, setAccessLog] = useState(true);

  // Communications
  const [newsEmail, setNewsEmail] = useState(true);
  const [productUpdates, setProductUpdates] = useState(true);
  const [surveys, setSurveys] = useState(false);
  const [partnerOffers, setPartnerOffers] = useState(false);

  useEffect(() => {
    authedFetch('/2fa/status').then(r => r.json()).then(d => setTwoFactorEnabled(d.isEnabled)).catch(() => {});
  }, []);

  async function handleSetup2FA() {
    setTwoFactorLoading(true);
    try {
      const r = await authedFetch('/2fa/generate', { method: 'POST' });
      const d = await r.json();
      setOtpauthUrl(d.otpauthUrl);
      setTwoFactorSecret(d.secret);
      setTwoFactorBackupCodes(d.backupCodes ?? []);
      setTwoFactorStep('setup');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Erreur génération 2FA');
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleEnable2FA() {
    setTwoFactorLoading(true);
    try {
      await authedFetch('/2fa/enable', { method: 'POST', body: JSON.stringify({ code: twoFactorCode }) });
      setTwoFactorEnabled(true);
      setTwoFactorStep('idle');
      setTwoFactorCode('');
      toast.success('Double authentification activée');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Code invalide');
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleDisable2FA() {
    setTwoFactorLoading(true);
    try {
      await authedFetch('/2fa/disable', { method: 'POST', body: JSON.stringify({ code: twoFactorCode }) });
      setTwoFactorEnabled(false);
      setTwoFactorStep('idle');
      setTwoFactorCode('');
      toast.success('Double authentification désactivée');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Code invalide');
    } finally {
      setTwoFactorLoading(false);
    }
  }

  const handleSave = () => toast.success('Paramètres enregistrés');

  async function handleExportData() {
    setExportLoading(true);
    try {
      const base = getApiBase();
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const r = await fetch(`${base ?? '/api'}/me/export`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Export échoué');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `mes-donnees-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Export impossible');
    } finally {
      setExportLoading(false);
    }
  }

  async function handleDeleteAccount() {
    if (deleteConfirm !== 'SUPPRIMER') return;
    setDeleteLoading(true);
    try {
      await authedFetch('/me', { method: 'DELETE' });
      localStorage.removeItem('token');
      window.location.href = '/auth/login';
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Suppression impossible');
      setDeleteLoading(false);
    }
  }

  const SELECT = `px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-colors`;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Confidentialité</h1>
        <p className="text-sm text-slate-500 mt-0.5">Gérez vos données, accès et communications</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-teal-600 text-teal-700'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
              }`}>
              {tab}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Données & RGPD ── */}
      {activeTab === 'Données & RGPD' && (
        <div className="space-y-4">
          {/* Conservation */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Database className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Conservation des données</h2>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">Durée de conservation</p>
                  <p className="text-xs text-slate-400 mt-0.5">Conformément aux obligations légales médicales</p>
                </div>
                <select value={retentionPeriod} onChange={e => setRetentionPeriod(e.target.value)} className={SELECT}>
                  <option>5 ans</option>
                  <option>10 ans</option>
                  <option>20 ans</option>
                </select>
              </div>
            </div>
          </div>

          {/* RGPD & cookies */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Shield className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Protection des données</h2>
            </div>
            <div className="divide-y divide-slate-100">
              <label className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={rgpdConsent} onChange={e => setRgpdConsent(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Accord RGPD
                    <Tooltip text="Règlement Général sur la Protection des Données" />
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Protection des données à caractère personnel</p>
                </div>
              </label>
              <label className="flex items-start gap-3 px-5 py-4 cursor-pointer hover:bg-slate-50 transition-colors">
                <input type="checkbox" checked={cookies} onChange={e => setCookies(e.target.checked)}
                  className="w-4 h-4 mt-0.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    Cookies analytiques
                    <Tooltip text="Cookies utilisés pour améliorer l'application" />
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Données de navigation anonymisées</p>
                </div>
              </label>
            </div>
          </div>

          <div className="flex justify-end">
            <button onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
              <Check className="w-4 h-4" /> Enregistrer
            </button>
          </div>
        </div>
      )}

      {/* ── Droits et accès ── */}
      {activeTab === 'Droits et accès' && (
        <div className="space-y-4">
          {/* Actions RGPD */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Lock className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Vos droits</h2>
            </div>
            <div className="divide-y divide-slate-100">
              <div className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">Export de mes données</p>
                  <p className="text-xs text-slate-400 mt-0.5">Télécharger toutes vos données (JSON)</p>
                </div>
                <button onClick={handleExportData} disabled={exportLoading}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-colors">
                  {exportLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  {exportLoading ? 'Préparation...' : 'Télécharger'}
                </button>
              </div>
              <div className="px-5 py-3.5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">Droit à l&apos;oubli</p>
                    <p className="text-xs text-slate-400 mt-0.5">Anonymiser et supprimer votre compte</p>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mb-2">
                  Tapez <span className="font-mono text-red-600 font-bold">SUPPRIMER</span> pour confirmer :
                </p>
                <div className="flex gap-2">
                  <input
                    type="text" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)}
                    placeholder="SUPPRIMER"
                    className="flex-1 max-w-[180px] px-3 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400"
                  />
                  <button onClick={handleDeleteAccount} disabled={deleteConfirm !== 'SUPPRIMER' || deleteLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                    {deleteLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    Supprimer
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <p className="text-sm font-medium text-slate-800">Journal d'accès</p>
                  <p className="text-xs text-slate-400 mt-0.5">Enregistrer les accès à votre dossier</p>
                </div>
                <Toggle checked={accessLog} onChange={setAccessLog} />
              </div>
            </div>
          </div>

          {/* 2FA */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Shield className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Double authentification (TOTP)</h2>
            </div>
            <div className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {twoFactorEnabled ? 'Activée' : 'Non activée'}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {twoFactorEnabled
                      ? 'Application authenticator liée'
                      : 'Sécurisez votre compte avec Google Authenticator ou Authy'}
                  </p>
                </div>
                {twoFactorEnabled ? (
                  <button onClick={() => setTwoFactorStep('disable')}
                    className="px-3 py-1.5 text-xs font-medium text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors">
                    Désactiver
                  </button>
                ) : (
                  <button onClick={handleSetup2FA} disabled={twoFactorLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-teal-700 border border-teal-200 rounded-lg hover:bg-teal-50 disabled:opacity-50 transition-colors">
                    {twoFactorLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                    {twoFactorLoading ? 'Chargement…' : 'Configurer'}
                  </button>
                )}
              </div>

              {/* Setup flow */}
              {twoFactorStep === 'setup' && (
                <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                  <p className="text-sm font-semibold text-slate-800">Lier votre application authenticator</p>
                  <ol className="text-xs text-slate-500 space-y-1 list-decimal list-inside">
                    <li>Ouvrez Google Authenticator ou Authy</li>
                    <li>Scannez le QR code ou saisissez la clé manuellement</li>
                    <li>Entrez le code à 6 chiffres généré</li>
                  </ol>
                  <div className="flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(otpauthUrl)}&size=160x160`}
                      alt="QR Code 2FA" className="rounded-xl border border-slate-200 shadow-sm"
                      width={160} height={160}
                    />
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-slate-400 mb-1">Clé manuelle</p>
                    <code className="text-xs text-teal-700 font-mono break-all select-all bg-teal-50 px-3 py-1.5 rounded-lg block">{twoFactorSecret}</code>
                  </div>
                  <input
                    type="text" inputMode="numeric" maxLength={6} value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Code à 6 chiffres"
                    className="w-full text-center px-3 py-2.5 border border-slate-200 rounded-lg text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setTwoFactorStep('idle'); setTwoFactorCode(''); }}
                      className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors">
                      Annuler
                    </button>
                    <button onClick={handleEnable2FA} disabled={twoFactorCode.length !== 6 || twoFactorLoading}
                      className="flex-1 py-2 text-sm text-white bg-teal-600 rounded-lg hover:bg-teal-700 disabled:opacity-50 font-medium transition-colors">
                      {twoFactorLoading ? 'Vérification…' : 'Activer'}
                    </button>
                  </div>
                  {twoFactorBackupCodes.length > 0 && (
                    <div className="border-t border-slate-200 pt-4">
                      <p className="text-xs font-medium text-amber-600 mb-2">Codes de secours — conservez-les en lieu sûr :</p>
                      <div className="grid grid-cols-2 gap-1.5">
                        {twoFactorBackupCodes.map(c => (
                          <code key={c} className="text-xs font-mono text-slate-700 bg-slate-100 px-2 py-1 rounded text-center">{c}</code>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Disable flow */}
              {twoFactorStep === 'disable' && (
                <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200 space-y-4">
                  <p className="text-sm font-semibold text-red-800">Désactiver la double authentification</p>
                  <input
                    type="text" inputMode="numeric" maxLength={6} value={twoFactorCode}
                    onChange={e => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="Code TOTP"
                    className="w-full text-center px-3 py-2.5 border border-red-200 rounded-lg text-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-red-400 bg-white"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => { setTwoFactorStep('idle'); setTwoFactorCode(''); }}
                      className="flex-1 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium transition-colors">
                      Annuler
                    </button>
                    <button onClick={handleDisable2FA} disabled={twoFactorCode.length !== 6 || twoFactorLoading}
                      className="flex-1 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium transition-colors">
                      {twoFactorLoading ? 'Vérification…' : 'Désactiver'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Communications ── */}
      {activeTab === 'Communications' && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-100">
              <Mail className="w-4 h-4 text-slate-400" />
              <h2 className="text-sm font-semibold text-slate-800">Préférences email</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {[
                { label: 'Newsletters et actualités', desc: 'Actualités de la plateforme et du secteur', state: newsEmail, set: setNewsEmail },
                { label: 'Mises à jour produit', desc: 'Nouvelles fonctionnalités et améliorations', state: productUpdates, set: setProductUpdates },
                { label: 'Sondages et études', desc: "Participer à l'amélioration de la plateforme", state: surveys, set: setSurveys },
                { label: 'Offres partenaires', desc: 'Offres sélectionnées de nos partenaires santé', state: partnerOffers, set: setPartnerOffers },
              ].map(({ label, desc, state, set }) => (
                <div key={label} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{label}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{desc}</p>
                  </div>
                  <Toggle checked={state} onChange={set} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors">
              <Check className="w-4 h-4" /> Enregistrer
            </button>
          </div>
        </div>
      )}
    </>
  );
}
