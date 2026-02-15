// apps/web-pro/app/wallet/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type TransactionType = 'PAYMENT' | 'PAYOUT' | 'REFUND';
type TransactionStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

type Transaction = {
  id: string;
  amount: string; // Decimal sérialisé en string
  type: TransactionType;
  status: TransactionStatus;
  description?: string | null;
  createdAt: string;
};

type WalletSummary = {
  balance: number;
  totalPayments: number;
  totalPayouts: number;
  pendingPayouts: number;
};

type WalletResponse = {
  summary: WalletSummary;
  lastTransactions: Transaction[];
};

function getApiBase(): string | null {
  let b = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  b = b.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  if (!b) return null;
  try {
    new URL(b);
    return b;
  } catch {
    return null;
  }
}

export default function WalletPage() {
  const router = useRouter();
  const [wallet, setWallet] = useState<WalletResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  useEffect(() => {
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (!token) {
      router.replace('/auth/login');
      return;
    }

    const base = getApiBase();
    const url = base ? `${base}/wallet/me` : '/wallet/me';

    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${token}` },
          cache: 'no-store',
        });
        if (!res.ok) {
          const t = await res.text().catch(() => '');
          throw new Error(`HTTP ${res.status}${t ? ` — ${t}` : ''}`);
        }
        const data = await res.json();
        setWallet(data);
      } catch (e: any) {
        if (String(e?.message || '').includes('403')) {
          setErr('Accès refusé — réservé aux médecins.');
        } else if (String(e?.message || '').includes('401')) {
          router.replace('/auth/login');
        } else {
          setErr(e?.message || 'Erreur de chargement');
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
          Chargement du portefeuille…
        </div>
      </div>
    );
  }

  if (err) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 shadow-sm">
          {err}
        </div>
      </div>
    );
  }

  if (!wallet) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="rounded-2xl border bg-white p-4 text-sm text-slate-600 shadow-sm">
          Aucune donnée de portefeuille disponible.
        </div>
      </div>
    );
  }

  const { summary, lastTransactions } = wallet;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            Mon portefeuille
          </h1>
          <p className="text-sm text-slate-500">
            Suivi de vos revenus et retraits sur la plateforme.
          </p>
        </div>
        <button
          type="button"
          disabled={summary.balance <= 0}
          onClick={() => { setPayoutAmount(summary.balance.toFixed(2)); setPayoutSuccess(false); setShowPayoutModal(true); }}
          className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium shadow-sm ${
            summary.balance > 0
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-slate-200 text-slate-500 cursor-not-allowed'
          }`}
        >
          Demander un retrait
        </button>
      </div>

      {/* Summary cards */}
      <section className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          label="Solde disponible"
          value={`${summary.balance.toFixed(2)} €`}
          accent="primary"
        />
        <SummaryCard
          label="Revenus cumulés"
          value={`${summary.totalPayments.toFixed(2)} €`}
        />
        <SummaryCard
          label="Total retiré"
          value={`${summary.totalPayouts.toFixed(2)} €`}
        />
        <SummaryCard
          label="En cours de virement"
          value={`${summary.pendingPayouts.toFixed(2)} €`}
        />
      </section>

      {/* Transactions */}
      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900">
            Dernières transactions
          </h2>
          <span className="text-xs text-slate-500">
            {lastTransactions.length} opération(s) récente(s)
          </span>
        </div>

        <div className="overflow-hidden rounded-2xl border bg-white shadow-sm">
          {lastTransactions.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-slate-500">
              Aucune transaction pour l&apos;instant.
            </div>
          ) : (
            <table className="min-w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs font-semibold text-slate-500">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3 text-right">Montant</th>
                  <th className="px-4 py-3">Statut</th>
                </tr>
              </thead>
              <tbody>
                {lastTransactions.map((t) => {
                  const d = new Date(t.createdAt);
                  const amountNum = Number(t.amount);
                  const sign =
                    t.type === 'PAYOUT' || t.type === 'REFUND' ? '-' : '+';
                  const color =
                    t.type === 'PAYMENT'
                      ? 'text-emerald-700'
                      : 'text-rose-700';

                  return (
                    <tr
                      key={t.id}
                      className="border-t last:border-b hover:bg-slate-50/60"
                    >
                      <td className="px-4 py-3 text-xs text-slate-600">
                        <div>
                          {d.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {d.toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <TypeBadge type={t.type} />
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700">
                        {t.description || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-sm font-medium ${color}`}>
                          {sign} {amountNum.toFixed(2)} €
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={t.status} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl">
            <div className="p-6">
              {payoutSuccess ? (
                <div className="text-center py-4">
                  <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Demande envoyée</h3>
                  <p className="text-sm text-slate-500 mb-4">Votre demande de retrait de {payoutAmount} € a été enregistrée. Le virement sera effectué sous 2-3 jours ouvrés.</p>
                  <button onClick={() => setShowPayoutModal(false)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700">
                    Fermer
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Demander un retrait</h3>
                  <p className="text-sm text-slate-500 mb-4">Solde disponible : {summary.balance.toFixed(2)} €</p>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-slate-700 mb-1">Montant (€)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="1"
                      max={summary.balance}
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(e.target.value)}
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => setShowPayoutModal(false)} className="flex-1 px-4 py-2.5 border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50">
                      Annuler
                    </button>
                    <button
                      disabled={payoutLoading || !payoutAmount || parseFloat(payoutAmount) <= 0 || parseFloat(payoutAmount) > summary.balance}
                      onClick={async () => {
                        setPayoutLoading(true);
                        try {
                          const token = localStorage.getItem('token');
                          const base = getApiBase();
                          const url = base ? `${base}/wallet/payout` : '/wallet/payout';
                          const res = await fetch(url, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                            body: JSON.stringify({ amount: parseFloat(payoutAmount) }),
                          });
                          if (res.ok) {
                            setPayoutSuccess(true);
                          } else {
                            const errData = await res.json().catch(() => ({}));
                            alert(errData.message || 'Erreur lors de la demande de retrait');
                          }
                        } catch {
                          alert('Erreur réseau. Veuillez réessayer.');
                        } finally {
                          setPayoutLoading(false);
                        }
                      }}
                      className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {payoutLoading ? 'Envoi...' : 'Confirmer le retrait'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: 'primary';
}) {
  const border =
    accent === 'primary'
      ? 'border-emerald-100 bg-emerald-50/60'
      : 'border-slate-100 bg-white';
  const valueColor =
    accent === 'primary' ? 'text-emerald-700' : 'text-slate-900';

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${border}`}>
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className={`mt-2 text-lg font-semibold ${valueColor}`}>
        {value}
      </div>
    </div>
  );
}

function TypeBadge({ type }: { type: TransactionType }) {
  const map: Record<TransactionType, { label: string; className: string }> = {
    PAYMENT: {
      label: 'Paiement',
      className: 'bg-emerald-50 text-emerald-700',
    },
    PAYOUT: {
      label: 'Retrait',
      className: 'bg-sky-50 text-sky-700',
    },
    REFUND: {
      label: 'Remboursement',
      className: 'bg-amber-50 text-amber-700',
    },
  };
  const v = map[type] ?? map.PAYMENT;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${v.className}`}
    >
      {v.label}
    </span>
  );
}

function StatusBadge({ status }: { status: TransactionStatus }) {
  const map: Record<TransactionStatus, { label: string; className: string }> = {
    PENDING: {
      label: 'En attente',
      className: 'bg-amber-50 text-amber-700',
    },
    SUCCESS: {
      label: 'Succès',
      className: 'bg-emerald-50 text-emerald-700',
    },
    FAILED: {
      label: 'Échec',
      className: 'bg-rose-50 text-rose-700',
    },
  };
  const v = map[status] ?? map.PENDING;
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${v.className}`}
    >
      {v.label}
    </span>
  );
}