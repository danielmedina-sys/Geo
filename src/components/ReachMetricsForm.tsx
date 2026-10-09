import React, { useRef } from 'react';
import { ProjectData, ReachMetrics } from '../types';
import { REACH_TEMPLATES } from '../presets';
import { generateReachChartDataUrl } from '../utils/reachChartGenerator';
import {
  TrendingUp,
  Eye,
  Car,
  Users,
  Target,
  Clock,
  Map,
  Compass,
  Upload,
  Trash2,
  Sparkles,
  CheckCircle2,
  FileImage,
  Layers,
  RotateCcw
} from 'lucide-react';

interface ReachMetricsFormProps {
  project: ProjectData;
  onUpdate: (updater: (prev: ProjectData) => ProjectData) => void;
}

export const ReachMetricsForm: React.FC<ReachMetricsFormProps> = ({
  project,
  onUpdate
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const reach = project.reach || {};

  const handleUpdateField = (field: keyof ReachMetrics, value: any) => {
    onUpdate((prev) => ({
      ...prev,
      reach: {
        ...(prev.reach || {}),
        [field]: value
      }
    }));
  };

  const handleLoadPreset = (key: keyof typeof REACH_TEMPLATES) => {
    const template = REACH_TEMPLATES[key];
    if (!template) return;
    onUpdate((prev) => ({
      ...prev,
      reach: {
        ...(prev.reach || {}),
        ...template.data
      }
    }));
  };

  const handleGraphicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onUpdate((prev) => ({
          ...prev,
          reach: {
            ...(prev.reach || {}),
            graphicUrl: result,
            graphicName: file.name
          }
        }));
      }
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveGraphic = () => {
    onUpdate((prev) => ({
      ...prev,
      reach: {
        ...(prev.reach || {}),
        graphicUrl: undefined,
        graphicName: undefined
      }
    }));
  };

  const handleClearReach = () => {
    onUpdate((prev) => ({
      ...prev,
      reach: undefined
    }));
  };

  const hasReachData = Boolean(
    reach.dailyImpressions ||
    reach.dailyVehicles ||
    reach.monthlyImpressions ||
    reach.coverageZone ||
    reach.targetAudience
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-700" />
              4. Alcance & Métricas de Impacto
            </h3>
            {hasReachData && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <CheckCircle2 className="w-3 h-3 text-slate-600" />
                Registrado
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Carga y gestiona el flujo vehicular, impactos de audiencia, público objetivo y mapa de alcance.
          </p>
        </div>

        {hasReachData && (
          <button
            type="button"
            onClick={handleClearReach}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
            title="Limpiar datos de alcance"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Restablecer</span>
          </button>
        )}
      </div>

      {/* Preset Pack Quick Loaders */}
      <div className="flex flex-col gap-1.5 p-3 bg-slate-50/70 rounded-xl border border-slate-200/80">
        <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
          <Sparkles className="w-3.5 h-3.5 text-slate-400" />
          <span>Cargar paquete de alcance estimado:</span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {(Object.keys(REACH_TEMPLATES) as Array<keyof typeof REACH_TEMPLATES>).map((key) => {
            const t = REACH_TEMPLATES[key];
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleLoadPreset(key)}
                className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-400 text-slate-700 hover:text-slate-900 rounded-md text-xs font-medium transition-colors shadow-2xs cursor-pointer"
              >
                {t.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metric Input Fields Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
        {/* Daily Impressions */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            Impactos Diarios Estimados
          </label>
          <input
            type="text"
            value={reach.dailyImpressions || ''}
            onChange={(e) => handleUpdateField('dailyImpressions', e.target.value)}
            placeholder="ej. 185,000 impactos / día"
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800/10 focus:border-slate-800 shadow-2xs"
          />
        </div>

        {/* Monthly Impressions */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-700 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-slate-500" />
            Impactos Mensuales Totales
          </label>
          <input
            type="text"
            value={reach.monthlyImpressions || ''}
            onChange={(e) => handleUpdateField('monthlyImpressions', e.target.value)}
            placeholder="ej. 5,550,000 impactos / mes"
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800/10 focus:border-slate-800 shadow-2xs"
          />
        </div>

        {/* Daily Vehicles */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Car className="w-3.5 h-3.5 text-slate-500" />
            Flujo Vehicular Promedio
          </label>
          <input
            type="text"
            value={reach.dailyVehicles || ''}
            onChange={(e) => handleUpdateField('dailyVehicles', e.target.value)}
            placeholder="ej. 115,000 vehículos diarios"
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800/10 focus:border-slate-800 shadow-2xs"
          />
        </div>

        {/* Pedestrian Traffic */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-slate-500" />
            Flujo Peatonal Estimado
          </label>
          <input
            type="text"
            value={reach.pedestrianTraffic || ''}
            onChange={(e) => handleUpdateField('pedestrianTraffic', e.target.value)}
            placeholder="ej. 28,000 personas / día"
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800/10 focus:border-slate-800 shadow-2xs"
          />
        </div>

        {/* Target Audience / NSE */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-slate-500" />
            Público Objetivo & Nivel Socioeconómico (NSE)
          </label>
          <input
            type="text"
            value={reach.targetAudience || ''}
            onChange={(e) => handleUpdateField('targetAudience', e.target.value)}
            placeholder="ej. Segmento ABC+ · Ejecutivos, Familias y Comercio"
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800/10 focus:border-slate-800 shadow-2xs"
          />
        </div>

        {/* Coverage Zone */}
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            Zona de Cobertura / Corredor Vial
          </label>
          <input
            type="text"
            value={reach.coverageZone || ''}
            onChange={(e) => handleUpdateField('coverageZone', e.target.value)}
            placeholder="ej. Eje Autopista Gran Cacique Guaicaipuro (Chacao - Altamira - Petare)"
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800/10 focus:border-slate-800 shadow-2xs"
          />
        </div>

        {/* Dwell Time */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-slate-500" />
            Tiempo de Exposición (Dwell Time)
          </label>
          <input
            type="text"
            value={reach.dwellTime || ''}
            onChange={(e) => handleUpdateField('dwellTime', e.target.value)}
            placeholder="ej. 12 - 18 segundos promedio (Retención)"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#e31b38] focus:border-[#e31b38]"
          />
        </div>

        {/* Points of Interest */}
        <div className="flex flex-col gap-1">
          <label className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Map className="w-3.5 h-3.5 text-teal-500" />
            Puntos de Interés Cercanos
          </label>
          <input
            type="text"
            value={reach.pointsOfInterest || ''}
            onChange={(e) => handleUpdateField('pointsOfInterest', e.target.value)}
            placeholder="ej. C.C. San Ignacio, Torre Cavendes, Plaza Altamira"
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#e31b38] focus:border-[#e31b38]"
          />
        </div>
      </div>

      {/* Coverage Graphic / Reach Map Upload */}
      <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
        <label className="text-xs font-semibold text-slate-700 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <FileImage className="w-3.5 h-3.5 text-[#e31b38]" />
            Cargar Gráfico de Alcance o Mapa de Cobertura (Opcional)
          </span>
          {reach.graphicUrl && (
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Imagen cargada
            </span>
          )}
        </label>

        {reach.graphicUrl ? (
          <div className="flex items-center gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded-xl">
            <img
              src={reach.graphicUrl}
              alt="Gráfico de Alcance"
              className="w-16 h-12 object-cover rounded-lg border border-slate-200 shadow-2xs"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-800 truncate">
                {reach.graphicName || 'Grafico_Alcance_Cobertura.png'}
              </p>
              <p className="text-[11px] text-slate-500">
                Gráfico incorporado para catálogo y ficha técnica
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemoveGraphic}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              title="Eliminar gráfico"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-200 hover:border-[#e31b38]/50 hover:bg-rose-50/20 rounded-xl p-3.5 text-center cursor-pointer transition-colors group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/jpg"
              onChange={handleGraphicUpload}
              className="hidden"
            />
            <Upload className="w-5 h-5 mx-auto text-slate-400 group-hover:text-[#e31b38] transition-colors mb-1" />
            <p className="text-xs font-semibold text-slate-700 group-hover:text-slate-900">
              Haz clic para cargar diagrama de alcance o mapa de influencia
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              PNG, JPG o WebP · Mapa de calor, radio vial o infografía de audiencia
            </p>
          </div>
        )}
      </div>

      {/* Dynamic Generated Analytics Chart Preview for PDF */}
      <div className="flex flex-col gap-2 p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e31b38]" />
            <span className="text-xs font-semibold text-slate-800">
              Gráfico Analítico para el PDF
            </span>
          </div>
          <span className="text-[10px] font-medium text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
            Generación Automática
          </span>
        </div>
        <p className="text-[11px] text-slate-500">
          Calculado en tiempo real con los números de impactos y tráfico ingresados:
        </p>

        {/* Live Chart Rendering */}
        <div className="bg-white rounded-lg border border-slate-200 p-1 overflow-hidden shadow-2xs">
          <img
            src={generateReachChartDataUrl(reach, 800, 280)}
            alt="Gráfico de Alcance e Impacto"
            className="w-full h-auto object-contain rounded"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-[11px] text-slate-600 font-medium">
            Incluir este gráfico de audiencia en el documento PDF
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={reach.includeChartInPdf !== false}
              onChange={(e) => handleUpdateField('includeChartInPdf', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-slate-900"></div>
          </label>
        </div>
      </div>

      {/* Options: Show on Canvas Toggle */}
      <div className="flex items-center justify-between p-3 bg-slate-50/70 border border-slate-200/80 rounded-xl">
        <div className="flex flex-col">
          <span className="text-xs font-semibold text-slate-800">
            Destacar alcance en el distintivo de la Ficha Técnica
          </span>
          <span className="text-[11px] text-slate-500">
            Muestra el indicador de impactos en el lienzo visual de la unidad
          </span>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={reach.showOnCanvas !== false}
            onChange={(e) => handleUpdateField('showOnCanvas', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-8 h-4.5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-3.5 after:w-3.5 after:transition-all peer-checked:bg-slate-900"></div>
        </label>
      </div>
    </div>
  );
};
