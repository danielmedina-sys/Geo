import React, { useState } from 'react';
import { ProjectData } from '../types';
import { renderHighResCanvas, downloadCanvasImage } from '../utils/canvasRenderer';
import { exportUnitsToPDF } from '../utils/pdfGenerator';
import {
  FileDown,
  Download,
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { DownloadModalData } from './DownloadReadyModal';

interface ExportControlsProps {
  project: ProjectData;
  onUpdate: (updater: (prev: ProjectData) => ProjectData) => void;
  allUnits?: ProjectData[];
  onDownloadReady?: (data: DownloadModalData) => void;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  project,
  allUnits = [],
  onDownloadReady
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isPdfExporting, setIsPdfExporting] = useState(false);
  const [pdfProgress, setPdfProgress] = useState<string | null>(null);
  const [pdfProgressPercent, setPdfProgressPercent] = useState<number>(0);
  const [downloadSuccess, setDownloadSuccess] = useState<{
    filename: string;
    sizeKb: number;
    type: 'img' | 'pdf';
  } | null>(null);

  const handleExportSinglePdf = async () => {
    setIsPdfExporting(true);
    setDownloadSuccess(null);
    setPdfProgress('Iniciando generación de PDF...');
    setPdfProgressPercent(5);
    try {
      const result = await exportUnitsToPDF([project], {
        catalogTitle: `Ficha Técnica - ${project.code || project.title}`,
        includeCover: false,
        onProgress: (_c, _t, msg, percent) => {
          setPdfProgress(msg);
          setPdfProgressPercent(percent);
        }
      });
      setPdfProgressPercent(100);
      setPdfProgress('¡Documento PDF listo!');

      const sizeKb = Math.round(result.blob.size / 1024);
      setDownloadSuccess({
        filename: result.filename,
        sizeKb,
        type: 'pdf'
      });

      if (onDownloadReady) {
        onDownloadReady({
          title: `Ficha Técnica en PDF - ${project.code || project.title}`,
          filename: result.filename,
          url: result.blobUrl || result.dataUri,
          type: 'pdf',
          sizeFormatted: `${sizeKb} KB`,
          blob: result.blob,
          serverDownloadUrl: result.serverDownloadUrl,
          serverViewUrl: result.serverViewUrl
        });
      }

      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (e) {
      console.error('PDF export failed', e);
    } finally {
      setTimeout(() => {
        setIsPdfExporting(false);
        setPdfProgress(null);
        setPdfProgressPercent(0);
      }, 1200);
    }
  };

  const handleExportAllPdf = async () => {
    if (allUnits.length === 0) return;
    setIsPdfExporting(true);
    setDownloadSuccess(null);
    setPdfProgress(`Preparando catálogo (${allUnits.length} unidades)...`);
    setPdfProgressPercent(5);
    try {
      const result = await exportUnitsToPDF(allUnits, {
        catalogTitle: 'Catálogo de Circuitos & Fichas Técnicas',
        includeCover: true,
        onProgress: (_c, _t, msg, percent) => {
          setPdfProgress(msg);
          setPdfProgressPercent(percent);
        }
      });
      setPdfProgressPercent(100);
      setPdfProgress('¡Catálogo descargado con éxito!');

      const sizeKb = Math.round(result.blob.size / 1024);
      setDownloadSuccess({
        filename: result.filename,
        sizeKb,
        type: 'pdf'
      });

      if (onDownloadReady) {
        onDownloadReady({
          title: `Catálogo Completo en PDF (${allUnits.length} unidades)`,
          filename: result.filename,
          url: result.blobUrl || result.dataUri,
          type: 'pdf',
          sizeFormatted: `${sizeKb} KB`,
          blob: result.blob,
          serverDownloadUrl: result.serverDownloadUrl,
          serverViewUrl: result.serverViewUrl
        });
      }

      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (e) {
      console.error('Catalog PDF export failed', e);
    } finally {
      setTimeout(() => {
        setIsPdfExporting(false);
        setPdfProgress(null);
        setPdfProgressPercent(0);
      }, 1200);
    }
  };

  const handleExportImage = async () => {
    setIsExporting(true);
    setDownloadSuccess(null);

    try {
      const width = 1920;
      const height = 1080;
      const canvas = await renderHighResCanvas(project, width, height);

      const safeTitle = (project.title || 'ficha-tecnica')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const filename = `${safeTitle}-${width}x${height}.png`;

      const result = await downloadCanvasImage(canvas, filename, 'png');

      const sizeKb = Math.round(result.sizeBytes / 1024);
      setDownloadSuccess({
        filename,
        sizeKb,
        type: 'img'
      });

      if (onDownloadReady) {
        onDownloadReady({
          title: `Imagen en Alta Resolución (${width}×${height})`,
          filename: result.filename,
          url: result.blobUrl || result.dataUrl,
          type: 'image',
          sizeFormatted: `${sizeKb} KB`,
          blob: result.blob
        });
      }

      setTimeout(() => setDownloadSuccess(null), 5000);
    } catch (err) {
      console.error('Export error', err);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
      {/* Minimal Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileDown className="w-4 h-4 text-[#e31b38]" />
            Generador & Descarga de Ficha PDF
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Genera el documento PDF oficial en fondo blanco corporativo con imagen en alta resolución y enlace interactivo directo a Google Maps.
          </p>
        </div>

        {/* Minimal Actions */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Main PDF button with visual progress bar */}
          <button
            type="button"
            onClick={handleExportSinglePdf}
            disabled={isPdfExporting}
            className="relative overflow-hidden flex items-center justify-center gap-2 min-w-[220px] px-5 py-3 bg-[#e31b38] hover:bg-[#c4152e] active:scale-98 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer disabled:cursor-wait"
            title="Generar y descargar la ficha técnica individual en PDF"
          >
            {/* Visual Progress Bar Fill */}
            {isPdfExporting && (
              <div
                className="absolute inset-y-0 left-0 bg-white/25 transition-all duration-300 ease-out"
                style={{ width: `${pdfProgressPercent}%` }}
              />
            )}
            {/* Bottom Progress Accent Strip */}
            {isPdfExporting && (
              <div
                className="absolute bottom-0 left-0 h-1 bg-white shadow-xs transition-all duration-300 ease-out"
                style={{ width: `${pdfProgressPercent}%` }}
              />
            )}

            <span className="relative z-10 flex items-center gap-2">
              {isPdfExporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span className="font-mono text-xs">{pdfProgressPercent}%</span>
                  <span className="truncate max-w-[150px]">
                    {pdfProgressPercent === 100 ? '¡Descargado!' : 'Generando...'}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4 text-white" />
                  <span>Generar y Descargar Ficha PDF</span>
                </>
              )}
            </span>
          </button>

          {/* Catalog PDF button if multiple units */}
          {allUnits.length > 1 && (
            <button
              type="button"
              onClick={handleExportAllPdf}
              disabled={isPdfExporting}
              className="relative overflow-hidden flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-60"
              title="Generar catálogo completo con portada e índice"
            >
              {isPdfExporting && (
                <div
                  className="absolute inset-y-0 left-0 bg-white/15 transition-all duration-300 ease-out"
                  style={{ width: `${pdfProgressPercent}%` }}
                />
              )}
              <span className="relative z-10 flex items-center gap-2">
                <FileDown className="w-3.5 h-3.5 text-rose-400" />
                <span>Catálogo PDF ({allUnits.length})</span>
              </span>
            </button>
          )}

          {/* Quick Image Download */}
          <button
            type="button"
            onClick={handleExportImage}
            disabled={isExporting}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
            title="Descargar imagen en alta resolución (1920x1080)"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Descargar Imagen</span>
          </button>
        </div>
      </div>

      {/* Visual Live Progress Status Bar */}
      {isPdfExporting && pdfProgress && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-xl p-3.5 flex flex-col gap-2 animate-in fade-in">
          <div className="flex items-center justify-between text-xs text-[#e31b38] font-bold">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#e31b38]" />
              <span>{pdfProgress}</span>
            </div>
            <span className="font-mono text-xs">{pdfProgressPercent}%</span>
          </div>

          {/* Full-width Bar Track */}
          <div className="w-full h-2 bg-rose-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#e31b38] transition-all duration-300 ease-out rounded-full"
              style={{ width: `${pdfProgressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Success Notification Feedback */}
      {downloadSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between text-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-800">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <div>
              <span className="font-bold">
                {downloadSuccess.type === 'pdf'
                  ? '¡Documento PDF generado y descargado con éxito!'
                  : '¡Imagen descargada con éxito!'}
              </span>
              <p className="text-[11px] text-emerald-700 font-mono mt-0.5">
                {downloadSuccess.filename} ({downloadSuccess.sizeKb} KB)
              </p>
            </div>
          </div>
          <span className="text-[11px] text-emerald-600 font-medium hidden sm:inline">Listo para enviar o imprimir</span>
        </div>
      )}
    </div>
  );
};
