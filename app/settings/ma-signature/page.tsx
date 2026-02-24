'use client';

import { useState, useEffect } from 'react';
import { Pen, Eye, Save, Trash2, Info } from 'lucide-react';
import { toast } from '@/lib/toast';

export default function MaSignaturePage() {
  const [text, setText] = useState('');
  const [saved, setSaved] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('doctorTextSignature');
    if (stored) {
      setText(stored);
      setSaved(stored);
    }
  }, []);

  const handleSave = () => {
    localStorage.setItem('doctorTextSignature', text);
    setSaved(text);
    toast.success('Signature enregistrée');
  };

  const handleDelete = () => {
    localStorage.removeItem('doctorTextSignature');
    setText('');
    setSaved('');
    toast.success('Signature supprimée');
  };

  const isDirty = text !== saved;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 mb-2">Ma signature</h1>
      <p className="text-sm text-gray-500 mb-6">
        Votre signature apparaît en bas des documents générés (ordonnances, certificats, courriers).
        Personnalisez-la selon vos besoins.
      </p>

      {/* Editor panel */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
            <Pen className="w-4 h-4 text-gray-400" />
            Signature textuelle
          </div>
        </div>
        <div className="p-4">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={5}
            className="w-full text-sm font-mono border border-gray-200 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-800"
            placeholder={`Dr Jean Dupont\nMédecine Générale\nRPPS: 10003456789`}
          />
          <p className="text-xs text-gray-400 mt-1">
            Chaque ligne correspond à une ligne de votre signature.
          </p>
        </div>
      </div>

      {/* Preview panel */}
      <div className="bg-white border border-gray-200 rounded-lg mb-6">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100 text-sm font-medium text-gray-700">
          <Eye className="w-4 h-4 text-gray-400" />
          Aperçu
        </div>
        <div className="p-4">
          <div className="bg-gray-50 rounded-lg px-4 py-3 border border-gray-200 font-mono text-sm text-gray-800 whitespace-pre-wrap min-h-[80px]">
            {text || <span className="text-gray-300 italic">Votre signature apparaîtra ici</span>}
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 bg-teal-50 border border-teal-200 rounded-lg px-4 py-3 mb-6 text-sm text-teal-800">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0 text-teal-500" />
        <p>
          Cette signature textuelle est distincte de la signature manuscrite que vous pouvez configurer
          dans votre compte. Elle est utilisée pour les documents qui ne nécessitent pas de signature
          numérique.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={handleDelete}
          className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
          Supprimer
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty && !!saved}
          className="flex items-center gap-2 px-6 py-2 bg-teal-700 text-white text-sm font-medium rounded-lg hover:bg-teal-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-4 h-4" />
          Enregistrer
        </button>
      </div>
    </div>
  );
}
