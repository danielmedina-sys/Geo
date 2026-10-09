import React, { useState, useRef } from 'react';
import { ProjectData } from '../types';
import {
  Search,
  Plus,
  Copy,
  Trash2,
  FileDown,
  Layers,
  CheckCircle,
  ExternalLink,
  MapPin,
  Sparkles,
  QrCode,
  Download,
  Upload,
  Database
} from 'lucide-react';
import { exportUnitsToPDF } from '../utils/pdfGenerator';
import { exportAllUnitsJSON, importUnitsJSON } from '../utils/storage';
import { saveFileToDisk } from '../utils/downloadHelper';
import { DownloadModalData } from './DownloadReadyModal';

interface UnitsCatalogManagerProps {
  units: ProjectData[];
  activeUnitId: string;
  onSelectUnit: (unit: ProjectData) => void;
  onCreateNewUnit: () => void;
  onDuplicateUnit: (unit: ProjectData) => void;
  onDeleteUnit: (id: string) => void;
  onUnitsReloaded?: (updatedUnits: ProjectData[]) => void;
  onDownloadReady?: (data: DownloadModalData) => void;
  activeProject: ProjectData;
}

export const UnitsCatalogManager: React.FC<UnitsCatalogManagerProps> = ({
  units,
  activeUnitId,
  onSelectUnit,
  onCreateNewUnit,
  onDuplicateUnit,
  onDeleteUnit,
  onUnitsReloaded,
  onDownloadReady,
  activeProject
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [pdfProgressText, setPdfProgressText] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [unitPendingDelete, setUnitPendingDelete] = useState<ProjectData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 3500);
  };

  // Filter units by Code, Title, or Address
  const filteredUnits = units.filter((u) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    const codeMatch = (u.code || '').toLowerCase().includes(q);
    const titleMatch = (u.title || '').toLowerCase().includes(q);
    const addrMatch = (u.address || '').toLowerCase().includes(q);
    return codeMatch || titleMatch || addrMatch;
  });

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && filteredUnits.length > 0) {
      onSelectUnit(filteredUnits[0]);
      showFeedback(`Unidad [${filteredUnits[0].code || filteredUnits[0].title}] cargada al instante`);
    }
  };

  const handleExportSinglePdf = async () => {
    setIsExportingPdf(true);
    setPdfProgressText('Generando PDF de ficha técnica individual...');
    try {
      const result = await exportUnitsToPDF([activeProject], {
        catalogTitle: `Ficha Técnica - ${activeProject.code || activeProject.title}`,
        includeCover: false,
        onProgress: (_cur, _tot, msg) => setPdfProgressText(msg)
      });
      if (onDownloadReady) {
        onDownloadReady({
          title: `Ficha Técnica - ${activeProject.code || activeProject.title}`,
          filename: result.filename,
          url: result.blobUrl || result.dataUri,
          type: 'pdf',
          sizeFormatted: `${Math.round(result.blob.size / 1024)} KB`,
          blob: result.blob
        });
      }
      showFeedback('Ficha PDF descargada con QR y enlaces a Google Maps');
    } catch (e) {
      console.error(e);
      showFeedback('Error al generar el PDF de la unidad');
    } finally {
      setIsExportingPdf(false);
      setPdfProgressText(null);
    }
  };

  const handleExportAllPdf = async () => {
    setIsExportingPdf(true);
    try {
      const result = await exportUnitsToPDF(units, {
        catalogTitle: 'Catálogo de Circuitos & Fichas Técnicas',
        includeCover: true,
        onProgress: (_cur, _tot, msg) => setPdfProgressText(msg)
      });
      if (onDownloadReady) {
        onDownloadReady({
          title: `Catálogo Completo (${units.length} unidades)`,
          filename: result.filename,
          url: result.blobUrl || result.dataUri,
          type: 'pdf',
          sizeFormatted: `${Math.round(result.blob.size / 1024)} KB`,
          blob: result.blob
        });
      }
      showFeedback(`Catálogo completo (${units.length} unidades) descargado en PDF`);
    } catch (e) {
      console.error(e);
      showFeedback('Error al generar el catálogo en PDF');
    } finally {
      setIsExportingPdf(false);
      setPdfProgressText(null);
    }
  };

  const handleBackupExportJSON = async () => {
    try {
      const jsonStr = await exportAllUnitsJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const filename = `respaldo-unidades-geospec-${Date.now()}.json`;
      await saveFileToDisk({
        filename,
        blob,
        mimeType: 'application/json'
      });
      showFeedback('Copia de seguridad descargada (formato JSON)');
    } catch (err) {
      console.error('Backup export failed', err);
      showFeedback('Error al exportar la base de datos');
    }
  };

  const handleRestoreJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const content = evt.target?.result as string;
        const restored = await importUnitsJSON(content);
        if (onUnitsReloaded) {
          onUnitsReloaded(restored);
        }
        if (restored.length > 0) {
          onSelectUnit(restored[0]);
        }
        showFeedback(`${restored.length} unidades importadas y guardadas`);
      } catch (err) {
        console.error('Restore error', err);
        alert('Archivo de respaldo JSON no válido.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-slate-200 shadow-sm flex flex-col gap-4">
      {/* Top Header: Title, Total Count, and Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Inventario de Unidades
              </h2>
              <span className="px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[11px] font-semibold text-slate-600 font-mono">
                {units.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Base de datos local guardada. Selecciona una unidad o busca por código.
            </p>
          </div>
        </div>

        {/* Global PDF, Backup and New Unit Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleExportSinglePdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition-colors cursor-pointer"
            title="Descargar solo la unidad activa actual en PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-500" />
            <span>Ficha PDF</span>
          </button>

          <button
            type="button"
            onClick={handleExportAllPdf}
            disabled={isExportingPdf}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors cursor-pointer"
            title="Generar catálogo completo multipágina con todas las unidades en PDF"
          >
            <FileDown className="w-3.5 h-3.5 text-slate-400" />
            <span>Catálogo Completo ({units.length})</span>
          </button>

          <button
            type="button"
            onClick={handleBackupExportJSON}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Exportar respaldo de todas las unidades en formato JSON"
          >
            <Download className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Respaldo</span>
          </button>

          <label
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            title="Importar unidades desde archivo JSON"
          >
            <Upload className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Importar</span>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleRestoreJSON}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={onCreateNewUnit}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#e31b38] hover:bg-[#c9152e] rounded-lg shadow-2xs transition-all active:scale-95 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva Unidad</span>
          </button>
        </div>
      </div>

      {/* Search Input Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          placeholder="Buscar por código de unidad (ej. CCS-OUT-084B), título o dirección... Presiona [Enter] para cargar"
          className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-slate-800 focus:outline-none rounded-xl pl-9 pr-20 py-2 text-xs text-slate-900 placeholder:text-slate-400 font-medium transition-all shadow-2xs"
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-1">
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="px-2 text-xs font-medium text-slate-400 hover:text-slate-700 cursor-pointer"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Instant Search Hint */}
      {searchQuery && filteredUnits.length > 0 && (
        <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
          <span>
            {filteredUnits.length} {filteredUnits.length === 1 ? 'coincidencia encontrada' : 'coincidencias encontradas'}.
          </span>
          <span className="font-medium text-slate-700">
            Presiona [Enter] para abrir: <strong className="font-mono text-slate-900">{filteredUnits[0].code || filteredUnits[0].title}</strong>
          </span>
        </div>
      )}

      {/* Progress or Feedback Alert */}
      {pdfProgressText && (
        <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800 font-medium flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-slate-600 animate-spin" />
          <span>{pdfProgressText}</span>
        </div>
      )}

      {feedback && (
        <div className="p-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-800 font-medium flex items-center gap-2">
          <CheckCircle className="w-3.5 h-3.5 text-slate-700" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Unit Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[360px] overflow-y-auto pr-1">
        {filteredUnits.length === 0 ? (
          <div className="col-span-full p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-xl">
            <Search className="w-5 h-5 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No se encontró ninguna unidad con el código "{searchQuery}"</p>
            <p className="text-[11px] text-slate-500 mt-1">Verifica el código o crea una nueva unidad.</p>
          </div>
        ) : (
          filteredUnits.map((unit) => {
            const isActive = unit.id === activeUnitId;
            return (
              <div
                key={unit.id}
                onClick={() => onSelectUnit(unit)}
                className={`group relative text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 ${
                  isActive
                    ? 'border-slate-900 bg-white ring-1 ring-slate-900/10 shadow-xs'
                    : 'border-slate-200 bg-white hover:bg-slate-50/60 hover:border-slate-300'
                }`}
              >
                {/* Top Info: Code Badge & Actions */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#e31b38]" title="Unidad activa actual" />
                    )}
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200/80 text-slate-800">
                      {unit.code || 'SIN CÓDIGO'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDuplicateUnit(unit);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                      title="Duplicar unidad"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUnitPendingDelete(unit);
                      }}
                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                      title={`Eliminar unidad ${unit.code || unit.title}`}
                      aria-label="Eliminar unidad"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Thumbnail & Title preview */}
                <div className="flex items-center gap-2.5">
                  <div className="w-13 h-9 rounded-md overflow-hidden bg-slate-100 shrink-0 border border-slate-200">
                    {unit.imageSrc ? (
                      <img
                        src={unit.imageSrc}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-slate-400">
                        Foto
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-semibold text-slate-900 truncate">
                      {unit.title}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>{unit.address || 'Sin dirección cargada'}</span>
                    </p>
                  </div>
                </div>

                {/* Footer of Card */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[11px] text-slate-500">
                  <span className="flex items-center gap-1 font-mono text-[10px]">
                    <QrCode className="w-3 h-3 text-slate-400" />
                    <span>{unit.showQrCode ? 'QR Activo' : 'Sin QR'}</span>
                  </span>

                  {unit.googleMapsUrl && (
                    <a
                      href={unit.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-0.5"
                    >
                      <span>Maps</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* In-app Confirmation Modal for Deleting Unit (Bypasses iframe alert/confirm sandbox restrictions) */}
      {unitPendingDelete && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-sm w-full p-6 flex flex-col gap-4 text-center animate-in zoom-in-95">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center mx-auto text-[#e31b38] shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                ¿Eliminar esta unidad?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Se eliminará <strong className="font-mono text-slate-900">[{unitPendingDelete.code || unitPendingDelete.title}]</strong> de tu inventario local.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUnitPendingDelete(null)}
                className="flex-1 px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = unitPendingDelete.id!;
                  setUnitPendingDelete(null);
                  onDeleteUnit(idToDelete);
                  showFeedback('Unidad eliminada con éxito');
                }}
                className="flex-1 px-4 py-2.5 text-xs font-extrabold text-white bg-[#e31b38] hover:bg-[#c4152e] active:scale-95 rounded-xl shadow-xs transition-all cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
