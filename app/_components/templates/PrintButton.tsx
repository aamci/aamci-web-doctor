'use client';

import { useRef, useState } from 'react';
import { Printer, X, Loader2, ZoomIn, ZoomOut } from 'lucide-react';

interface PrintButtonProps {
  children: React.ReactNode;
  documentTitle?: string;
  onPrint?: () => void;
  className?: string;
  disabled?: boolean;
}

export default function PrintButton({
  children,
  documentTitle = 'Document',
  onPrint,
  className = '',
  disabled = false,
}: PrintButtonProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);
  const [zoom, setZoom] = useState(100);

  const handlePrint = () => {
    if (!contentRef.current) return;
    setIsPrinting(true);

    // Collect styles before creating the iframe
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

    const html = `<!DOCTYPE html>
<html>
  <head>
    <title>${documentTitle}</title>
    <style>
      ${styles}
      @page { size: A4; margin: 12mm 15mm; }
      html, body { margin: 0; padding: 0; width: 100%; }
      .print-content { width: 100%; box-sizing: border-box; }
    </style>
  </head>
  <body><div class="print-content">${contentRef.current.innerHTML}</div></body>
</html>`;

    const cleanup = (frame: HTMLIFrameElement) => {
      try { document.body.removeChild(frame); } catch { /* already removed */ }
      setIsPrinting(false);
      onPrint?.();
    };

    const printFrame = document.createElement('iframe');
    printFrame.style.cssText = 'position:absolute;top:-9999px;left:-9999px;width:0;height:0;border:0;';

    // Attach onload BEFORE appending to DOM
    printFrame.onload = () => {
      try {
        printFrame.contentWindow?.print();
      } catch {
        // silent — print dialog may be blocked
      }
      setTimeout(() => cleanup(printFrame), 1500);
    };

    document.body.appendChild(printFrame);

    // Write content — use srcdoc when available (more reliable), fall back to document.write
    if ('srcdoc' in printFrame) {
      printFrame.srcdoc = html;
    } else {
      const frameDoc = printFrame.contentWindow?.document;
      if (!frameDoc) { cleanup(printFrame); return; }
      frameDoc.open();
      frameDoc.write(html);
      frameDoc.close();
      // document.write on an about:blank iframe may not trigger onload — fire manually after a tick
      setTimeout(() => {
        try { printFrame.contentWindow?.print(); } catch { /* silent */ }
        setTimeout(() => cleanup(printFrame), 1500);
      }, 300);
    }
  };

  return (
    <>
      {/* Contenu à imprimer (caché) */}
      <div ref={contentRef} className="hidden">
        {children}
      </div>

      {/* Boutons d'action */}
      <div className={`flex items-center gap-2 ${className}`}>
        <button
          onClick={disabled ? undefined : () => { setZoom(100); setIsPreviewOpen(true); }}
          disabled={disabled}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Printer className="w-4 h-4" />
          Aperçu
        </button>
        <button
          onClick={disabled ? undefined : handlePrint}
          disabled={isPrinting || disabled}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="fixed inset-4 md:inset-8 lg:inset-12 bg-gray-200 rounded-xl z-50 flex flex-col overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 bg-white border-b flex-shrink-0">
              <h2 className="font-semibold text-gray-900 text-sm truncate mr-4">Aperçu — {documentTitle}</h2>
              <div className="flex items-center gap-2">
                {/* Zoom controls */}
                <div className="flex items-center gap-1 bg-gray-100 rounded-lg px-1 py-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(50, z - 10))}
                    className="p-1.5 hover:bg-white rounded-md transition-colors"
                    title="Zoom arrière"
                  >
                    <ZoomOut className="w-4 h-4 text-gray-600" />
                  </button>
                  <span className="text-xs font-medium text-gray-600 w-10 text-center select-none">
                    {zoom}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(200, z + 10))}
                    className="p-1.5 hover:bg-white rounded-md transition-colors"
                    title="Zoom avant"
                  >
                    <ZoomIn className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
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
            <div className="flex-1 overflow-auto py-6 px-4">
              <div
                className="mx-auto bg-white shadow-lg origin-top"
                style={{
                  width: '210mm',
                  minHeight: '297mm',
                  padding: '12mm 15mm',
                  boxSizing: 'border-box',
                  transform: `scale(${zoom / 100})`,
                  transformOrigin: 'top center',
                  // Compensate for transform not affecting layout:
                  // negative → collapse empty space below, positive → expose overflowed content
                  marginBottom: `calc((${zoom / 100} - 1) * 297mm)`,
                }}
              >
                {children}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
