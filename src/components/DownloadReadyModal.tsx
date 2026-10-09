import React, { useState } from 'react';
import {
  FileDown,
  Image as ImageIcon,
  CheckCircle,
  X,
  Download,
  Printer,
  Copy,
  Check,
  Eye,
  ExternalLink,
  Maximize2
} from 'lucide-react';
import { saveFileToDisk } from '../utils/downloadHelper';

export interface DownloadModalData {
  title: string;
  filename: string;
  url: string;
  type: 'pdf' | 'image';
  sizeFormatted?: string;
  blob?: Blob;
  serverDownloadUrl?: string;
  serverViewUrl?: string;
}

interface DownloadReadyModalProps {
  data: DownloadModalData | null;
  onClose: () => void;
}

export const DownloadReadyModal: React.FC<DownloadReadyModalProps> = ({
  data,
  onClose
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedImage, setCopiedImage] = useState(false);
  const [showPreview, setShowPreview] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data) return null;

  const handleSaveClick = async () => {
    setIsSaving(true);
    setSavedSuccess(false);

    try {
      if (data.serverDownloadUrl) {
        const link = document.createElement('a');
        link.href = data.serverDownloadUrl;
        link.download = data.filename;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (document.body.contains(link)) document.body.removeChild(link);
        }, 1000);

        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 5000);
        return;
      }

      let targetBlob = data.blob;
      if (!targetBlob) {
        const res = await fetch(data.url);
        targetBlob = await res.blob();
      }

      const mimeType = data.type === 'pdf'
        ? 'application/pdf'
        : (data.filename.endsWith('.jpg') || data.filename.endsWith('.jpeg'))
          ? 'image/jpeg'
          : 'image/png';

      const res = await saveFileToDisk({
        filename: data.filename,
        blob: targetBlob,
        mimeType
      });

      if (res.success) {
        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 5000);
      }
    } catch (e) {
      console.error('Save to disk error', e);
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    const targetUrl = data.serverViewUrl || data.url;
    const printWin = window.open(targetUrl, '_blank');
    if (printWin) {
      printWin.focus();
      setTimeout(() => {
        try {
          printWin.print();
        } catch {
          // ignore
        }
      }, 1000);
    } else {
      window.print();
    }
  };

  const handleCopyImageToClipboard = async () => {
    if (data.type !== 'image') return;
    try {
      const res = await fetch(data.url);
      const blob = await res.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type || 'image/png']: blob })
      ]);
      setCopiedImage(true);
      setTimeout(() => setCopiedImage(false), 2500);
    } catch (err) {
      console.warn('Clipboard write failed', err);
    }
  };

  const downloadLink = data.serverDownloadUrl || data.url;
  const viewLink = data.serverViewUrl || data.url;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6 animate-in fade-in duration-200 overflow-y-auto">
      <div
        className={`bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-2xl w-full flex flex-col gap-3.5 sm:gap-4 text-left relative animate-in zoom-in-95 duration-200 my-auto transition-all ${
          isExpanded ? 'max-w-[96vw] p-4 sm:p-6' : 'max-w-4xl p-4 sm:p-6'
        }`}
      >
        {/* Modal Top Bar */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-800 shrink-0">
              {data.type === 'pdf' ? (
                <FileDown className="w-5 h-5 text-slate-800" />
              ) : (
                <ImageIcon className="w-5 h-5 text-slate-800" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-md">
                  <CheckCircle className="w-3 h-3 text-emerald-600" />
                  <span>{data.type === 'pdf' ? 'Ficha Técnica en PDF' : 'Imagen HD'}</span>
                </span>
                {data.sizeFormatted && (
                  <span className="text-[11px] font-mono text-slate-500">
                    {data.sizeFormatted}
                  </span>
                )}
                {data.type === 'pdf' && (
                  <span className="text-[11px] text-slate-500 hidden sm:inline">
                    · Formato A4 Horizontal
                  </span>
                )}
              </div>

              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight mt-0.5">
                {data.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {data.type === 'pdf' && (
              <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer hidden sm:inline-flex"
                title={isExpanded ? 'Restaurar tamaño' : 'Ampliar vista previa'}
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title="Cerrar ventana"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Live Document Preview Box - Spacious & Crisp */}
        {showPreview && (
          <div
            className={`relative w-full rounded-xl border border-slate-200 bg-slate-100/70 overflow-hidden shadow-inner flex flex-col items-center justify-center transition-all ${
              isExpanded
                ? 'h-[65vh] min-h-[460px]'
                : data.type === 'pdf'
                  ? 'h-[420px] sm:h-[480px]'
                  : 'h-[340px]'
            }`}
          >
            {data.type === 'pdf' ? (
              <iframe
                src={`${viewLink}#toolbar=1&navpanes=0&view=FitH`}
                title="Vista previa del documento PDF"
                className="w-full h-full border-0 bg-white"
              />
            ) : (
              <div className="w-full h-full p-3 flex items-center justify-center bg-white">
                <img
                  src={data.url}
                  alt={data.filename}
                  className="max-h-full max-w-full object-contain rounded-lg shadow-xs"
                />
              </div>
            )}
          </div>
        )}

        {/* Bottom Actions Row */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          {/* File Info */}
          <div className="text-xs text-slate-500 font-mono truncate max-w-md hidden md:block">
            {data.filename}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
            {/* View in new tab */}
            <a
              href={viewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs py-2.5 px-3.5 rounded-xl border border-slate-200 transition-colors"
              title="Abrir el documento PDF directamente en una pestaña nueva"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-600" />
              <span>Ver en pestaña nueva</span>
            </a>

            {/* Print */}
            {data.type === 'pdf' && (
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl border border-slate-200 transition-colors cursor-pointer"
                title="Imprimir documento"
              >
                <Printer className="w-3.5 h-3.5 text-slate-500" />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
            )}

            {/* Copy image if image */}
            {data.type === 'image' && (
              <button
                type="button"
                onClick={handleCopyImageToClipboard}
                className="inline-flex items-center justify-center gap-1.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              >
                {copiedImage ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-500" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            )}

            {/* Toggle Preview Button */}
            <button
              type="button"
              onClick={() => setShowPreview(!showPreview)}
              className="inline-flex items-center justify-center gap-1 bg-white hover:bg-slate-50 text-slate-500 font-medium text-xs py-2.5 px-2.5 rounded-xl border border-slate-200 transition-colors cursor-pointer"
              title={showPreview ? 'Ocultar vista previa' : 'Mostrar vista previa'}
            >
              <Eye className="w-3.5 h-3.5" />
            </button>

            {/* Primary Download Button - Clean Dark Slate with Subtle Red Accent */}
            <a
              href={downloadLink}
              download={data.filename}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => {
                setSavedSuccess(true);
                setTimeout(() => setSavedSuccess(false), 5000);
              }}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl shadow-xs transition-all cursor-pointer bg-slate-900 hover:bg-black active:scale-98 text-white whitespace-nowrap"
            >
              <Download className="w-4 h-4 text-white" />
              <span>
                {savedSuccess
                  ? '¡Descargado!'
                  : data.type === 'pdf'
                    ? 'Descargar PDF'
                    : 'Descargar Imagen'}
              </span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
