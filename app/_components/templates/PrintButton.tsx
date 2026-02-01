'use client';

import { useRef, useState } from 'react';
import { Printer, Download, X, Loader2 } from 'lucide-react';

interface PrintButtonProps {
  children: React.ReactNode;
  documentTitle?: string;
  onPrint?: () => void;
  className?: string;
}

export default function PrintButton({
  children,
  documentTitle = 'Document',
  onPrint,
  className = '',
}: PrintButtonProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);

    // Créer une iframe cachée pour l'impression
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'absolute';
    printFrame.style.top = '-9999px';
    printFrame.style.left = '-9999px';
    document.body.appendChild(printFrame);

    const frameDoc = printFrame.contentWindow?.document;
    if (!frameDoc || !contentRef.current) {
      setIsPrinting(false);
      return;
    }

    // Copier les styles
    const styles = Array.from(document.styleSheets)
      .map((styleSheet) => {
        try {
          return Array.from(styleSheet.cssRules)
            .map((rule) => rule.cssText)
            .join('\n');
        } catch {
          return '';
        }
      })
      .join('\n');

    frameDoc.open();
    frameDoc.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${documentTitle}</title>
          <style>
            ${styles}
            @media print {
              @page {
                size: A4;
                margin: 0;
              }
              body {
                margin: 0;
                padding: 0;
              }
              .print-content {
                width: 210mm;
                min-height: 297mm;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-content">
            ${contentRef.current.innerHTML}
          </div>
        </body>
      </html>
    `);
    frameDoc.close();

    // Attendre que l'iframe soit chargée
    printFrame.onload = () => {
      printFrame.contentWindow?.print();

      // Nettoyer après impression
      setTimeout(() => {
        document.body.removeChild(printFrame);
        setIsPrinting(false);
        onPrint?.();
      }, 1000);
    };
  };

  const handlePreview = () => {
    setIsPreviewOpen(true);
  };

  return (
    <>
      {/* Contenu à imprimer (caché) */}
      <div ref={contentRef} className="hidden print:block">
        {children}
      </div>

      {/* Boutons d'action */}
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={handlePreview}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Aperçu
        </button>
        <button
          onClick={handlePrint}
          disabled={isPrinting}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
        >
          {isPrinting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Printer className="w-4 h-4" />
          )}
          Imprimer
        </button>
      </div>

      {/* Modal d'aperçu */}
      {isPreviewOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setIsPreviewOpen(false)}
          />
          <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-gray-100 rounded-xl z-50 flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b">
              <h2 className="font-semibold text-gray-900">Aperçu - {documentTitle}</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  disabled={isPrinting}
                  className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isPrinting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Printer className="w-4 h-4" />
                  )}
                  Imprimer
                </button>
                <button
                  onClick={() => setIsPreviewOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Contenu de l'aperçu */}
            <div className="flex-1 overflow-auto p-4 md:p-8">
              <div className="mx-auto" style={{ maxWidth: '210mm' }}>
                {children}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
