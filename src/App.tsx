/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { ProjectData } from './types';
import { CanvasPreview } from './components/CanvasPreview';
import { ImageUploader } from './components/ImageUploader';
import { LocationDetailsForm } from './components/LocationDetailsForm';
import { TechnicalSpecsForm } from './components/TechnicalSpecsForm';
import { ReachMetricsForm } from './components/ReachMetricsForm';
import { UnitsCatalogManager } from './components/UnitsCatalogManager';
import { CompanySettingsPanel } from './components/CompanySettingsPanel';
import { ENFOQUE_LOGO_DATA_URL } from './assets/enfoqueLogoData';
import { renderHighResCanvas, downloadCanvasImage } from './utils/canvasRenderer';
import { exportUnitsToPDF } from './utils/pdfGenerator';
import { initializeStorage, saveUnit, deleteUnit, getSavedCompanySettings } from './utils/storage';
import { RESOLUTION_MAP } from './types';
import { DownloadReadyModal, DownloadModalData } from './components/DownloadReadyModal';
import {
  ImageIcon,
  MapPin,
  SlidersHorizontal,
  TrendingUp,
  Download,
  CheckCircle,
  FileDown,
  Layers,
  RefreshCw,
  Building2
} from 'lucide-react';

export default function App() {
  const [units, setUnits] = useState<ProjectData[]>([]);
  const [activeUnitId, setActiveUnitId] = useState<string>('unit-1');
  const [showCatalog, setShowCatalog] = useState<boolean>(true);
  const [activeEditorTab, setActiveEditorTab] = useState<'photo' | 'location' | 'specs' | 'reach' | 'branding' | 'all'>('photo');
  const [isExportingHeader, setIsExportingHeader] = useState(false);
  const [isExportingPdfHeader, setIsExportingPdfHeader] = useState(false);
  const [pdfExportProgress, setPdfExportProgress] = useState<{ percent: number; status: string } | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [downloadModalData, setDownloadModalData] = useState<DownloadModalData | null>(null);

  // Active Project state with persisted company branding defaults
  const [project, setProject] = useState<ProjectData>(() => {
    const companyDefaults = getSavedCompanySettings();
    return {
      id: 'unit-1',
      title: 'Pantalla LED Digital - Distribuidor Altamira',
      subtitle: '',
      code: 'CCS-OUT-084B',
      address: 'Autopista Gran Cacique Guaicaipuro, Distribuidor Altamira, Caracas 1060',
      googleMapsUrl: 'https://www.google.com/maps/search/?api=1&query=Distribuidor+Altamira+Caracas',
      coordinates: '10.4938° N, 66.8519° W',
      companyName: companyDefaults.companyName || 'ENFOQUE',
      logoSrc: companyDefaults.logoSrc || ENFOQUE_LOGO_DATA_URL,
      logoName: companyDefaults.logoName || 'Logo Enfoque negro.png',
      showLogo: companyDefaults.showLogo !== undefined ? companyDefaults.showLogo : true,
      logoPosition: companyDefaults.logoPosition || 'top-left',
      accentColor: companyDefaults.accentColor || '#e31b38',
      imageSrc: '/src/assets/images/sample_billboard_urban_1790867094382.jpg',
      imageName: 'valla_led_distribuidor_altamira.jpg',
      imageFit: 'cover',
      imageZoom: 1,
      imagePanX: 0,
      imagePanY: 0,
      darkScrim: 25,
      specs: [
        { id: '1', label: 'Dimensiones', value: '14.00 m × 5.00 m (70 m²)', iconName: 'ruler' },
        { id: '2', label: 'Tecnología', value: 'Pantalla SMD LED P6.6 Outdoor Ultra-Bright', iconName: 'cpu' },
        { id: '3', label: 'Flujo Vehicular', value: '115,000 vehículos / día promedio', iconName: 'users' },
        { id: '4', label: 'Iluminación / Brillo', value: '7,500 nits (Sensor Auto-Dimming 24/7)', iconName: 'zap' },
        { id: '5', label: 'Orientación', value: 'Frontal a tráfico Sentido Chacao - Petare', iconName: 'compass' },
        { id: '6', label: 'Disponibilidad', value: 'Slots de 10s · Rotación 6 marcas', iconName: 'calendar' }
      ],
      reach: {
        dailyImpressions: '185,000 impactos / día',
        monthlyImpressions: '5,550,000 impactos / mes',
        dailyVehicles: '115,000 vehículos / día promedio',
        pedestrianTraffic: '28,000 personas / día',
        targetAudience: 'Segmento ABC+ · Ejecutivos, Familias y Comercio',
        coverageZone: 'Eje Autopista Gran Cacique Guaicaipuro (Chacao - Altamira)',
        dwellTime: '12 - 18 seg promedio (Retención y semáforo)',
        pointsOfInterest: 'C.C. San Ignacio, Torre Cavendes, Hoteles, Plaza Altamira',
        showOnCanvas: true
      },
      layout: 'clean-photo',
      showQrCode: true,
      qrPosition: 'overlay-card',
      autoDownloadOnFinish: false,
      exportFormat: 'png',
      exportResolution: '1080p',
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  });

  const isInitialLoadRef = useRef(true);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Initialize IndexedDB on startup
  useEffect(() => {
    async function loadStoredUnits() {
      try {
        const stored = await initializeStorage();
        if (stored.length > 0) {
          const cleaned = stored.map((u) => ({ ...u, subtitle: '' }));
          setUnits(cleaned);
          const first = cleaned[0];
          setProject(first);
          setActiveUnitId(first.id || 'unit-1');
        }
      } catch (err) {
        console.error('Storage initialization failed', err);
      } finally {
        isInitialLoadRef.current = false;
      }
    }
    loadStoredUnits();
  }, []);

  // 2. Auto-save active project into IndexedDB (debounced)
  useEffect(() => {
    if (isInitialLoadRef.current) return;

    const timer = setTimeout(async () => {
      try {
        await saveUnit(project);
        setUnits((prev) => {
          const idx = prev.findIndex((u) => u.id === project.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = project;
            return copy;
          }
          return [project, ...prev];
        });
      } catch (e) {
        console.warn('Auto-save error', e);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [project]);

  // Keyboard shortcut Ctrl+S or Cmd+S to export high-res
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleQuickExport();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project]);

  const handleSelectUnit = (unit: ProjectData) => {
    setProject(unit);
    setActiveUnitId(unit.id || '');
    showToast(`Unidad "${unit.code || unit.title}" cargada`);
  };

  const handleCreateNewUnit = async () => {
    const newId = `unit-${Date.now()}`;
    const codeNum = units.length + 1;
    const companyDefaults = getSavedCompanySettings();
    const newUnit: ProjectData = {
      ...project,
      id: newId,
      code: `CCS-OUT-${String(codeNum).padStart(3, '0')}`,
      title: 'Nueva Ubicación Publicitaria',
      subtitle: '',
      address: 'Caracas, Venezuela',
      googleMapsUrl: 'https://www.google.com/maps',
      coordinates: '',
      companyName: companyDefaults.companyName,
      logoSrc: companyDefaults.logoSrc,
      logoName: companyDefaults.logoName,
      showLogo: companyDefaults.showLogo,
      logoPosition: companyDefaults.logoPosition,
      accentColor: companyDefaults.accentColor || '#e31b38',
      specs: [
        { id: '1', label: 'Dimensiones', value: '12.00 m × 4.00 m', iconName: 'ruler' },
        { id: '2', label: 'Formato', value: 'Valla Publicitaria / Pantalla', iconName: 'layers' },
        { id: '3', label: 'Iluminación', value: 'LED Integrada', iconName: 'zap' }
      ],
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveUnit(newUnit);
    setUnits((prev) => [newUnit, ...prev]);
    setProject(newUnit);
    setActiveUnitId(newId);
    showToast(`Nueva unidad creada con membrete de ${newUnit.companyName} (${newUnit.code})`);
  };

  const handleDuplicateUnit = async (sourceUnit: ProjectData) => {
    const newId = `unit-${Date.now()}`;
    const clonedUnit: ProjectData = {
      ...sourceUnit,
      id: newId,
      code: `${sourceUnit.code || 'UNIT'}-COPIA`,
      title: `${sourceUnit.title} (Copia)`,
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    await saveUnit(clonedUnit);
    setUnits((prev) => [clonedUnit, ...prev]);
    setProject(clonedUnit);
    setActiveUnitId(newId);
    showToast(`Unidad duplicada (${clonedUnit.code})`);
  };

  const handleDeleteUnit = async (id: string) => {
    await deleteUnit(id);
    const updated = units.filter((u) => u.id !== id);
    if (updated.length === 0) {
      const freshId = `unit-${Date.now()}`;
      const companyDefaults = getSavedCompanySettings();
      const freshUnit: ProjectData = {
        ...project,
        id: freshId,
        code: 'CCS-OUT-001',
        title: 'Nueva Ubicación Publicitaria',
        subtitle: '',
        address: 'Caracas, Venezuela',
        googleMapsUrl: 'https://www.google.com/maps',
        coordinates: '',
        companyName: companyDefaults.companyName,
        logoSrc: companyDefaults.logoSrc,
        logoName: companyDefaults.logoName,
        showLogo: companyDefaults.showLogo,
        logoPosition: companyDefaults.logoPosition,
        accentColor: companyDefaults.accentColor || '#e31b38',
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await saveUnit(freshUnit);
      setUnits([freshUnit]);
      setProject(freshUnit);
      setActiveUnitId(freshId);
    } else {
      setUnits(updated);
      if (activeUnitId === id) {
        setProject(updated[0]);
        setActiveUnitId(updated[0].id || '');
      }
    }
    showToast('Unidad eliminada del catálogo');
  };

  const handleQuickExport = async () => {
    setIsExportingHeader(true);
    try {
      const resConfig = RESOLUTION_MAP[project.exportResolution];
      const canvas = await renderHighResCanvas({ ...project, layout: 'clean-photo' }, resConfig.width, resConfig.height);
      const safeTitle = (project.title || 'geospec')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      const filename = `${safeTitle}-${resConfig.width}x${resConfig.height}.${project.exportFormat}`;
      const result = await downloadCanvasImage(canvas, filename, project.exportFormat);
      
      const sizeKb = Math.round(result.sizeBytes / 1024);
      setDownloadModalData({
        title: `Imagen en Alta Resolución (${resConfig.width}×${resConfig.height})`,
        filename: result.filename,
        url: result.blobUrl || result.dataUrl,
        type: 'image',
        sizeFormatted: `${sizeKb} KB`,
        blob: result.blob
      });
      showToast(`Descargado en alta resolución (${resConfig.width}×${resConfig.height})`);
    } catch (e) {
      console.error('Quick export error', e);
    } finally {
      setIsExportingHeader(false);
    }
  };

  const handleQuickPdfExport = async () => {
    setIsExportingPdfHeader(true);
    setPdfExportProgress({ percent: 5, status: 'Iniciando...' });
    try {
      const result = await exportUnitsToPDF([project], {
        catalogTitle: `Ficha Técnica - ${project.code || project.title}`,
        includeCover: false,
        onProgress: (_c, _t, status, percent) => {
          setPdfExportProgress({ percent, status });
        }
      });
      setPdfExportProgress({ percent: 100, status: '¡Listo!' });

      const sizeKb = Math.round(result.blob.size / 1024);
      setDownloadModalData({
        title: `Ficha Técnica en PDF - ${project.code || project.title}`,
        filename: result.filename,
        url: result.blobUrl || result.dataUri,
        type: 'pdf',
        sizeFormatted: `${sizeKb} KB`,
        blob: result.blob,
        serverDownloadUrl: result.serverDownloadUrl,
        serverViewUrl: result.serverViewUrl
      });
      showToast(`PDF de ${project.code || project.title} generado`);
    } catch (e) {
      console.error('Quick PDF export error', e);
    } finally {
      setTimeout(() => {
        setIsExportingPdfHeader(false);
        setPdfExportProgress(null);
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-slate-900 selection:text-white">
      {/* Minimalist Top Bar without logo clutter */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 md:px-6 py-2.5 flex items-center justify-between gap-4 shadow-2xs">
        {/* Brand: Clean Typography */}
        <div className="flex items-center gap-2.5 shrink-0">
          <span className="text-base font-black tracking-tight text-slate-900">
            GeoSpec
          </span>
          <span className="hidden sm:inline-block text-[11px] font-medium text-slate-400 border-l border-slate-200 pl-2.5">
            Fichas Técnicas OOH
          </span>
        </div>

        {/* Subtitle / Brand Info */}
        <div className="hidden lg:flex items-center gap-2 text-xs text-slate-500 font-medium shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-[#e31b38]" />
          <span>Editor de Fichas Técnicas & Ubicaciones</span>
        </div>

        {/* Direct Download Actions & Inventory */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Quick Company Branding Shortcut */}
          <button
            type="button"
            onClick={() => setActiveEditorTab('branding')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer shadow-2xs ${
              activeEditorTab === 'branding'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 hover:text-slate-900 hover:bg-slate-50 border-slate-200'
            }`}
            title="Configurar nombre de empresa y logotipo predeterminado"
          >
            {project.showLogo && project.logoSrc ? (
              <img src={project.logoSrc} alt="Logo" className="h-4 max-w-[50px] object-contain rounded-xs" />
            ) : (
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span className="hidden sm:inline-block max-w-[120px] truncate">
              {project.companyName || 'Empresa'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setShowCatalog(!showCatalog)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5 text-slate-500" />
            <span>Inventario ({units.length})</span>
          </button>

          <button
            type="button"
            onClick={handleQuickExport}
            disabled={isExportingHeader}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-50 active:scale-95 transition-all rounded-lg border border-slate-200 shadow-2xs cursor-pointer disabled:opacity-60 whitespace-nowrap"
            title="Descargar imagen en alta resolución (1920x1080)"
          >
            {isExportingHeader ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-500" />
            ) : (
              <Download className="w-3.5 h-3.5 text-slate-500" />
            )}
            <span>Descargar Imagen</span>
          </button>

          <button
            type="button"
            onClick={handleQuickPdfExport}
            disabled={isExportingPdfHeader}
            className="relative overflow-hidden flex items-center justify-center gap-2 min-w-[150px] px-4 py-1.5 text-xs font-semibold text-white bg-[#e31b38] hover:bg-[#c9152e] active:scale-95 transition-all rounded-lg shadow-2xs cursor-pointer disabled:cursor-wait whitespace-nowrap"
            title="Generar y descargar Ficha Técnica en PDF"
          >
            {/* Visual Progress Bar Fill inside Button */}
            {isExportingPdfHeader && pdfExportProgress && (
              <div
                className="absolute inset-y-0 left-0 bg-white/25 transition-all duration-300 ease-out"
                style={{ width: `${pdfExportProgress.percent}%` }}
              />
            )}

            <span className="relative z-10 flex items-center gap-1.5">
              {isExportingPdfHeader ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-white" />
                  <span className="font-mono text-xs">{pdfExportProgress?.percent ?? 0}%</span>
                  <span className="text-[11px] font-medium">
                    {pdfExportProgress?.percent === 100 ? '¡Listo!' : 'Generando...'}
                  </span>
                </>
              ) : (
                <>
                  <FileDown className="w-3.5 h-3.5" />
                  <span>Descargar PDF</span>
                </>
              )}
            </span>
          </button>
        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-[1560px] w-full mx-auto p-4 md:p-6 flex flex-col gap-5">
        {/* Toast Notification - Clean Dark Modern Style */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 bg-slate-900 border border-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Section 1: Multi-Unit Catalog & Instant Search by Code */}
        {showCatalog && (
          <section>
            <UnitsCatalogManager
              units={units}
              activeUnitId={activeUnitId}
              onSelectUnit={handleSelectUnit}
              onCreateNewUnit={handleCreateNewUnit}
              onDuplicateUnit={handleDuplicateUnit}
              onDeleteUnit={handleDeleteUnit}
              onUnitsReloaded={(newUnits) => setUnits(newUnits)}
              onDownloadReady={(data) => setDownloadModalData(data)}
              activeProject={project}
            />
          </section>
        )}

        {/* Split Grid: Canvas Viewport (Left) & Controls Hub (Right) */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          {/* Left Column: Canvas Viewport */}
          <section className="xl:col-span-7 flex flex-col gap-4 xl:sticky xl:top-20 z-10">
            <CanvasPreview
              project={project}
              onUpdate={setProject}
              onDownloadReady={(data) => setDownloadModalData(data)}
              onExportPdf={handleQuickPdfExport}
              isExportingPdf={isExportingPdfHeader}
              pdfProgressPercent={pdfExportProgress?.percent}
            />
          </section>

          {/* Right Column: Intuitive Segmented Inspector */}
          <section className="xl:col-span-5 flex flex-col gap-3">
            {/* Segmented Navigation Tab Bar */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl border border-slate-200/80 overflow-x-auto shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveEditorTab('photo')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeEditorTab === 'photo'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>1. Foto</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('location')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeEditorTab === 'location'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>2. Ubicación</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('specs')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeEditorTab === 'specs'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>3. Ficha Técnica</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('reach')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeEditorTab === 'reach'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>4. Alcance</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('branding')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeEditorTab === 'branding'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>5. Empresa / Marca</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveEditorTab('all')}
                className={`flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                  activeEditorTab === 'all'
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <span>Ver Todo</span>
              </button>
            </div>

            {/* Active Tab Panel Views */}
            {(activeEditorTab === 'photo' || activeEditorTab === 'all') && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <ImageUploader project={project} onUpdate={setProject} />
              </div>
            )}

            {(activeEditorTab === 'location' || activeEditorTab === 'all') && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <LocationDetailsForm project={project} onUpdate={setProject} />
              </div>
            )}

            {(activeEditorTab === 'specs' || activeEditorTab === 'all') && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <TechnicalSpecsForm
                  project={project}
                  onUpdate={setProject}
                  onOpenCompanySettings={() => setActiveEditorTab('branding')}
                />
              </div>
            )}

            {(activeEditorTab === 'reach' || activeEditorTab === 'all') && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <ReachMetricsForm project={project} onUpdate={setProject} />
              </div>
            )}

            {(activeEditorTab === 'branding' || activeEditorTab === 'all') && (
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                <CompanySettingsPanel
                  currentProject={project}
                  onUpdateProject={setProject}
                  allUnitsCount={units.length}
                  onAllUnitsUpdated={(newUnits) => setUnits(newUnits)}
                  onShowToast={showToast}
                />
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Clean Minimalist Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-6 text-center text-xs text-slate-400">
        GeoSpec · Editor de Fichas Técnicas & Ubicaciones OOH
      </footer>

      {/* Floating Download Direct Modal (guaranteed download in iframe environments) */}
      <DownloadReadyModal
        data={downloadModalData}
        onClose={() => setDownloadModalData(null)}
      />
    </div>
  );
}
