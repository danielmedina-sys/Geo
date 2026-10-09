import React, { useRef, useState, useEffect } from 'react';
import { ProjectData, CompanyBrandConfig } from '../types';
import {
  getSavedCompanySettings,
  saveCompanySettings,
  applyCompanyBrandingToAllUnits
} from '../utils/storage';
import { ENFOQUE_LOGO_DATA_URL } from '../assets/enfoqueLogoData';
import {
  Building2,
  Upload,
  Check,
  RotateCcw,
  Trash2,
  Clipboard,
  Layers,
  CheckCircle2,
  Info
} from 'lucide-react';

interface CompanySettingsPanelProps {
  currentProject: ProjectData;
  onUpdateProject: (updater: (prev: ProjectData) => ProjectData) => void;
  allUnitsCount: number;
  onAllUnitsUpdated?: (updatedUnits: ProjectData[]) => void;
  onShowToast: (message: string) => void;
}

export const CompanySettingsPanel: React.FC<CompanySettingsPanelProps> = ({
  currentProject,
  onUpdateProject,
  allUnitsCount,
  onAllUnitsUpdated,
  onShowToast
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isApplyingAll, setIsApplyingAll] = useState(false);

  // Current company defaults state
  const [config, setConfig] = useState<CompanyBrandConfig>(() => getSavedCompanySettings());

  // Keep in sync with project if project was loaded with specific company
  useEffect(() => {
    // If config has values, ensure default is initialized
  }, []);

  const handleProcessFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor selecciona un archivo de imagen válido (PNG, SVG, JPG, WebP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const updatedConfig: CompanyBrandConfig = {
        ...config,
        logoSrc: dataUrl,
        logoName: file.name
      };
      setConfig(updatedConfig);
      saveCompanySettings(updatedConfig);

      // Auto update current project too
      onUpdateProject((prev) => ({
        ...prev,
        logoSrc: dataUrl,
        logoName: file.name,
        companyName: updatedConfig.companyName,
        showLogo: updatedConfig.showLogo,
        logoPosition: updatedConfig.logoPosition
      }));

      setFeedback('Logotipo actualizado y guardado como predeterminado');
      onShowToast('Logotipo guardado como predeterminado para nuevas unidades');
      setTimeout(() => setFeedback(null), 3500);
    };
    reader.readAsDataURL(file);
  };

  const handlePasteClipboard = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((t) => t.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'logotipo-portapapeles.png', { type: imageType });
          handleProcessFile(file);
          return;
        }
      }
      alert('No se encontró ninguna imagen en el portapapeles. Copia una imagen de tu logo primero.');
    } catch {
      alert('Para pegar imágenes, concede los permisos de portapapeles en el navegador.');
    }
  };

  const handleResetToOfficialEnfoque = () => {
    const updatedConfig: CompanyBrandConfig = {
      ...config,
      companyName: 'ENFOQUE',
      logoSrc: ENFOQUE_LOGO_DATA_URL,
      logoName: 'Logo Enfoque oficial.png',
      showLogo: true,
      accentColor: '#e31b38'
    };
    setConfig(updatedConfig);
    saveCompanySettings(updatedConfig);

    onUpdateProject((prev) => ({
      ...prev,
      companyName: 'ENFOQUE',
      logoSrc: ENFOQUE_LOGO_DATA_URL,
      logoName: 'Logo Enfoque oficial.png',
      showLogo: true,
      accentColor: '#e31b38'
    }));

    setFeedback('Restablecido a Enfoque oficial');
    onShowToast('Restablecido a logotipo y datos oficiales de Enfoque');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleRemoveLogo = () => {
    const updatedConfig: CompanyBrandConfig = {
      ...config,
      logoSrc: '',
      logoName: '',
      showLogo: false
    };
    setConfig(updatedConfig);
    saveCompanySettings(updatedConfig);

    onUpdateProject((prev) => ({
      ...prev,
      logoSrc: '',
      logoName: '',
      showLogo: false
    }));

    setFeedback('Logotipo eliminado');
    onShowToast('Logotipo removido de los valores predeterminados');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleShowLogoToggle = (checked: boolean) => {
    const updatedConfig: CompanyBrandConfig = {
      ...config,
      showLogo: checked
    };
    setConfig(updatedConfig);
    saveCompanySettings(updatedConfig);

    onUpdateProject((prev) => ({
      ...prev,
      showLogo: checked
    }));
  };

  const handleSaveAsDefault = () => {
    saveCompanySettings(config);
    onShowToast('Configuración de logotipo guardada como predeterminada');
    setFeedback('Guardado con éxito');
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleApplyToAllUnits = async () => {
    if (
      !confirm(
        `¿Deseas aplicar este logotipo predeterminado a TODAS las ${allUnitsCount} unidades del catálogo actual?`
      )
    ) {
      return;
    }

    setIsApplyingAll(true);
    try {
      saveCompanySettings(config);
      const updatedList = await applyCompanyBrandingToAllUnits(config);
      if (onAllUnitsUpdated) {
        onAllUnitsUpdated(updatedList);
      }
      onShowToast(`Se actualizó el logotipo en las ${updatedList.length} unidades del catálogo`);
      setFeedback(`Aplicado a ${updatedList.length} unidades`);
      setTimeout(() => setFeedback(null), 3500);
    } catch (err) {
      console.error(err);
      alert('Ocurrió un error al actualizar las unidades.');
    } finally {
      setIsApplyingAll(false);
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Panel Header */}
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-slate-900 text-white rounded-lg shadow-2xs">
              <Building2 className="w-4 h-4" />
            </span>
            <h3 className="text-sm font-bold text-slate-900">
              5. Configuración de Logotipo Predeterminado
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Define una sola vez el logotipo de tu empresa. Se aplicará automáticamente a cada nueva unidad creada.
          </p>
        </div>

        {feedback && (
          <span className="text-xs text-emerald-700 flex items-center gap-1 font-medium bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 shrink-0">
            <Check className="w-3.5 h-3.5 text-emerald-600" />
            {feedback}
          </span>
        )}
      </div>

      {/* Auto-apply Information Callout */}
      <div className="flex items-start gap-2.5 bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-600">
        <Info className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold text-slate-800">Aplicación automática permanente:</span> El logotipo configurado aquí se guarda en tu navegador y se asignará por defecto a todas las nuevas fichas publicitarias que crees en el catálogo.
        </div>
      </div>

      {/* Default Logo Upload & Preview */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col gap-3.5">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-xs font-bold text-slate-800">
              Logotipo Predeterminado
            </label>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Se recomienda formato PNG con fondo transparente o SVG vectorial.
            </p>
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={config.showLogo}
              onChange={(e) => handleShowLogoToggle(e.target.checked)}
              className="rounded border-slate-300 text-slate-900 focus:ring-slate-900 w-3.5 h-3.5 cursor-pointer"
            />
            <span>Mostrar logotipo</span>
          </label>
        </div>

        {/* Logo Preview Area */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
          {/* Logo visual badge preview */}
          <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 rounded-xl border border-slate-200 bg-slate-100/50 min-h-[110px] relative overflow-hidden">
            {/* Transparent checkerboard pattern */}
            <div
              className="absolute inset-0 opacity-15 pointer-events-none"
              style={{
                backgroundImage: `radial-gradient(#94a3b8 1px, transparent 1px)`,
                backgroundSize: '8px 8px'
              }}
            />

            {config.logoSrc ? (
              <div className="relative z-10 flex flex-col items-center gap-1.5 max-w-full">
                <img
                  src={config.logoSrc}
                  alt="Logotipo de la empresa"
                  className="max-h-16 max-w-[170px] object-contain drop-shadow-2xs transition-transform hover:scale-105"
                />
                <span className="text-[10px] text-slate-400 font-mono truncate max-w-[150px]">
                  {config.logoName || 'logotipo.png'}
                </span>
              </div>
            ) : (
              <div className="relative z-10 flex flex-col items-center gap-1 text-slate-400">
                <Building2 className="w-6 h-6 stroke-[1.5]" />
                <span className="text-[11px] font-medium">Sin logotipo asignado</span>
              </div>
            )}
          </div>

          {/* Upload / Action Controls */}
          <div className="sm:col-span-7 flex flex-col gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleProcessFile(e.target.files[0]);
                }
              }}
            />

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                  handleProcessFile(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-3 text-center cursor-pointer transition-all flex items-center justify-center gap-2 ${
                isDragging
                  ? 'border-slate-900 bg-slate-50 ring-2 ring-slate-900/10'
                  : 'border-slate-200 hover:border-slate-400 bg-slate-50/70 hover:bg-slate-50'
              }`}
            >
              <Upload className="w-3.5 h-3.5 text-slate-600" />
              <span className="text-xs font-semibold text-slate-700">
                Subir nuevo archivo de logo
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Pegar imagen desde el portapapeles"
              >
                <Clipboard className="w-3 h-3 text-slate-500" />
                <span>Pegar (Ctrl+V)</span>
              </button>

              <button
                type="button"
                onClick={handleResetToOfficialEnfoque}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg shadow-2xs transition-colors cursor-pointer"
                title="Restablecer logotipo predeterminado oficial de Enfoque Medios"
              >
                <RotateCcw className="w-3 h-3 text-slate-500" />
                <span>Logo Enfoque</span>
              </button>
            </div>

            {config.logoSrc && (
              <button
                type="button"
                onClick={handleRemoveLogo}
                className="flex items-center justify-center gap-1.5 px-2.5 py-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium rounded-lg transition-colors cursor-pointer mt-0.5"
              >
                <Trash2 className="w-3 h-3" />
                <span>Quitar logotipo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Global Sync Actions */}
      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex flex-col gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
          <Layers className="w-4 h-4 text-slate-600" />
          <span>Sincronización con el Catálogo</span>
        </div>

        <p className="text-xs text-slate-500">
          Actualmente tienes <strong className="text-slate-800">{allUnitsCount}</strong> {allUnitsCount === 1 ? 'unidad' : 'unidades'} en tu catálogo. Puedes sincronizar el logotipo predeterminado con todas las unidades existentes:
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <button
            type="button"
            onClick={handleApplyToAllUnits}
            disabled={isApplyingAll}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl shadow-2xs transition-all cursor-pointer disabled:opacity-60"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Aplicar a todas las unidades ({allUnitsCount})</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAsDefault}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <span>Guardar Ajustes</span>
          </button>
        </div>
      </div>
    </div>
  );
};
