import React, { useState, useEffect, useRef } from 'react';
import { ProjectData } from '../types';
import { exportUnitsToPDF } from '../utils/pdfGenerator';
import {
  FileText,
  RefreshCw,
  ExternalLink,
  Download,
  Maximize2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface PdfLivePreviewProps {
  project: ProjectData;
  onDownloadPdf?: () => void;
  isExportingPdf?: boolean;
  pdfProgressPercent?: number;
}

export const PdfLivePreview: React.FC<PdfLivePreviewProps> = ({
  project,
  onDownloadPdf,
  isExportingPdf = false,
  pdfProgressPercent
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [genError, setGenError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeUrlRef = useRef<string | null>(null);

  // Generate real PDF in memory and create object URL
  const generatePreview = async () => {
    setIsGenerating(true);
    setGenError(null);

    try {
      const result = await exportUnitsToPDF([project], {
        catalogTitle: `Ficha Técnica - ${project.code || project.title}`,
        includeCover: false,
        autoDownload: false
      });

      // Cleanup old object URL to prevent memory leaks
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }

      activeUrlRef.current = result.blobUrl;
      setPdfUrl(result.blobUrl);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error generating live PDF preview', err);
      setGenError('No se pudo generar la vista previa del PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  // Debounced auto-generation whenever project data changes
  useEffect(() => {
    const timer = setTimeout(() => {
      generatePreview();
    }, 350);

    return () => clearTimeout(timer);
  }, [
    project.title,
    project.subtitle,
    project.code,
    project.address,
    project.googleMapsUrl,
    project.coordinates,
    project.imageSrc,
    project.specs,
    project.reach,
    project.showLogo,
    project.logoSrc,
    project.showQrCode
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (activeUrlRef.current) {
        URL.revokeObjectURL(activeUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* PDF Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-medium">
            <FileText className="w-3.5 h-3.5 text-slate-700" />
            <span>Ficha Técnica A4 Horizontal</span>
          </div>

          <div className="flex items-center gap-1 text-[11px] text-slate-500">
            {isGenerating ? (
              <span className="flex items-center gap-1 text-slate-600">
                <RefreshCw className="w-3 h-3 animate-spin text-slate-400" />
                Actualizando...
              </span>
            ) : (
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Sincronizado {lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {/* Toolbar Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Refresh button */}
          <button
            type="button"
            onClick={generatePreview}
            disabled={isGenerating}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="Regenerar vista previa ahora"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin text-slate-400' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Actualizar</span>
          </button>

          {/* Open in new tab */}
          {pdfUrl && (
            <a
              href={pdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 shadow-2xs transition-colors"
              title="Abrir PDF en pestaña nueva del navegador"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Pestaña Nueva</span>
            </a>
          )}

          {/* Fullscreen button */}
          <button
            type="button"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={isFullscreen ? 'Salir de pantalla completa' : 'Ver PDF en pantalla completa'}
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Direct Download Button */}
          {onDownloadPdf && (
            <button
              type="button"
              onClick={onDownloadPdf}
              disabled={isExportingPdf}
              className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-black active:scale-95 px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer disabled:cursor-wait whitespace-nowrap"
              title="Descargar este archivo PDF directamente"
            >
              {isExportingPdf && pdfProgressPercent !== undefined && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/20 transition-all duration-300 ease-out"
                  style={{ width: `${pdfProgressPercent}%` }}
                />
              )}
              <span className="relative z-10 flex items-center gap-1.5">
                {isExportingPdf ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>{pdfProgressPercent ?? 0}%</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar PDF</span>
                  </>
                )}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* PDF Paper Presentation Canvas Container */}
      <div
        className={`relative w-full rounded-2xl border border-slate-200/90 bg-slate-100/70 p-2 sm:p-3 overflow-hidden shadow-xs transition-all ${
          isFullscreen
            ? 'fixed inset-0 z-50 rounded-none border-0 bg-slate-900/95 p-4 sm:p-8 flex flex-col justify-center items-center backdrop-blur-md'
            : ''
        }`}
      >
        {isFullscreen && (
          <div className="w-full max-w-6xl mb-3 flex items-center justify-between text-white">
            <span className="font-semibold text-sm">Vista Previa del Documento PDF · {project.code || project.title}</span>
            <button
              type="button"
              onClick={() => setIsFullscreen(false)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium cursor-pointer transition-colors"
            >
              Cerrar Pantalla Completa
            </button>
          </div>
        )}

        {/* Paper Sheet Frame with Exact A4 Landscape Aspect Ratio (297/210 = 1.414) */}
        <div
          className={`relative w-full aspect-[297/210] max-h-[70vh] bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden flex items-center justify-center ${
            isFullscreen ? 'max-w-6xl max-h-[85vh] shadow-2xl' : ''
          }`}
        >
          {pdfUrl ? (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&view=FitH`}
              title="Vista previa del documento PDF generado"
              className="w-full h-full border-0 bg-white"
            />
          ) : isGenerating ? (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400" />
              <p className="text-xs font-semibold text-slate-700">Generando documento PDF en tiempo real...</p>
              <p className="text-[11px] text-slate-400">Compilando coordenadas, fotografía, QR y métricas</p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 p-8 text-center text-slate-500">
              <AlertCircle className="w-6 h-6 text-slate-400" />
              <p className="text-xs font-semibold text-slate-700">Haz clic en Actualizar para generar la vista previa</p>
            </div>
          )}

          {/* Quick Refresh Float Tag when generating */}
          {isGenerating && pdfUrl && (
            <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md border border-slate-200 text-slate-700 text-[11px] font-semibold px-2.5 py-1 rounded-md shadow-sm flex items-center gap-1.5 z-10 animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-slate-500" />
              <span>Sincronizando cambios...</span>
            </div>
          )}
        </div>

        {/* Helper bottom footnote */}
        <div className="mt-2.5 px-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
          <span>Este es el documento vectorial exacto que se descargará al hacer clic en «Descargar PDF».</span>
          <span className="font-mono text-slate-400">Resolución de impresión: 300 DPI</span>
        </div>
      </div>
    </div>
  );
};
