'use client';

import { useState, useEffect } from 'react';
import { Pen, Eye, Save, Trash2, Info, Check } from 'lucide-react';
import { toast } from '@/lib/toast';

export default function MaSignaturePage() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('doctorTextSignature');
    if (stored) { setText(stored); setSaved(stored); }
  }, []);

  const handleSave = () => {
    localStorage.setItem('doctorTextSignature', text);
    setSaved(text);
    toast.success('Signature enregistrée');
  };

  const handleDelete = () => {
    localStorage.removeItem('doctorTextSignature');
    setText(''); setSaved('');
    toast.success('Signature supprimée');
  };

  const isDirty = text !== saved;

  return (
    <>
      <div className="mb-6">
        <h1 className="text-lg font-semibold text-slate-900">Ma signature</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Apparaît en bas des ordonnances, certificats et courriers générés
        </p>
      </div>

      {/* Editor */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
          <Pen className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Signature textuelle</span>
        </div>
        <div className="p-5">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={5}
            className="w-full text-sm font-mono border border-slate-200 rounded-lg px-3 py-2.5 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 placeholder-slate-300 transition-colors"
            placeholder={`Dr Jean Dupont\nMédecine Générale\nRPPS: 10003456789`}
          />
          <p className="text-xs text-slate-400 mt-1.5">Chaque ligne correspond à une ligne de votre signature.</p>
        </div>
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-4">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-slate-100">
          <Eye className="w-4 h-4 text-slate-400" />
          <span className="text-sm font-semibold text-slate-700">Aperçu</span>
        </div>
        <div className="p-5">
          <div className="bg-slate-50 rounded-lg px-4 py-3.5 border border-slate-200 font-mono text-sm text-slate-800 whitespace-pre-wrap min-h-[80px]">
            {text || <span className="text-slate-300 italic not-italic font-sans text-sm">Votre signature apparaîtra ici</span>}
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="flex items-start gap-2.5 p-4 bg-teal-50 border border-teal-100 rounded-xl text-sm text-teal-800 mb-6">
        <Info className="w-4 h-4 mt-0.5 shrink-0 text-teal-500" />
        Cette signature textuelle est distincte de la signature manuscrite numérique. Elle est utilisée pour les documents ne nécessitant pas de signature sécurisée.
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button onClick={handleDelete} disabled={!saved}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium">
          <Trash2 className="w-4 h-4" /> Supprimer
        </button>
        <button onClick={handleSave} disabled={!isDirty}
          className="flex items-center gap-2 px-5 py-2 bg-teal-600 text-white text-sm font-medium rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
          <Save className="w-4 h-4" /> Enregistrer
        </button>
      </div>
    </>
  );
}
