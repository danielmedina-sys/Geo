import React, { useEffect, useRef, useState } from 'react';
import { ProjectData, RESOLUTION_MAP } from '../types';
import { renderHighResCanvas, downloadCanvasImage } from '../utils/canvasRenderer';
import {
  ExternalLink,
  Download,
  Copy,
  Check,
  Maximize2,
  RefreshCw,
  MapPin,
  X,
  FileDown,
  Image as ImageIcon,
  FileText,
  Eye
} from 'lucide-react';
import { PdfLivePreview } from './PdfLivePreview';
import { DownloadModalData } from './DownloadReadyModal';

interface CanvasPreviewProps {
  project: ProjectData;
  onUpdate: (updater: (prev: ProjectData) => ProjectData) => void;
  isGenerating?: boolean;
  onDownloadReady?: (data: DownloadModalData) => void;
  onExportPdf?: () => void;
  isExportingPdf?: boolean;
  pdfProgressPercent?: number;
}

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  project,
  onUpdate,
  onDownloadReady,
  onExportPdf,
  isExportingPdf,
  pdfProgressPercent
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'photo' | 'pdf'>('photo');

  // Render on preview canvas whenever project changes
  useEffect(() => {
    let isCancelled = false;

    async function updatePreview() {
      try {
        setRenderError(null);
        // Render clean image preview at 1920x1080 without HUD overlays
        const rendered = await renderHighResCanvas({ ...project, layout: 'clean-photo' }, 1920, 1080);
        if (isCancelled) return;

        const container = containerRef.current;
        if (container) {
          container.innerHTML = '';
          rendered.style.width = '100%';
          rendered.style.height = '100%';
          rendered.style.objectFit = 'contain';
          rendered.style.display = 'block';
          rendered.className = 'w-full h-full rounded-lg shadow-sm border border-slate-200';
          container.appendChild(rendered);
          canvasRef.current = rendered;
        }
      } catch (err: unknown) {
        console.error('Preview render error', err);
        if (!isCancelled) {
          const msg = err instanceof Error ? err.message : 'Error rendering preview';
          setRenderError(msg);
        }
      }
    }

    updatePreview();

    return () => {
      isCancelled = true;
    };
  }, [project]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const resConfig = RESOLUTION_MAP[project.exportResolution];
      const fullCanvas = await renderHighResCanvas(
        { ...project, layout: 'clean-photo' },
        resConfig.width,
        resConfig.height
      );

      const safeTitle = (project.title || 'geospec')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const filename = `${safeTitle}-${resConfig.width}x${resConfig.height}.${project.exportFormat}`;

      const result = await downloadCanvasImage(fullCanvas, filename, project.exportFormat);
      if (onDownloadReady) {
        onDownloadReady({
          title: `Imagen en Alta Resolución (${resConfig.width}×${resConfig.height})`,
          filename: result.filename,
          url: result.blobUrl || result.dataUrl,
          type: 'image',
          sizeFormatted: `${Math.round(result.sizeBytes / 1024)} KB`,
          blob: result.blob
        });
      }
    } catch (e) {
      console.error('Download failed', e);
    } finally {
      setDownloading(false);
    }
  };

  const handleCopyToClipboard = async () => {
    if (!canvasRef.current) return;
    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ]);
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        } catch (clipErr) {
          console.warn('Clipboard write failed', clipErr);
        }
      }, 'image/png');
    } catch (e) {
      console.error('Could not copy canvas', e);
    }
  };

  const resInfo = RESOLUTION_MAP[project.exportResolution];

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col gap-3">
      {/* Top Switcher: 1. Fotografía HD vs 2. Ficha PDF en Vivo */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/80 shadow-2xs">
          <button
            type="button"
            onClick={() => setViewMode('photo')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'photo'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>1. Fotografía HD</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('pdf')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'pdf'
                ? 'bg-white text-slate-900 shadow-2xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>2. Ficha PDF (Documento Final)</span>
            <span className="w-1.5 h-1.5 rounded-full bg-[#e31b38]" />
          </button>
        </div>

        {viewMode === 'photo' ? (
          <button
            type="button"
            onClick={() => setViewMode('pdf')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            title="Ver cómo queda el documento final en PDF antes de descargarlo"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver Ficha PDF en Vivo</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setViewMode('photo')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <ImageIcon className="w-3.5 h-3.5 text-slate-500" />
            <span>Ajustar Fotografía</span>
          </button>
        )}
      </div>

      {viewMode === 'pdf' ? (
        <PdfLivePreview
          project={project}
          onDownloadPdf={onExportPdf}
          isExportingPdf={isExportingPdf}
          pdfProgressPercent={pdfProgressPercent}
        />
      ) : (
        <>
          {/* Top Header Controls - Minimalist White Theme */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 tracking-tight">
                Vista Previa de Fotografía
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-mono text-slate-500 text-[11px]">
                {resInfo.width} × {resInfo.height} px
              </span>
              <span className="text-slate-300">·</span>
              <span className="text-slate-600 text-[11px] font-medium bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                Encuadre Limpio
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {project.googleMapsUrl && (
                <a
                  href={project.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
                  title="Abrir ubicación en Google Maps directamente"
                >
                  <MapPin className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Google Maps</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              )}

              <button
                onClick={handleCopyToClipboard}
                type="button"
                className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-colors cursor-pointer"
                title="Copiar imagen al portapapeles"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">Copiada</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span className="hidden sm:inline">Copiar</span>
                  </>
                )}
              </button>

              <button
                onClick={() => setFullscreen(true)}
                type="button"
                className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Ver en pantalla completa"
              >
                <Maximize2 className="w-4 h-4" />
              </button>

              {/* Direct High-Res Image Download Button */}
              <button
                onClick={handleDownload}
                disabled={downloading}
                type="button"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 active:scale-95 px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
                title="Descargar imagen en alta resolución (1920x1080)"
              >
                {downloading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
                    <span>Generando...</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Descargar Imagen</span>
                  </>
                )}
              </button>

              {/* Direct PDF Download Button (Careful Red Accent CTA) */}
              {onExportPdf && (
                <button
                  onClick={onExportPdf}
                  disabled={isExportingPdf}
                  type="button"
                  className="relative overflow-hidden inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-white bg-[#e31b38] hover:bg-[#c9152e] active:scale-95 px-3 py-1.5 rounded-lg shadow-2xs transition-all cursor-pointer disabled:cursor-wait whitespace-nowrap"
                  title="Generar y descargar Ficha Técnica en PDF"
                >
                  {isExportingPdf && pdfProgressPercent !== undefined && (
                    <div
                      className="absolute inset-y-0 left-0 bg-white/25 transition-all duration-300 ease-out"
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
                        <FileDown className="w-3.5 h-3.5" />
                        <span>Descargar PDF</span>
                      </>
                    )}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Canvas Viewport Frame - Pure Clean White Workbench */}
          <div className="relative group w-full bg-white rounded-2xl border border-slate-200/90 p-2 overflow-hidden shadow-xs">
            <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-slate-100 flex items-center justify-center">
              {/* Canvas container element */}
              <div ref={containerRef} className="w-full h-full flex items-center justify-center" />

              {/* Fallback error if any */}
              {renderError && (
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center p-6 text-center z-10">
                  <p className="text-slate-800 text-sm font-semibold">{renderError}</p>
                  <p className="text-xs text-slate-500 mt-1">Revisa que la imagen sea accesible</p>
                </div>
              )}
            </div>

            {/* Minimal adjustments under the canvas: Zoom & Scrim */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
              <div className="flex items-center gap-4 flex-wrap">
                <label className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium text-[11px]">Encuadre:</span>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdate((prev) => ({
                        ...prev,
                        imageFit: prev.imageFit === 'cover' ? 'contain' : 'cover'
                      }))
                    }
                    className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    {project.imageFit === 'cover' ? 'Llenar Cuadro' : 'Contener'}
                  </button>
                </label>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium text-[11px]">Zoom:</span>
                  <input
                    type="range"
                    min="1"
                    max="2"
                    step="0.05"
                    value={project.imageZoom}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        imageZoom: parseFloat(e.target.value)
                      }))
                    }
                    className="w-20 accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-slate-700 text-xs font-semibold w-9">
                    {Math.round(project.imageZoom * 100)}%
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-medium text-[11px]">Contraste:</span>
                  <input
                    type="range"
                    min="0"
                    max="75"
                    step="5"
                    value={project.darkScrim}
                    onChange={(e) =>
                      onUpdate((prev) => ({
                        ...prev,
                        darkScrim: parseInt(e.target.value, 10)
                      }))
                    }
                    className="w-20 accent-slate-900 h-1.5 bg-slate-200 rounded-lg cursor-pointer"
                  />
                  <span className="font-mono text-slate-700 text-xs font-semibold w-7">{project.darkScrim}%</span>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Ficha técnica en alta resolución
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fullscreen Modal View */}
      {fullscreen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-6xl bg-white rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            <div className="p-3 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-[#e31b38]" />
                <span className="text-xs font-bold text-slate-900">
                  {project.title} · {project.code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFullscreen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 bg-white flex items-center justify-center">
              {canvasRef.current && (
                <img
                  src={canvasRef.current.toDataURL()}
                  alt="Full preview"
                  className="max-h-[80vh] w-auto object-contain rounded-lg shadow-md border border-slate-200"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
